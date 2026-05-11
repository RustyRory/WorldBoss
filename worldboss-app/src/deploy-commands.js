'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { REST, Routes, Client, GatewayIntentBits } = require('discord.js');

function loadCommands() {
  const commands = [];
  const commandDirs = [
    path.join(__dirname, 'commands', 'player'),
    path.join(__dirname, 'commands', 'inventory'),
    path.join(__dirname, 'commands', 'dungeon'),
    path.join(__dirname, 'commands', 'admin'),
  ];

  for (const dir of commandDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
    for (const file of files) {
      const command = require(path.join(dir, file));
      if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`[Deploy] Préparé: ${command.data.name}`);
      }
    }
  }
  return commands;
}

async function deployCommands(client) {
  const commands = loadCommands();
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const guildIds = client.guilds.cache.map((g) => g.id);

  console.log(`[Deploy] Déploiement sur ${guildIds.length} serveur(s)...`);

  for (const guildId of guildIds) {
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
      { body: commands },
    );
    console.log(`[Deploy] ${data.length} commande(s) publiée(s) sur ${guildId}.`);
  }

  console.log('[Deploy] Déploiement terminé sur tous les serveurs.');
}

// Standalone mode: node src/deploy-commands.js
if (require.main === module) {
  (async () => {
    try {
      const client = new Client({ intents: [GatewayIntentBits.Guilds] });
      await new Promise((resolve, reject) => {
        client.once('ready', resolve);
        client.once('error', reject);
        client.login(process.env.DISCORD_TOKEN);
      });

      await deployCommands(client);
      await client.destroy();
    } catch (error) {
      console.error('[Deploy] Erreur:', error);
      process.exit(1);
    }
  })();
}

async function deployToGuild(guildId) {
  const commands = loadCommands();
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  const data = await rest.put(
    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
    { body: commands },
  );
  console.log(`[Deploy] ${data.length} commande(s) publiée(s) sur ${guildId}.`);
}

module.exports = { deployCommands, deployToGuild };
