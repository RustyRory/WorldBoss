'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const {
  ensureGuildInDb,
  initGuildChannels,
  updateGuildChannels,
} = require('../../services/guild.service');
const { getOrCreateShop } = require('../../services/merchant.service');
const { refreshInfoPanel } = require('../../services/infoPanel.service');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('(Admin) Initialise ou réinitialise les channels WorldBoss du serveur.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.guildId) {
      return interaction.reply({ content: '❌ Commande serveur uniquement.', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await ensureGuildInDb(interaction.guild);
      const channelIds = await initGuildChannels(interaction.guild);
      await updateGuildChannels(interaction.guildId, channelIds);

      if (channelIds.infoChannelId) {
        await refreshInfoPanel(interaction.client, interaction.guild, channelIds.infoChannelId);
      }
      if (channelIds.marketChannelId) {
        await getOrCreateShop(interaction.guildId, interaction.client);
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Serveur configuré !')
        .setDescription(
          'Les channels ont été créés ou remis à jour.\n\n' +
          `📌 Info : <#${channelIds.infoChannelId}>\n` +
          `💬 Général : <#${channelIds.generalChannelId}>\n` +
          `⚔️ Battle : <#${channelIds.dungeonChannelId}>\n` +
          `🪙 Marché : <#${channelIds.marketChannelId}>`,
        )
        .setColor(0x27ae60);

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[Setup] Erreur:', err.message);
      return interaction.editReply({ content: `❌ Erreur lors du setup : ${err.message}` });
    }
  },
};
