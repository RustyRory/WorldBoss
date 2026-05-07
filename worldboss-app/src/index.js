'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { redis } = require('./cache/redis');
const { startAuctionWorker } = require('./services/market.service');
const { startMerchantWorker } = require('./services/merchant.service');

// ── Discord client ───────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

// ── Load commands ────────────────────────────────────────────────────────────
const commandsRoot = path.join(__dirname, 'commands');
const commandDirs = fs.readdirSync(commandsRoot)
  .map((sub) => path.join(commandsRoot, sub))
  .filter((p) => fs.statSync(p).isDirectory());

for (const dir of commandDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const command = require(path.join(dir, file));
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`[Commands] Loaded: ${command.data.name}`);
    }
  }
}

// ── Load events ──────────────────────────────────────────────────────────────
const eventsDir = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsDir, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
  console.log(`[Events] Loaded: ${event.name}`);
}

// ── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('[Bot] Shutting down...');
  await redis.quit();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Bot] Shutting down...');
  await redis.quit();
  client.destroy();
  process.exit(0);
});

// ── Login ────────────────────────────────────────────────────────────────────
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('[Bot] DISCORD_TOKEN manquant dans les variables d\'environnement.');
  process.exit(1);
}

redis.connect().catch((err) => console.error('[Redis] Failed to connect:', err.message));

// Empêche les rejections non gérées (ex: interaction Discord expirée) de crasher le process
process.on('unhandledRejection', (err) => {
  console.error('[UnhandledRejection]', err?.message ?? err);
});

client.login(token).then(() => {
  console.log('[Bot] Login en cours...');
  startAuctionWorker(client);
  startMerchantWorker(client);
}).catch((err) => {
  console.error('[Bot] Impossible de se connecter:', err.message);
  process.exit(1);
});
