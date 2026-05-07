'use strict';

const { Events, MessageFlags } = require('discord.js');
const { handleCombatButton } = require('../services/combat.service');
const { handleDungeonNext, startDungeon, showDungeonSelection } = require('../services/dungeon.service');
const { getPendingLoot, deletePendingLoot, deleteDungeonState, deleteCombatState } = require('../cache/redis');
const { applyLoot } = require('../engines/lootEngine');
const { buildLeaderboardEmbed } = require('../services/infoPanel.service');
const { buildWikiEmbed } = require('../services/wiki.service');
const { equipItem, sellItem, getInventory, getOrCreateLoadout, unequipSlot, useConsumable } = require('../services/inventory.service');
const { sellToMerchant, createAuction, placeBid, finaliseBuyout } = require('../services/market.service');
const { buyFromShop } = require('../services/merchant.service');
const {
  createPrime,
  joinPrime,
  leavePrime,
  startPrime,
  handlePrimeAttack,
  handlePrimeItemOpen,
  handlePrimeItemSelect,
  handleNextRoom,
  handleClaimLoot,
  handlePrimeLootChoice,
  handleRestItemOpen,
  handleRestItemUse,
} = require('../services/prime.service');
const { getAP } = require('../services/actionPoints.service');
const { errorEmbed } = require('../utils/embed');
const { prisma } = require('../db/prisma');

const ALL_BOT_COMMANDS = ['start', 'profile', 'inventory', 'setup', 'dungeon', 'prime'];

async function getGuildChannels(guildId) {
  return prisma.guildChannels.findUnique({ where: { guildId } });
}

async function resolveCharacterId(interaction) {
  const character = await prisma.character.findUnique({
    where: { userId_guildId: { userId: interaction.user.id, guildId: interaction.guildId } },
    select: { id: true },
  });
  return character?.id ?? null;
}

async function refreshInventoryReply(interaction, characterId, method = 'update') {
  const { buildInventoryMessage } = require('../utils/embed');
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  const [charItems, loadout, ap] = await Promise.all([
    getInventory(characterId),
    getOrCreateLoadout(characterId),
    getAP(characterId),
  ]);
  const { embed, rows } = buildInventoryMessage(character, charItems, loadout, ap);
  return method === 'update'
    ? interaction.update({ embeds: [embed], components: rows })
    : interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
}

