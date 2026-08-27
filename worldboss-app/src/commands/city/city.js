'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { characterExists, getCharacter } = require('../../services/player.service');
const { getCityWithBuildings, donateResource, startConstruction } = require('../../services/city.service');
const { BUILDINGS } = require('../../data/buildings');
const { buildCityEmbed, errorEmbed, successEmbed } = require('../../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('city')
    .setDescription('Gère la cité commune du serveur — ressources et bâtiments.')
    .addSubcommand((sub) => sub.setName('view').setDescription('Voir la cité du serveur'))
    .addSubcommand((sub) =>
      sub.setName('donate')
        .setDescription('Donner des ressources personnelles à la cité')
        .addStringOption((opt) =>
          opt.setName('ressource').setDescription('Ressource à donner').setRequired(true)
            .addChoices(
              { name: 'Bois', value: 'wood' },
              { name: 'Pierre', value: 'stone' },
              { name: 'Fer', value: 'iron' },
              { name: 'Vivres', value: 'food' },
            ),
        )
        .addIntegerOption((opt) => opt.setName('quantite').setDescription('Quantité à donner').setRequired(true).setMinValue(1)),
    )
    .addSubcommand((sub) =>
      sub.setName('build')
        .setDescription('Lancer la construction/amélioration d\'un bâtiment')
        .addStringOption((opt) =>
          opt.setName('batiment').setDescription('Bâtiment à construire/améliorer').setRequired(true)
            .addChoices(...Object.values(BUILDINGS).map((b) => ({ name: b.name, value: b.id }))),
        ),
    ),

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

      const sub = interaction.options.getSubcommand();

      if (sub === 'view') {
        const city = await getCityWithBuildings(guildId);
        return interaction.reply({ embeds: [buildCityEmbed(city)] });
      }

      const character = await getCharacter(userId, guildId);

      if (sub === 'donate') {
        const resource = interaction.options.getString('ressource', true);
        const quantity = interaction.options.getInteger('quantite', true);
        const result = await donateResource(character.id, guildId, resource, quantity);
        if (!result.success) {
          return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({ embeds: [successEmbed(result.message)] });
      }

      if (sub === 'build') {
        const building = interaction.options.getString('batiment', true);
        const result = await startConstruction(guildId, building, interaction.client);
        if (!result.success) {
          return interaction.reply({ embeds: [errorEmbed(result.message)], flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({ embeds: [successEmbed(result.message)] });
      }
    } catch (err) {
      console.error('[/city]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors de la gestion de la cité.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
