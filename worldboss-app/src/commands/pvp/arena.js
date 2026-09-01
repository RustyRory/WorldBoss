'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { characterExists, getCharacter } = require('../../services/player.service');
const { getOrCreateArenaProfile, checkArenaAccess } = require('../../services/arena.service');
const { getArenaQueue, getArenaTeamLobby } = require('../../cache/redis');
const { buildArenaHomeMessage, buildArenaTeamLobbyMessage, errorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arena')
    .setDescription('Arène PvP — duel 1v1 (même serveur) ou 4v4 inter-serveurs.')
    .addSubcommand((sub) => sub.setName('1v1').setDescription('Défier un joueur ou rejoindre la file classée 1v1'))
    .addSubcommand((sub) => sub.setName('team').setDescription('Rejoindre/voir le groupe 4v4 inter-serveurs')),

  async execute(interaction) {
    const userId  = interaction.user.id;
    const guildId = interaction.guildId;

    try {
      if (!(await characterExists(userId, guildId))) {
        return interaction.reply({
          embeds: [errorEmbed('Vous n\'avez pas encore de personnage sur ce serveur. Utilisez `/start` pour commencer !')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const character = await getCharacter(userId, guildId);
      const access = checkArenaAccess(character);
      if (!access.ok) {
        return interaction.reply({ embeds: [errorEmbed(access.message)], flags: MessageFlags.Ephemeral });
      }

      const sub = interaction.options.getSubcommand();

      if (sub === '1v1') {
        const [profile, queue] = await Promise.all([
          getOrCreateArenaProfile(character.id),
          getArenaQueue(guildId),
        ]);
        const queued = queue.some((q) => q.characterId === character.id);
        const { embed, rows } = buildArenaHomeMessage(character, profile, queued);
        return interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
      }

      if (sub === 'team') {
        const lobby = await getArenaTeamLobby(guildId);
        const { embed, rows } = buildArenaTeamLobbyMessage(lobby);
        return interaction.reply({ embeds: [embed], components: rows });
      }
    } catch (err) {
      console.error('[/arena]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors de la récupération de l\'arène.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
