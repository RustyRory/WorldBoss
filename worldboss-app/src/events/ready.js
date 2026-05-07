'use strict';

const { Events } = require('discord.js');
const { ensureItemsSeeded } = require('../services/player.service');
const { ensureGuildInDb, initGuildChannels, updateGuildChannels } = require('../services/guild.service');
const { refreshInfoPanel } = require('../services/infoPanel.service');
const { getOrCreateShop, restoreMerchantShops } = require('../services/merchant.service');

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    console.log(`[Bot] Connecté en tant que ${client.user.tag}`);

    try {
      await ensureItemsSeeded();
      console.log('[DB] Items synchronisés.');
    } catch (err) {
      console.error('[DB] Erreur lors de la synchronisation des items:', err.message);
    }

    // Force le fetch de tous les serveurs (le cache peut être incomplet au démarrage)
    await client.guilds.fetch().catch((err) => console.error('[Setup] Erreur fetch guilds:', err.message));

    for (const guild of client.guilds.cache.values()) {
      try {
        await guild.fetch();
        await ensureGuildInDb(guild);
        const channelIds = await initGuildChannels(guild);
        await updateGuildChannels(guild.id, channelIds);
        if (channelIds.infoChannelId) {
          await refreshInfoPanel(client, guild, channelIds.infoChannelId);
        }
        // Initialise la boutique si elle n'existe pas encore
        if (channelIds.marketChannelId) {
          await getOrCreateShop(guild.id, client);
        }
        console.log(`[Setup] Serveur initialisé : ${guild.name}`);
      } catch (err) {
        console.error(`[Setup] Erreur sur ${guild.name}:`, err.message);
      }
    }

    // Reprogramme les resets en attente (en cas de redémarrage)
    try {
      await restoreMerchantShops(client);
      console.log('[Merchant] Boutiques restaurées.');
    } catch (err) {
      console.error('[Merchant] Erreur restauration boutiques:', err.message);
    }
  },
};
