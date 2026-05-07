'use strict';

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const { createPrime } = require('../../services/prime.service');
const { errorEmbed }  = require('../../utils/embed');
const { PRIMES }      = require('../../data/primes');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prime')
    .setDescription('Lance une expédition de groupe (Prime) dans un donjon élite.'),

  async execute(interaction) {
    const guildId = interaction.guildId;
    if (!guildId) {
      return interaction.reply({ embeds: [errorEmbed('Commande serveur uniquement.')], flags: MessageFlags.Ephemeral });
    }

    const primeList = Object.values(PRIMES);
    if (primeList.length === 1) {
      // Only one prime available — skip the selection menu
      return createPrime(interaction, primeList[0].id);
    }

    // Multiple primes — show selection menu
    const embed = new EmbedBuilder()
      .setTitle('🏆 Choisir une Prime')
      .setDescription(
        primeList.map((p) =>
          `**${p.name}** — Niv. ${p.levelRequired} requis\n> *${p.lore.slice(0, 80)}…*`,
        ).join('\n\n'),
      )
      .setColor(0xe74c3c)
      .setFooter({ text: 'Il faut 4 joueurs pour lancer une prime · Coût : 1 PA par joueur' });

    const select = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('prime_select')
        .setPlaceholder('Choisir une prime…')
        .addOptions(primeList.map((p) => ({
          label: p.name,
          description: `Niveau ${p.levelRequired} requis · ${p.rooms.length} salles`,
          value: `${p.id}`,
        }))),
    );

    return interaction.reply({ embeds: [embed], components: [select], flags: MessageFlags.Ephemeral });
  },
};
