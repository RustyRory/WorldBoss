'use strict';

const { Events } = require('discord.js');
const { removeGuildFromDb } = require('../services/guild.service');

module.exports = {
  name: Events.GuildDelete,
  once: false,

  async execute(guild) {
    console.log(`[Guild] Quitté : ${guild.name} (${guild.id})`);
    try {
      await removeGuildFromDb(guild.id);
      console.log(`[Guild] Données supprimées pour ${guild.name}.`);
    } catch (err) {
      // La guilde peut ne pas exister en DB si le bot n'a jamais été correctement initialisé
      console.error(`[Guild] Erreur suppression DB pour ${guild.name}:`, err.message);
    }
  },
};
