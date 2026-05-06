'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { characterExists, getCharacter } = require('../../services/player.service');
const { getInventory, getOrCreateLoadout } = require('../../services/inventory.service');
const { buildInventoryMessage, errorEmbed } = require('../../utils/embed');
const { getAP } = require('../../services/actionPoints.service');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Affiche ton inventaire et ton équipement actuel.'),

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
      const characterId = character.id;

      const [charItems, loadout, ap] = await Promise.all([
        getInventory(characterId),
        getOrCreateLoadout(characterId),
        getAP(characterId),
      ]);

      const { embed, rows } = buildInventoryMessage(character, charItems, loadout, ap);

      return interaction.reply({ embeds: [embed], components: rows, flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('[/inventory]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors de la récupération de l\'inventaire.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
