'use strict';

const { Events, EmbedBuilder } = require('discord.js');
const { prisma } = require('../db/prisma');

// Messages de bienvenue aléatoires dans le style Darkest Dungeon / FF
const WELCOME_LINES = [
  'Un nouvel aventurier répond à l\'appel des ténèbres.',
  'Les portes du donjon s\'ouvrent pour accueillir un héros de plus.',
  'La guilde s\'agrandit — que vos talents servent la lumière.',
  'Bienvenue, étranger. Le boss ne dormira pas éternellement.',
  'Une nouvelle lame s\'ajoute à l\'arsenal de la guilde.',
];

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,

  async execute(member) {
    try {
      const guildData = await prisma.guild.findUnique({
        where: { id: member.guild.id },
        include: { channels: true },
      });

      if (!guildData?.channels?.announcesChannelId) return;

      const channel = member.guild.channels.cache.get(guildData.channels.announcesChannelId);
      if (!channel) return;

      const flavor = WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)];

      const embed = new EmbedBuilder()
        .setTitle('📜 Un nouveau héros rejoint la guilde !')
        .setDescription(
          `*${flavor}*\n\n` +
          `Bienvenue ${member} sur **${member.guild.name}** !\n\n` +
          'Lance `/start` pour créer ton personnage et rejoindre le raid contre le **World Boss**.',
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setColor(0x4169e1)
        .setFooter({ text: 'Que ton épée soit aussi tranchante que ta volonté.' });

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.error('[GuildMemberAdd] Erreur:', err.message);
    }
  },
};
