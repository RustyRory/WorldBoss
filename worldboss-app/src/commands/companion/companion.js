'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { characterExists, getCharacter } = require('../../services/player.service');
const { getCompanion, listAvailableSpecies } = require('../../services/companion.service');
const { buildCompanionEmbed, buildCompanionShopMessage, errorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('companion')
    .setDescription('Affiche ton compagnon de combat, ou choisis-en un chez le dresseur.'),

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
      const companion  = await getCompanion(character.id);

      if (companion) {
        return interaction.reply({ embeds: [buildCompanionEmbed(companion)], flags: MessageFlags.Ephemeral });
      }

      const available = listAvailableSpecies(character.level);
      const { embed, rows } = buildCompanionShopMessage(character, available);
      return interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('[/companion]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors de la récupération du compagnon.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
