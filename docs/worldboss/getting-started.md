# Getting Started — WorldBoss

Guide pour lancer le bot en local ou en production.

---

## Prérequis

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Un compte développeur Discord et une application bot

---

## Installation

```bash
cd worldboss-app
npm install
```

---

## Configuration

Créer un fichier `.env` à la racine de `worldboss-app/` :

```env
DISCORD_TOKEN=ton_token_bot
CLIENT_ID=ton_application_id
GUILD_ID=id_serveur_test          # optionnel — pour déploiement local des commandes

DATABASE_URL=postgresql://user:password@localhost:5432/worldboss
REDIS_URL=redis://localhost:6379
```

---

## Base de données

```bash
# Appliquer le schéma (première fois ou après modification)
npm run db:migrate

# Ou en développement rapide (sans historique de migration)
npm run db:push

# Régénérer le client Prisma
npm run db:generate
```

---

## Enregistrer les commandes Discord

```bash
npm run deploy
```

Les commandes globales peuvent prendre jusqu'à 1h à être disponibles.  
Pour le développement, définir `GUILD_ID` dans `.env` et adapter `deploy-commands.js` pour un déploiement immédiat sur un seul serveur.

---

## Démarrer le bot

```bash
# Développement (hot reload)
npm run dev

# Production
npm start
```

---

## Ajouter le bot à un serveur

1. Aller sur [discord.com/developers](https://discord.com/developers/applications)
2. Sélectionner l'application → **OAuth2 → URL Generator**
3. Scopes : `bot` + `applications.commands`
4. Permissions requises :
   - `Manage Channels` — pour créer la catégorie + channels
   - `Send Messages` + `Embed Links` — pour les réponses
   - `Read Message History`
   - `Use Application Commands`
5. Copier le lien et l'ouvrir dans le navigateur

Dès que le bot rejoint, l'event `GuildCreate` crée automatiquement les channels et initialise la DB.

---

## Vérification

Une fois le bot lancé et rejoint sur le serveur :

1. Une catégorie **WorldBoss** est créée avec 3 channels
2. Un embed de bienvenue apparaît dans `wb-annonces`
3. Taper `/start` → personnage créé
4. Taper `/worldboss status` → boss visible
5. Taper `/dungeon` → donjon démarré

---

## Structure du projet

```
worldboss-app/
├── .env                  ← à créer (non commité)
├── package.json
├── prisma/
│   └── schema.prisma
└── src/
    └── ...               ← voir docs/worldboss/architecture.md
```

---

## Intents Discord — attention

Le bot utilise l'intent `GuildMembers` (privilegié). Il faut l'activer manuellement dans le portail développeur :

**Applications → ton bot → Bot → Privileged Gateway Intents → Server Members Intent → ON**

Sans ça, l'event `GuildMemberAdd` ne se déclenche pas.

---

## Commandes utiles

| Commande | Usage |
|---|---|
| `npm run dev` | Démarrer en dev avec hot reload |
| `npm run deploy` | Enregistrer les slash commands |
| `npm run db:migrate` | Appliquer les migrations Prisma |
| `npm run db:push` | Push schema sans migration |
| `npx prisma studio` | Interface web pour inspecter la DB |
| `npx prisma format` | Formater le schema.prisma |
