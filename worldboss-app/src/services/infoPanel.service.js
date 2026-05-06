'use strict';

const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  MessageFlags,
} = require('discord.js');
const { prisma } = require('../db/prisma');

const DISCORD_INVITE = 'https://discord.gg/eS7rAMrehm';
const BOT_INVITE     = 'https://discord.com/oauth2/authorize?client_id=1295750967068856342&permissions=8&integration_type=0&scope=bot';
const GITHUB_PROFILE_URL = 'https://github.com/RustyRory/';
const GITHUB_URL     = 'https://github.com/RustyRory/WorldBoss/';

const SCOPE_OPTIONS = [
  { label: 'Ce serveur — par niveau', value: 'server_level', emoji: '🏰' },
  { label: 'Global — par niveau',     value: 'global_level', emoji: '🌍' },
];

async function buildStaticPanel(client, guild) {
  const [totalCharacters, guildChannels] = await Promise.all([
    prisma.character.count(),
    guild ? prisma.guildChannels.findUnique({ where: { guildId: guild.id } }) : null,
  ]);
  const totalGuilds = client.guilds.cache.size;
  const ping        = client.ws.ping;

  const guildId          = guild?.id ?? '';
  const generalChannelId = guildChannels?.generalChannelId;
  const battleChannelId  = guildChannels?.dungeonChannelId;
  const marketChannelId  = guildChannels?.marketChannelId;

  const channelMention = (id) => id ? `<#${id}>` : '`#wb-general`';

  const SEP = `\`${'┄'.repeat(32)}\``;

  const embed = new EmbedBuilder()
    .setTitle('WorldBoss — RPG Discord')
    .setColor(0x5865f2)
    .setDescription(
      '> Bot Discord RPG coopératif.\n' +
      '> Combats en donjon solo, World Boss coopératif et marché entre joueurs.\n' +
      SEP,
    )
    .addFields(
      {
        name: '🤖 Statut',
        value: [
          '> État : 🟢 En ligne',
          `> Ping : **${ping}ms**`,
          `> Serveurs : **${totalGuilds}**`,
          `> Personnages : **${totalCharacters}**`,
        ].join('\n'),
        inline: true,
      },
      {
        name: '🔗 Liens',
        value: [
          `> [💬 Discord communautaire](${DISCORD_INVITE})`,
          `> [💻 GitHub](${GITHUB_URL})`,
          `> `,
          `> [Ajouter le bot à votre serveur](${BOT_INVITE})`,
        ].join('\n'),
        inline: true,
      },
      { name: '​', value: SEP, inline: false },
      {
        name: '📖 Commandes',
        value: [
          `**Dans ${channelMention(generalChannelId)}**`,
          '> `/start` — Créer ton personnage sur ce serveur',
          '> `/profile` — Voir tes stats et ton équipement',
          '> `/inventory` — Gérer ton inventaire (équiper, vendre, utiliser)',
          '',
          `**Dans ${channelMention(battleChannelId)}**`,
          '> `/dungeon` — Lancer un donjon solo',
          '',
          '**Niveaux requis**',
          '> Lvl 1 → Donjon 1 · Lvl 2 → Donjon 2 · Lvl 3 → Donjon 3 + Marché',
        ].join('\n'),
        inline: false,
      },
      { name: '​', value: SEP, inline: false },
      {
        name: '💡 Comment commencer ?',
        value: [
          `> **1.** Va dans ${channelMention(generalChannelId)} et tape \`/start\``,
          '> **2.** Consulte ton profil avec `/profile`',
          `> **3.** Lance ton premier donjon dans ${channelMention(battleChannelId)} avec \`/dungeon\``,
          '> **4.** Consulte le 📖 **Wiki** pour en savoir plus',
        ].join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: 'Développé par RustyRory', iconURL: 'https://github.com/RustyRory.png' })
    .setTimestamp();

  // Rangée 1 : navigation vers les channels
  const navButtons = [];
  if (generalChannelId) {
    navButtons.push(
      new ButtonBuilder()
        .setLabel('💬 Général')
        .setURL(`https://discord.com/channels/${guildId}/${generalChannelId}`)
        .setStyle(ButtonStyle.Link),
    );
  }
  if (battleChannelId) {
    navButtons.push(
      new ButtonBuilder()
        .setLabel('⚔️ Battle')
        .setURL(`https://discord.com/channels/${guildId}/${battleChannelId}`)
        .setStyle(ButtonStyle.Link),
    );
  }
  if (marketChannelId) {
    navButtons.push(
      new ButtonBuilder()
        .setLabel('🏪 Marché')
        .setURL(`https://discord.com/channels/${guildId}/${marketChannelId}`)
        .setStyle(ButtonStyle.Link),
    );
  }

  // Rangée 2 : classement + wiki
  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('info_leaderboard')
      .setLabel('Classement')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('info_wiki')
      .setLabel('Wiki')
      .setEmoji('📖')
      .setStyle(ButtonStyle.Secondary),
  );

  const components = [];
  if (navButtons.length > 0) {
    components.push(new ActionRowBuilder().addComponents(navButtons));
  }
  components.push(actionRow);

  return { embeds: [embed], components };
}

