'use strict';

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getCharacter, characterExists, computeRegenedHp } = require('../../services/player.service');
const { computeStats, xpRequired } = require('../../utils/stats');
const { buildProfileEmbed, errorEmbed } = require('../../utils/embed');
const { getAP } = require('../../services/actionPoints.service');
const { prisma } = require('../../db/prisma');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Affiche ton profil et tes statistiques.'),

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
      const [ap] = await Promise.all([getAP(character.id)]);
      const stats  = computeStats(character, character.loadout);
      const xpReq  = xpRequired(character.level);
      const maxHp  = stats.hp;

      // Apply passive HP regen and persist if changed
      const regenedHp = computeRegenedHp(character.hp, character.hpUpdatedAt, maxHp);
      if (regenedHp !== character.hp) {
        await prisma.character.update({
          where: { id: character.id },
          data: { hp: regenedHp, hpUpdatedAt: new Date() },
        });
        character.hp = regenedHp;
      }

      const embed = buildProfileEmbed(character, stats, character.loadout, xpReq, interaction, ap);

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('[/profile]', err);
      return interaction.reply({
        embeds: [errorEmbed('Erreur lors de la récupération du profil.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
