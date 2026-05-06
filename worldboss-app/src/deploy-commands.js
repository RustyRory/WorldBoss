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

(async () => {
  try {
    console.log(`[Deploy] Publication de ${commands.length} commande(s)...`);

    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log(`[Deploy] ${data.length} commande(s) publiée(s) avec succès.`);
  } catch (error) {
    console.error('[Deploy] Erreur:', error);
    process.exit(1);
  }
})();