async function buildLeaderboardEmbed(guild, scope = 'server_level') {
  const [sortScope, sortBy] = scope.split('_');
  const isGlobal = sortScope === 'global';

  const medals = ['🥇', '🥈', '🥉'];
  let leaderboardText;

  if (isGlobal) {
    const characters = await prisma.character.findMany({
      orderBy: sortBy === 'level'
        ? [{ level: 'desc' }, { xp: 'desc' }]
        : { user: { username: 'asc' } },
      take: 100,
      select: { level: true, user: { select: { username: true } } },
    });

    if (characters.length === 0) {
      leaderboardText = '*Aucun personnage pour le moment.*';
    } else {
      leaderboardText = characters
        .map((c, i) => `${medals[i] ?? `**${i + 1}.**`} ${c.user.username} — Lvl **${c.level}**`)
        .join('\n');
    }
  } else {
    const characters = await prisma.character.findMany({
      where: { guildId: guild.id },
      orderBy: sortBy === 'level'
        ? [{ level: 'desc' }, { xp: 'desc' }]
        : { user: { username: 'asc' } },
      take: 15,
      select: { level: true, user: { select: { username: true } } },
    });

    if (characters.length === 0) {
      leaderboardText = '*Aucun personnage sur ce serveur. Utilise `/start` pour commencer !*';
    } else {
      leaderboardText = characters
        .map((c, i) => `${medals[i] ?? `**${i + 1}.**`} ${c.user.username} — Lvl **${c.level}**`)
        .join('\n');
    }
  }

  const scopeLabel = SCOPE_OPTIONS.find((o) => o.value === scope)?.label ?? scope;

  const embed = new EmbedBuilder()
    .setTitle(`🏆 Classement — ${scopeLabel}${isGlobal ? ' (Top 100)' : ''}`)
    .setDescription(leaderboardText.slice(0, 4096))
    .setColor(0xf1c40f)
    .setTimestamp();

  const select = new StringSelectMenuBuilder()
    .setCustomId('info_scope')
    .setPlaceholder('Changer le filtre…')
    .addOptions(SCOPE_OPTIONS.map((o) => ({ ...o, default: o.value === scope })));

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(select)],
    flags: MessageFlags.Ephemeral,
  };
}

async function refreshInfoPanel(client, guild, channelId) {
  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  const payload = await buildStaticPanel(client, guild);

  const messages = await channel.messages.fetch({ limit: 20 });
  const existing = messages.find((m) => m.author.id === client.user.id && m.embeds.length > 0);

  if (existing) {
    await existing.edit(payload);
  } else {
    await channel.send(payload);
  }
}

module.exports = { refreshInfoPanel, buildLeaderboardEmbed };
