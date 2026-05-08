'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { REST, Routes } = require('discord.js');

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

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Guild IDs for instant deploy (development). Leave empty to deploy globally.
const GUILD_IDS = (process.env.DEPLOY_GUILD_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

(async () => {
  try {
    if (GUILD_IDS.length > 0) {
      // Guild-specific deploy: instantaneous, perfect for development
      for (const guildId of GUILD_IDS) {
        console.log(`[Deploy] Publication sur le serveur ${guildId}...`);
        const data = await rest.put(
          Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
          { body: commands },
        );
        console.log(`[Deploy] ${data.length} commande(s) publiée(s) sur ${guildId}.`);
      }
    } else {
      // Global deploy: up to 1 hour to propagate — use for production
      console.log(`[Deploy] Publication globale de ${commands.length} commande(s)...`);
      const data = await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
        { body: commands },
      );
      console.log(`[Deploy] ${data.length} commande(s) publiée(s) avec succès (propagation jusqu'à 1h).`);
    }
  } catch (error) {
    console.error('[Deploy] Erreur:', error);
    process.exit(1);
  }
})();
