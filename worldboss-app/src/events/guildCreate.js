'use strict';

const { Events, EmbedBuilder } = require('discord.js');
const {
  ensureGuildInDb,
  initGuildChannels,
  updateGuildChannels,
} = require('../services/guild.service');

module.exports = {
  name: Events.GuildCreate,
  once: false,

  async execute(guild) {
    console.log(`[Guild] Rejoint : ${guild.name} (${guild.id})`);

    try {
      await ensureGuildInDb(guild);
      const channelIds = await initGuildChannels(guild);
      await updateGuildChannels(guild.id, channelIds);

      const infoChannel = guild.channels.cache.get(channelIds.infoChannelId);
      if (infoChannel) {
        const embed = new EmbedBuilder()
          .setTitle('⚔️ Une nouvelle guilde entre dans la légende…')
          .setDescription(
            'Le bot **WorldBoss** s\'installe sur ce serveur.\n\n' +
            '**Channels créés :**\n' +
            `📌 <#${channelIds.infoChannelId}> — Infos & statut du bot\n` +
            `💬 <#${channelIds.generalChannelId}> — Tchat général\n` +
            `🎮 <#${channelIds.commandChannelId}> — Commandes du bot\n` +
            `⚔️ <#${channelIds.dungeonChannelId}> — Battle (donjons, pvp, ...)\n\n` +
            '**Premiers pas :**\n' +
            '`/start` — Créer votre personnage\n' +
            '`/dungeon` — Explorer un donjon\n' +
            '`/profile` — Consulter vos statistiques',
          )
          .setColor(0x8b0000)
          .setFooter({ text: 'Que vos lames ne faiblissent jamais.' });

        await infoChannel.send({ embeds: [embed] });
      }

      console.log(`[Guild] Serveur ${guild.name} initialisé.`);
    } catch (err) {
      console.error(`[Guild] Erreur initialisation ${guild.name}:`, err.message);
    }
  },
};