module.exports = {
  name: Events.InteractionCreate,

  async execute(interaction) {
    // ── Slash commands ─────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.warn(`[Interaction] Commande inconnue: ${interaction.commandName}`);
        return;
      }

      if (interaction.guildId && ALL_BOT_COMMANDS.includes(interaction.commandName)) {
        const channels = await getGuildChannels(interaction.guildId);
        if (channels?.categoryId) {
          const channel = interaction.guild?.channels.cache.get(interaction.channelId);

          if (channel?.parentId !== channels.categoryId) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            return interaction.deleteReply();
          }

          if (interaction.commandName === 'dungeon' && channels.dungeonChannelId && interaction.channelId !== channels.dungeonChannelId) {
            return interaction.reply({
              embeds: [errorEmbed(`La commande \`/dungeon\` est réservée à <#${channels.dungeonChannelId}>.`)],
              flags: MessageFlags.Ephemeral,
            });
          }

          if (interaction.commandName === 'prime' && channels.dungeonChannelId && interaction.channelId !== channels.dungeonChannelId) {
            return interaction.reply({
              embeds: [errorEmbed(`La commande \`/prime\` est réservée à <#${channels.dungeonChannelId}>.`)],
              flags: MessageFlags.Ephemeral,
            });
          }
        }
      }

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`[Command/${interaction.commandName}]`, err);
        const reply = { embeds: [errorEmbed('Une erreur inattendue est survenue.')], flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
      return;
    }

    // ── Select menu interactions ───────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'info_scope') {
        await interaction.deferUpdate();
        try {
          const scope = interaction.values[0];
          const payload = await buildLeaderboardEmbed(interaction.guild, scope);
          await interaction.editReply(payload);
        } catch (err) {
          console.error('[InfoPanel/select]', err);
        }
      } else if (interaction.customId === 'inventory_action') {
        try {
          const itemId      = interaction.values[0].split(':')[1];
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          const result = await equipItem(characterId, itemId);
          if (!result.success) {
            return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
          }
          await refreshInventoryReply(interaction, characterId);
        } catch (err) {
          console.error('[Inventory/equip]', err);
        }
      } else if (interaction.customId === 'inventory_sell_choice') {
        try {
          const itemId  = interaction.values[0].split(':')[1];
          const { ITEMS } = require('../data/items');
          const { buildSellChoiceRow } = require('../utils/embed');
          const { EmbedBuilder } = require('discord.js');
          const itemDef    = ITEMS[itemId];
          const sellPrice  = Math.max(1, Math.floor((itemDef?.price ?? 0) * 0.1));
          const embed = new EmbedBuilder()
            .setTitle('🪙 Vendre un item')
            .setDescription(
              `> Item : **${itemDef?.name ?? itemId}**\n` +
              `> Vente marchant : **${sellPrice}** 🪙 *(10 % du prix de base)*\n` +
              '> Enchère : tu définis le prix toi-même\n' +
              '> Les deux options consomment **1 PA**.',
            )
            .setColor(0xf39c12);
          await interaction.reply({ embeds: [embed], components: [buildSellChoiceRow(itemId)], flags: MessageFlags.Ephemeral });
        } catch (err) {
          console.error('[Inventory/sell_choice]', err);
        }
      } else if (interaction.customId === 'inventory_use') {
        try {
          const itemId      = interaction.values[0].split(':')[1];
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          const result = await useConsumable(characterId, itemId);
          if (!result.success) {
            return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
          }
          // Refresh inventory to show updated quantities
          await refreshInventoryReply(interaction, characterId);
          // Also send a confirmation (ephemeral follow-up since update consumed the interaction)
          await interaction.followUp({ embeds: [{ color: 0x2ecc71, description: `✅ ${result.message}` }], flags: MessageFlags.Ephemeral });
        } catch (err) {
          console.error('[Inventory/use]', err);
        }
      } else if (interaction.customId === 'wiki_section') {
        await interaction.deferUpdate();
        try {
          const section = interaction.values[0];
          const payload = await buildWikiEmbed(interaction.guild, section);
          await interaction.editReply(payload);
        } catch (err) {
          console.error('[Wiki/select]', err);
        }
      } else if (interaction.customId === 'combat_consumable') {
        const itemId = interaction.values[0];
        interaction.customId = `combat_item_${itemId}`;
        return await handleCombatButton(interaction);
      } else if (interaction.customId === 'shop_buy' || interaction.customId === 'shop_buy_equip' || interaction.customId === 'shop_buy_cons') {
        try {
          const itemId      = interaction.values[0];
          const guildId     = interaction.guildId;
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const result = await buyFromShop(characterId, itemId, guildId, interaction.client);
          const color  = result.success ? 0x2ecc71 : 0xe74c3c;
          return interaction.editReply({ embeds: [{ color, description: result.success ? `✅ ${result.message}` : `❌ ${result.message}` }] });
        } catch (err) {
          console.error('[Shop/buy]', err);
        }
      } else if (interaction.customId === 'prime_select') {
        try {
          const primeId = parseInt(interaction.values[0], 10);
          return await createPrime(interaction, primeId);
        } catch (err) {
          console.error('[Prime/select]', err);
        }
      } else if (interaction.customId.startsWith('prime_item_select:')) {
        try {
          const primeRunId = parseInt(interaction.customId.split(':')[1], 10);
          return await handlePrimeItemSelect(interaction, primeRunId);
        } catch (err) {
          console.error('[Prime/item_select]', err);
        }
      } else if (interaction.customId.startsWith('prime_rest_item_select:')) {
        try {
          const primeRunId = parseInt(interaction.customId.split(':')[1], 10);
          return await handleRestItemUse(interaction, primeRunId);
        } catch (err) {
          console.error('[Prime/rest_item_select]', err);
        }
      } else if (interaction.customId === 'dungeon_select') {
        try {
          const chapter     = parseInt(interaction.values[0], 10);
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          return await startDungeon(interaction, chapter, characterId);
        } catch (err) {
          console.error('[Dungeon/select]', err);
        }
      }
      return;
    }

    // ── Modal submissions ──────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const { customId } = interaction;

      if (customId === 'start_modal') {
        const startCmd = interaction.client.commands.get('start');
        if (startCmd?.handleModal) return startCmd.handleModal(interaction);
        return;
      }

      if (customId.startsWith('market_auction_modal:')) {
        const [, itemId, duration] = customId.split(':');
        const guildId     = interaction.guildId;
        const characterId = await resolveCharacterId(interaction);
        if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });

        const startPrice  = parseInt(interaction.fields.getTextInputValue('start_price'), 10);
        const buyoutRaw   = interaction.fields.getTextInputValue('buyout_price');
        const buyoutPrice = buyoutRaw ? parseInt(buyoutRaw, 10) : null;

        if (isNaN(startPrice) || startPrice < 1) {
          return interaction.reply({ embeds: [errorEmbed('Prix de départ invalide.')], flags: MessageFlags.Ephemeral });
        }
        if (buyoutPrice !== null && (isNaN(buyoutPrice) || buyoutPrice <= startPrice)) {
          return interaction.reply({ embeds: [errorEmbed('Le prix d\'achat direct doit être supérieur au prix de départ.')], flags: MessageFlags.Ephemeral });
        }

        const result = await createAuction(characterId, itemId, guildId, startPrice, buyoutPrice, duration, interaction.client);
        if (!result.success) {
          return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
        }
        return refreshInventoryReply(interaction, characterId, 'reply');
      }

      if (customId.startsWith('market_bid_modal:')) {
        const listingId   = parseInt(customId.split(':')[1], 10);
        const amount      = parseInt(interaction.fields.getTextInputValue('bid_amount'), 10);
        const characterId = await resolveCharacterId(interaction);
        if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });

        if (isNaN(amount) || amount < 1) {
          return interaction.reply({ embeds: [errorEmbed('Montant invalide.')], flags: MessageFlags.Ephemeral });
        }

        const result = await placeBid(characterId, listingId, amount, interaction.client);
        if (!result.success) {
          return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({ embeds: [errorEmbed(`✅ ${result.message}`)], flags: MessageFlags.Ephemeral });
      }

      return;
    }

    // ── Button interactions ────────────────────────────────────────────────
    if (interaction.isButton()) {
      const { customId } = interaction;

      try {
        // ── Prime buttons ──────────────────────────────────────────────────
        if (customId.startsWith('prime_join:')) {
          const primeRunId = parseInt(customId.split(':')[1], 10);
          return await joinPrime(interaction, primeRunId);
        }

        if (customId.startsWith('prime_leave:')) {
          const primeRunId = parseInt(customId.split(':')[1], 10);
          return await leavePrime(interaction, primeRunId);
        }

        if (customId.startsWith('prime_start:')) {
          const primeRunId = parseInt(customId.split(':')[1], 10);
          return await startPrime(interaction, primeRunId);
        }

        if (customId.startsWith('prime_attack:')) {
          const parts       = customId.split(':');
          const primeRunId  = parseInt(parts[1], 10);
          const targetIndex = parseInt(parts[2], 10);
          return await handlePrimeAttack(interaction, primeRunId, targetIndex);
        }

        if (customId.startsWith('prime_item_open:')) {
          const primeRunId = parseInt(customId.split(':')[1], 10);
          return await handlePrimeItemOpen(interaction, primeRunId);
        }

        if (customId.startsWith('prime_rest_item:')) {
          const primeRunId = parseInt(customId.split(':')[1], 10);
          return await handleRestItemOpen(interaction, primeRunId);
        }

        if (customId.startsWith('prime_next_room:')) {
          const primeRunId = parseInt(customId.split(':')[1], 10);
          return await handleNextRoom(interaction, primeRunId);
        }

        if (customId.startsWith('prime_claim_loot:')) {
          const primeRunId = parseInt(customId.split(':')[1], 10);
          return await handleClaimLoot(interaction, primeRunId);
        }

        if (customId.startsWith('prime_loot:')) {
          const idx = parseInt(customId.split(':')[1], 10);
          return await handlePrimeLootChoice(interaction, idx);
        }

        if (customId.startsWith('unequip:')) {
          const slot        = customId.split(':')[1];
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          const result = await unequipSlot(characterId, slot);
          if (!result.success) {
            return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
          }
          return refreshInventoryReply(interaction, characterId);
        }

        if (customId === 'info_leaderboard') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const payload = await buildLeaderboardEmbed(interaction.guild, 'server_level');
          return interaction.editReply(payload);
        }

        if (customId === 'info_wiki') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const payload = await buildWikiEmbed(interaction.guild, 'gameplay');
          return interaction.editReply(payload);
        }

        if (customId.startsWith('market_merchant:')) {
          const itemId      = customId.split(':')[1];
          const guildId     = interaction.guildId;
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          const result = await sellToMerchant(characterId, itemId, guildId, interaction.client);
          if (!result.success) {
            return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
          }
          await refreshInventoryReply(interaction, characterId);
          return interaction.followUp({ embeds: [{ color: 0x2ecc71, description: `✅ ${result.message}` }], flags: MessageFlags.Ephemeral });
        }

        if (customId.startsWith('market_auction_start:')) {
          const itemId = customId.split(':')[1];
          const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
          const { ITEMS } = require('../data/items');
          const itemDef = ITEMS[itemId];
          const embed = new EmbedBuilder()
            .setTitle('🔨 Nouvelle enchère')
            .setDescription(
              `> Item : **${itemDef?.name ?? itemId}**\n` +
              '> Choisis la durée de l\'enchère.\n' +
              '> Tu devras ensuite définir le prix de départ via le modal.',
            )
            .setColor(0xf39c12);
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`market_auction_dur:${itemId}:1h`).setLabel('1 heure').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`market_auction_dur:${itemId}:6h`).setLabel('6 heures').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId(`market_auction_dur:${itemId}:24h`).setLabel('24 heures').setStyle(ButtonStyle.Secondary),
          );
          return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
        }

        if (customId.startsWith('market_auction_dur:')) {
          const [, itemId, duration] = customId.split(':');
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: AR } = require('discord.js');
          const modal = new ModalBuilder()
            .setCustomId(`market_auction_modal:${itemId}:${duration}`)
            .setTitle('Paramètres de l\'enchère');
          modal.addComponents(
            new AR().addComponents(
              new TextInputBuilder().setCustomId('start_price').setLabel('Prix de départ (or)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ex: 50'),
            ),
            new AR().addComponents(
              new TextInputBuilder().setCustomId('buyout_price').setLabel('Prix d\'achat direct (laisser vide si non)').setStyle(TextInputStyle.Short).setRequired(false).setPlaceholder('ex: 200'),
            ),
          );
          return interaction.showModal(modal);
        }

        if (customId.startsWith('market_bid:')) {
          const listingId = parseInt(customId.split(':')[1], 10);
          const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder: AR } = require('discord.js');
          const modal = new ModalBuilder()
            .setCustomId(`market_bid_modal:${listingId}`)
            .setTitle('Placer une enchère');
          modal.addComponents(
            new AR().addComponents(
              new TextInputBuilder().setCustomId('bid_amount').setLabel('Montant de ton enchère (or)').setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder('ex: 100'),
            ),
          );
          return interaction.showModal(modal);
        }

        if (customId.startsWith('market_buyout:')) {
          const listingId   = parseInt(customId.split(':')[1], 10);
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          const result = await finaliseBuyout(characterId, listingId, interaction.client);
          if (!result.success) {
            return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
          }
          return interaction.reply({ embeds: [errorEmbed(`✅ ${result.message}`)], flags: MessageFlags.Ephemeral });
        }

        if (customId.startsWith('loot_')) {
          const idx         = parseInt(customId.split('_')[1], 10);
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });

          await interaction.deferUpdate();
          const { EmbedBuilder } = require('discord.js');
          const { ITEMS } = require('../data/items');
          const options = await getPendingLoot(characterId);
          const chosen  = options?.[idx] ?? null;

          if (chosen) {
            await applyLoot(prisma, characterId, chosen);
          }
          await deletePendingLoot(characterId);

          const itemName = chosen ? (ITEMS[chosen]?.name ?? chosen) : 'rien';
          const embed = new EmbedBuilder()
            .setTitle('🎁 Butin récupéré')
            .setDescription(`Vous avez obtenu : **${itemName}**`)
            .setColor(0xf1c40f);
          return interaction.editReply({ embeds: [embed], components: [] });
        }

        if (customId.startsWith('combat_')) {
          return await handleCombatButton(interaction);
        }

        if (customId === 'dungeon_next') {
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          return await handleDungeonNext(interaction, characterId);
        }

        if (customId.startsWith('dungeon_start:')) {
          const chapter     = parseInt(customId.split(':')[1], 10);
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          return await startDungeon(interaction, chapter, characterId);
        }

        if (customId === 'dungeon_abandon') {
          const characterId = await resolveCharacterId(interaction);
          if (!characterId) return interaction.reply({ embeds: [errorEmbed('Personnage introuvable.')], flags: MessageFlags.Ephemeral });
          await interaction.deferUpdate();
          await deleteDungeonState(characterId);
          await deleteCombatState(characterId);
          await prisma.dungeonRun.updateMany({
            where: { characterId, status: 'active' },
            data: { status: 'failed' },
          });
          return await showDungeonSelection(interaction, characterId);
        }

        console.warn(`[Button] customId non géré: ${customId}`);
      } catch (err) {
        console.error(`[Button/${customId}]`, err);
        const reply = { embeds: [errorEmbed('Une erreur inattendue est survenue.')], flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply).catch(() => {});
        } else {
          await interaction.reply(reply).catch(() => {});
        }
      }
    }
  },
};
