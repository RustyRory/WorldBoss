'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { prisma } = require('../db/prisma');

/**
 * Ensures a guild exists in the database.
 * Creates the Guild, its channel slots and the initial WorldBoss in one shot.
 */
async function ensureGuildInDb(guild) {
  return prisma.guild.upsert({
    where: { id: guild.id },
    create: {
      id: guild.id,
      name: guild.name,
      ownerId: guild.ownerId,
      channels: { create: {} },
    },
    update: { name: guild.name, ownerId: guild.ownerId },
    include: { channels: true },
  });
}

/**
 * Updates the channel IDs stored for a guild.
 */
async function updateGuildChannels(guildId, data) {
  return prisma.guildChannels.upsert({
    where: { guildId },
    create: { guildId, ...data },
    update: data,
  });
}

/**
 * Removes a guild and all cascading data from the database.
 */
async function removeGuildFromDb(guildId) {
  return prisma.guild.delete({ where: { id: guildId } });
}

/**
 * Initialises the Discord category and thematic channels for a guild.
 *
 * Channels créés sous la catégorie "WorldBoss" :
 *   wb-info      — lecture seule (annonces bot)
 *   wb-general   — tchat libre
 *   wb-commandes — commandes du bot
 *   wb-battle    — modes de jeu (donjon, pvp, infini...)
 *
 * Returns { categoryId, infoChannelId, generalChannelId, commandChannelId, dungeonChannelId }
 */
async function initGuildChannels(guild) {
  const botId = guild.client.user.id;
  const everyoneId = guild.roles.everyone.id;

  // Permissions bot : tout autoriser explicitement
  const botPerms = {
    id: botId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.UseApplicationCommands,
    ],
  };

  const channelDefs = [
    {
      key: 'infoChannelId',
      name: 'wb-info',
      permissionOverwrites: [
        {
          id: everyoneId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.UseApplicationCommands,
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        botPerms,
      ],
    },
    {
      key: 'generalChannelId',
      name: 'wb-general',
      permissionOverwrites: [
        {
          id: everyoneId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.UseApplicationCommands,
          ],
        },
        botPerms,
      ],
    },
    {
      key: 'dungeonChannelId',
      name: 'wb-battle',
      permissionOverwrites: [
        {
          id: everyoneId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.UseApplicationCommands,
          ],
          deny: [
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        botPerms,
      ],
    },
    {
      key: 'marketChannelId',
      name: 'wb-market',
      permissionOverwrites: [
        {
          id: everyoneId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.UseApplicationCommands,
          ],
          deny: [
            PermissionFlagsBits.CreatePublicThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.SendMessagesInThreads,
          ],
        },
        botPerms,
      ],
    },
  ];

  // Trouver ou créer la catégorie
  let category = guild.channels.cache.find(
    (c) => c.type === 4 && c.name === 'WorldBoss',
  );
  if (!category) {
    category = await guild.channels.create({
      name: 'WorldBoss',
      type: 4,
      permissionOverwrites: [
        { id: everyoneId, allow: [PermissionFlagsBits.ViewChannel] },
        botPerms,
      ],
    });
  }

  const result = { categoryId: category.id };

  for (const { key, name, permissionOverwrites } of channelDefs) {
    let ch = guild.channels.cache.find(
      (c) => c.parentId === category.id && c.name === name,
    );
    if (!ch) {
      ch = await guild.channels.create({
        name,
        type: 0,
        parent: category.id,
        permissionOverwrites,
      });
    } else {
      await ch.permissionOverwrites.set(permissionOverwrites);
    }
    result[key] = ch.id;
  }

  return result;
}

module.exports = {
  ensureGuildInDb,
  updateGuildChannels,
  removeGuildFromDb,
  initGuildChannels,
};
