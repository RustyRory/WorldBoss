'use strict';

const {
  SlashCommandBuilder, EmbedBuilder, MessageFlags,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const { characterExists, createCharacter } = require('../../services/player.service');
const { computeStats, xpRequired } = require('../../utils/stats');
const { errorEmbed } = require('../../utils/embed');
const { RACES, getCharacterEmoji, formatRaceOnlyBonuses, formatGenderBonuses, formatRaceBonuses } = require('../../data/races');
const CONSUMABLES   = require('../../data/items/consumables');
const { STARTING_ITEMS } = require('../../services/player.service');

const SEP = '┄'.repeat(32);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Crée ton personnage et commence l\'aventure !'),

  async execute(interaction) {
    const userId  = interaction.user.id;
    const guildId = interaction.guildId;

    try {
      if (await characterExists(userId, guildId)) {
        return interaction.reply({
          embeds: [errorEmbed('Tu as déjà un personnage sur ce serveur ! Utilise `/profile` pour voir tes stats.')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const raceSelect = new StringSelectMenuBuilder()
        .setCustomId('start_race_select')
        .setPlaceholder('Choisis ta race...')
        .addOptions(
          Object.entries(RACES).map(([key, r]) => ({
            label: r.label,
            description: r.description,
            value: key,
            emoji: r.emojiMale,
          })),
        );

      const raceLines = Object.entries(RACES).map(([key, r]) =>
        `${r.emojiMale} **${r.label}** — ${r.description}\n> \`${formatRaceOnlyBonuses(key)}\``,
      );

      const embed = new EmbedBuilder()
        .setTitle('⚔️ Création de personnage')
        .setDescription(
          '**Étape 1 / 3 — Race**\n\n' +
          raceLines.join('\n') +
          `\n\n*Le genre apportera : ♂️ \`${formatGenderBonuses('male')}\` · ♀️ \`${formatGenderBonuses('female')}\`*`,
        )
        .setColor(0x3498db);

      return interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(raceSelect)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      console.error('[/start]', err);
      return interaction.reply({
        embeds: [errorEmbed('Une erreur est survenue.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  // Étape 2 : sélection du genre après choix de la race
  async handleRaceSelect(interaction) {
    const race    = interaction.values[0];
    const raceDef = RACES[race];
    if (!raceDef) return interaction.update({ content: '❌ Race invalide.', components: [], embeds: [] });

    const embed = new EmbedBuilder()
      .setTitle('⚔️ Création de personnage')
      .setDescription(
        `Race choisie : ${raceDef.emojiMale} **${raceDef.label}** · \`${formatRaceOnlyBonuses(race)}\`\n\n` +
        '**Étape 2 / 3 — Genre**\n\n' +
        `${raceDef.emojiMale} **Masculin** — \`${formatGenderBonuses('male')}\`\n` +
        `${raceDef.emojiFemale} **Féminin** — \`${formatGenderBonuses('female')}\``,
      )
      .setColor(0x3498db);

    return interaction.update({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`start_gender:${race}:male`)
            .setLabel('Masculin')
            .setEmoji(raceDef.emojiMale)
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`start_gender:${race}:female`)
            .setLabel('Féminin')
            .setEmoji(raceDef.emojiFemale)
            .setStyle(ButtonStyle.Secondary),
        ),
      ],
    });
  },

  // Étape 3 : modal pour le nom après choix du genre
  async handleGenderButton(interaction, race, gender) {
    const modal = new ModalBuilder()
      .setCustomId(`start_name:${race}:${gender}`)
      .setTitle('Étape 3 / 3 — Nom du personnage');

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('character_name')
          .setLabel('Nom de ton personnage')
          .setStyle(TextInputStyle.Short)
          .setMinLength(2)
          .setMaxLength(24)
          .setPlaceholder('ex: Aldric, Kael, Mira...')
          .setRequired(true),
      ),
    );

    return interaction.showModal(modal);
  },

  // Soumission finale du modal
  async handleModal(interaction, race, gender) {
    const userId        = interaction.user.id;
    const guildId       = interaction.guildId;
    const username      = interaction.user.username;
    const characterName = interaction.fields.getTextInputValue('character_name').trim();

    try {
      if (await characterExists(userId, guildId)) {
        return interaction.reply({
          embeds: [errorEmbed('Tu as déjà un personnage sur ce serveur !')],
          flags: MessageFlags.Ephemeral,
        });
      }

      const { character, loadout } = await createCharacter(userId, username, guildId, characterName, race, gender);
      const stats   = computeStats(character, loadout);
      const xpReq   = xpRequired(character.level);
      const emoji   = getCharacterEmoji(race, gender);
      const raceDef = RACES[race];
      const bonusDesc = formatRaceBonuses(race, gender);

      const embed = new EmbedBuilder()
        .setTitle('⚔️  WorldBoss — Ton aventure commence !')
        .setDescription(
          `> Bienvenue, **${characterName}** ${emoji} !\n` +
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
              `> Nom    **${characterName}**`,
              `> Race   ${emoji} **${raceDef.label}** · \`${bonusDesc}\``,
              `> Genre  **${gender === 'male' ? 'Masculin' : 'Féminin'}**`,
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
            name: '🎒 Objets de départ',
            value: STARTING_ITEMS.map((si) => {
              const item = CONSUMABLES[si.itemId];
              if (!item) return null;
              const STAT_LABELS = { atk: 'ATK', def: 'DEF', spd: 'SPD', hp: 'HP', crit: 'CRIT' };
              const e = item.effect;
              let effectStr = '';
              if (e.type === 'heal')        effectStr = `restaure ${e.value} HP`;
              else if (e.type === 'buff')   effectStr = `${STAT_LABELS[e.stat] ?? e.stat} +${e.value} (${e.turns} tours)`;
              else if (e.type === 'reroll_race') effectStr = 'change race & genre';
              else effectStr = e.type;
              return `> ${item.emoji} **${item.name} ×${si.quantity}** — \`${effectStr}\``;
            }).filter(Boolean).join('\n'),
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
      console.error('[/start modal]', err);
      return interaction.reply({
        embeds: [errorEmbed('Une erreur est survenue lors de la création de ton personnage.')],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
