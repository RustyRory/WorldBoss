'use strict';

const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { characterExists, createCharacter } = require('../../services/player.service');
const { computeStats, xpRequired } = require('../../utils/stats');
const { errorEmbed } = require('../../utils/embed');

const SEP = '┄'.repeat(32);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Crée ton personnage et commence l\'aventure !'),

  async execute(interaction) {
    const userId   = interaction.user.id;
    const guildId  = interaction.guildId;
    const username = interaction.user.username;

    try {
      if (await characterExists(userId, guildId)) {
        return interaction.reply({
          embeds: [errorEmbed('Tu as déjà un personnage sur ce serveur ! Utilise `/profile` pour voir tes stats.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const { character, loadout } = await createCharacter(userId, username, guildId);
      const stats = computeStats(character, loadout);
      const xpReq = xpRequired(character.level);

      const embed = new EmbedBuilder()
        .setTitle('⚔️  WorldBoss — Ton aventure commence !')
        .setDescription(
          `> Bienvenue, **${username}** !\n` +
          '> Tu viens de créer ton personnage et de recevoir ton équipement de départ.\n' +
          '> Explore les donjons, bats des ennemis et monte en puissance.\n' +
          `\`${SEP}\``,
        )
        .setColor(0x2ecc71)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
        .addFields(
          {
            name: '🧑 Personnage',
            value: [
              `> Nom    **${username}**`,
              `> Niveau **${character.level}**`,
              `> XP     **0** / ${xpReq}`,
              `> Or     **${character.gold}** 🪙`,
            ].join('\n'),
            inline: true,
          },
          {
            name: '📊 Statistiques',
            value: [
              `> ❤️  HP   **${stats.hp}**`,
              `> ⚔️  ATK  **${stats.atk}**`,
              `> 🛡️  DEF  **${stats.def}**`,
              `> 💨  SPD  **${stats.spd}**`,
              `> 🎯  CRIT **${stats.crit}%**`,
            ].join('\n'),
            inline: true,
          },
          { name: '​', value: `\`${SEP}\``, inline: false },
          {
            name: '🎒 Équipement de départ',
            value: [
              '> ⚪ **Épée rouillée** — Arme · `+3 ATK` · ✅ équipée',
              '> ⚪ **Vêtements simples** — Armure · `+5 HP  +1 DEF` · ✅ équipés',
              '> 🧪 **Potion de soin ×3** — Consommable · `restaure 30 HP`',
            ].join('\n'),
            inline: false,
          },
          { name: '​', value: `\`${SEP}\``, inline: false },
          {
            name: '📖 Commandes disponibles',
            value: [
              '> `/profile`   — Voir ton profil complet',
              '> `/inventory` — Gérer ton inventaire',
              '> `/dungeon`   — Lancer une expédition',
            ].join('\n'),
            inline: false,
          },
        )
        .setFooter({ text: 'WorldBoss  •  Bonne chance, aventurier !' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('[/start]', err);
      return interaction.reply({
        embeds: [errorEmbed('Une erreur est survenue lors de la création de ton personnage.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
