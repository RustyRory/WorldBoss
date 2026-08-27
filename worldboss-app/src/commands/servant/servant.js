'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { characterExists, getCharacter } = require('../../services/player.service');
const { getServant } = require('../../services/servant.service');
const { buildServantMessage, errorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servant')
    .setDescription('Gère ton serviteur — recrutement, mine d\'or, entraînement.'),

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
      const servant    = await getServant(character.id);
      const { embed, rows } = buildServantMessage(character, servant);

      return interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('[/servant]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors de la récupération du serviteur.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
