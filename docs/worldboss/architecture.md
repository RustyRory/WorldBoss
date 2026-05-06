# Architecture technique — WorldBoss

## Stack

| Couche | Technologie | Version |
|---|---|---|
| Runtime | Node.js | 18+ |
| Discord | discord.js | v14.14 |
| ORM | Prisma | v5.10 |
| Base de données | PostgreSQL | 16+ |
| Cache | Redis · ioredis | v5.3 |
| Queue | BullMQ | v5.4 |
| Dev | nodemon | v3.1 |

---

## Flux d'une interaction Discord

```
Utilisateur tape /dungeon
        │
        ▼
discord.js reçoit l'InteractionCreate
        │
        ▼
interactionCreate.js → cherche la commande dans client.commands
        │
        ▼
commands/dungeon/dungeon.js
  ├── characterExists(userId, guildId)      (player.service)
  ├── getCharacter(userId, guildId)         (player.service → DB)
  └── startOrResumeDungeon(interaction, character.id)
          ├── getDungeonState(characterId)  (Redis)
          ├── getAvailableDungeons(characterId)  (DB)
          └── interaction.reply(embed + boutons)
```

---

## Résolution du personnage

Toutes les commandes et boutons commencent par résoudre `(userId, guildId)` → `character.id` :

```js
// Dans les commandes
const character = await getCharacter(interaction.user.id, interaction.guildId);

// Dans interactionCreate.js (boutons)
const characterId = await resolveCharacterId(interaction);
// → prisma.character.findUnique({ where: { userId_guildId: { ... } } })
```

Les services n'acceptent que des `characterId` (Int) — jamais de Discord user ID directement.

---

## Structure des dossiers

```
src/
├── index.js              # Client Discord, chargement auto commandes + events
├── deploy-commands.js    # Enregistre les slash commands via l'API Discord
│
├── commands/             # Sous-dossiers auto-découverts au démarrage
│   ├── admin/            # /setup
│   ├── dungeon/          # /dungeon
│   ├── inventory/        # /inventory
│   └── player/           # /start  /profile
│
├── events/               # Un fichier = un événement Discord
│   ├── clientReady.js    # ClientReady (once)
│   ├── interactionCreate.js
│   ├── guildCreate.js    # GuildCreate — init serveur
│   ├── guildDelete.js    # GuildDelete — nettoyage DB
│   └── guildMemberAdd.js # GuildMemberAdd — bienvenue
│
├── services/             # Orchestration (DB + cache + engine)
│   ├── player.service.js      # getCharacter, characterExists, createCharacter, addXp, addGold
│   ├── inventory.service.js   # getInventory, equipItem, grantItem, sellItem
│   ├── actionPoints.service.js
│   ├── combat.service.js
│   ├── dungeon.service.js
│   ├── market.service.js
│   ├── guild.service.js
│   ├── infoPanel.service.js
│   └── wiki.service.js
│
├── engines/              # Logique pure (aucun I/O — testable sans DB)
│   ├── combatEngine.js
│   ├── dungeonEngine.js
│   └── lootEngine.js
│
├── data/                 # Données statiques (items, ennemis)
│   ├── items.js
│   └── enemies.js
│
├── cache/
│   └── redis.js          # Helpers get/set/del avec préfixes de clé
│
├── db/
│   └── prisma.js         # Singleton PrismaClient
│
└── utils/
    ├── stats.js           # computeStats(character, loadout) → { hp, atk, def, spd, crit, critMult }
    └── embed.js           # Builders d'embeds réutilisables
```

---

## Séparation des responsabilités

| Couche | Règle |
|---|---|
| **Commands** | Résout `(userId, guildId)` → `character`, appelle un service, formate la réponse |
| **Services** | Acceptent un `characterId` (Int). Orchestrent DB, engine, Redis |
| **Engines** | Fonctions pures. Aucun `require('../db/...')` ni `require('../cache/...')` autorisé |
| **Data** | Constantes en mémoire. Seeded en DB au démarrage via `player.service.ensureItemsSeeded()` |

---

## Chargement automatique des commandes

`index.js` scanne tous les sous-dossiers de `src/commands/` :

```js
const commandsRoot = path.join(__dirname, 'commands');
const commandDirs = fs.readdirSync(commandsRoot)
  .map((sub) => path.join(commandsRoot, sub))
  .filter((p) => fs.statSync(p).isDirectory());
```

Chaque fichier de commande exporte `{ data: SlashCommandBuilder, execute: async (interaction) => {} }`.

---

## Intents Discord

```js
new Client({
  intents: [
    GatewayIntentBits.Guilds,       // Événements guild + channels
    GatewayIntentBits.GuildMembers, // GuildMemberAdd (bienvenue)
  ],
})
```

`GuildMembers` est un intent privilegié — à activer dans le portail développeur Discord.

---

## Redis — Convention de clés

| Clé | Contenu | TTL |
|---|---|---|
| `combat:{characterId}` | État du combat en cours (JSON) | 30 min |
| `dungeon:{characterId}` | Session de donjon (JSON) | 2 h |

Les clés sont indexées par `characterId` (Int) et non par Discord user ID — un joueur peut avoir des sessions de combat simultanées sur deux serveurs différents sans collision.

---

## Variables d'environnement

```env
DISCORD_TOKEN=          # Token du bot
DISCORD_CLIENT_ID=      # Application ID
DATABASE_URL=           # postgresql://user:pass@host:5432/worldboss
REDIS_URL=              # redis://localhost:6379
```

---

## Scripts npm

| Commande | Action |
|---|---|
| `npm run dev` | Démarre avec nodemon (hot reload) |
| `npm start` | Démarre en production |
| `npm run deploy` | Enregistre les slash commands |
| `npm run db:migrate` | Crée et applique une migration Prisma |
| `npm run db:generate` | Régénère le client Prisma après modif schema |
| `npm run db:push` | Push schema sans migration (dev rapide) |
