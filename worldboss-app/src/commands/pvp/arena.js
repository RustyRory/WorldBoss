'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { characterExists, getCharacter } = require('../../services/player.service');
const { getOrCreateArenaProfile, checkArenaAccess } = require('../../services/arena.service');
const { getArenaQueue } = require('../../cache/redis');
const { buildArenaHomeMessage, errorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arena')
    .setDescription('Défie un joueur en duel amical ou rejoins la file classée de l\'arène.'),

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

      const [profile, queue] = await Promise.all([
        getOrCreateArenaProfile(character.id),
        getArenaQueue(guildId),
      ]);
      const queued = queue.some((q) => q.characterId === character.id);

      const { embed, rows } = buildArenaHomeMessage(character, profile, queued);
      return interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('[/arena]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors de la récupération de l\'arène.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
