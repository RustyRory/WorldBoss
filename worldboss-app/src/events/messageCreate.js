'use strict';

const { Events } = require('discord.js');
const { prisma } = require('../db/prisma');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const guildChannels = await prisma.guildChannels.findUnique({
      where: { guildId: message.guildId },
      select: { dungeonChannelId: true, marketChannelId: true },
    });
    if (!guildChannels) return;

    const autoCleanChannels = [guildChannels.dungeonChannelId, guildChannels.marketChannelId].filter(Boolean);
    if (!autoCleanChannels.includes(message.channelId)) return;

    await message.delete().catch(() => {});
  },
};
