'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { characterExists, getCharacter } = require('../../services/player.service');
const { startOrResumeDungeon } = require('../../services/dungeon.service');
const { errorEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dungeon')
    .setDescription('Lance ou reprend un donjon solo.'),

  async execute(interaction) {
    const userId  = interaction.user.id;
    const guildId = interaction.guildId;

    try {
      if (!(await characterExists(userId, guildId))) {
        return interaction.reply({
          embeds: [errorEmbed('Vous devez créer un personnage avec `/start` avant de jouer.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const character = await getCharacter(userId, guildId);
      await startOrResumeDungeon(interaction, character.id);
    } catch (err) {
      console.error('[/dungeon]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors du lancement du donjon.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
