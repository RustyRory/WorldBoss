# Installation — WorldBoss

---

## Prérequis

- **Node.js** 20+
- **PostgreSQL** 16
- **Redis** 7
- Un **bot Discord** — créé sur le [Discord Developer Portal](https://discord.com/developers/applications)
  - Intents requis : `GUILDS`, `GUILD_MEMBERS`, `GUILD_MESSAGES`
  - Permissions : `Send Messages`, `Manage Channels`, `Manage Messages`, `Read Message History`

---

## Option A — Dev local

### 1. Cloner le projet

```bash
git clone https://github.com/rustyrory/WorldBoss.git
cd WorldBoss/worldboss-app
```

### 2. Variables d'environnement

```bash
cp .env.example .env
```

Remplir `.env` :

```env
DISCORD_TOKEN=ton_token_discord
DISCORD_CLIENT_ID=ton_client_id

DATABASE_URL=postgresql://user:password@localhost:5432/worldboss
REDIS_URL=redis://localhost:6379

# Optionnel — IDs des serveurs de test pour un déploiement instantané des commandes
DEPLOY_GUILD_IDS=ID_SERVEUR_1,ID_SERVEUR_2
```

### 3. Installer les dépendances

```bash
npm install
```

### 4. Base de données

```bash
npx prisma migrate dev   # applique toutes les migrations
```

### 5. Déployer les slash commands

```bash
npm run deploy
```

Avec `DEPLOY_GUILD_IDS` renseigné, les commandes sont disponibles instantanément sur les serveurs listés. Sans cette variable, le déploiement est global (jusqu'à 1h de délai).

### 6. Lancer le bot

```bash
npm start          # production
npm run dev        # développement (nodemon)
```

---

## Option B — Production via Docker

Le projet est conçu pour être intégré dans un `docker-compose.yml` global sur un VPS.

### 1. Copier le fichier `.env`

```bash
cp worldboss-app/.env.example worldboss-app/.env
# remplir les variables
```

### 2. Intégrer dans le docker-compose du VPS

Ajouter les services de `worldboss-app/deployment/docker-compose.prod.yml` dans ton fichier `docker-compose.yml` principal.

Les services créés :
- `worldboss-bot` — le bot Node.js
- `worldboss-db` — PostgreSQL 16 (volume persistant)
- `worldboss-redis` — Redis 7 (volume persistant)

### 3. Démarrer

```bash
docker compose up -d worldboss-bot worldboss-db worldboss-redis
```

### 4. Appliquer les migrations en production

```bash
docker compose exec worldboss-bot npx prisma migrate deploy
```

### 5. Déployer les slash commands

```bash
docker compose exec worldboss-bot npm run deploy
```

---

## Configuration du serveur Discord

Après avoir invité le bot sur ton serveur, lance la commande admin :

```
/setup
```

Cette commande crée automatiquement la catégorie et les canaux WorldBoss :
- `wb-info` — panneau d'information
- `wb-general` — général
- `wb-battle` — combats et primes
- `wb-market` — marché aux enchères

---

## Commandes utiles

| Commande | Action |
|---|---|
| `npm start` | Lance le bot |
| `npm run dev` | Lance avec nodemon (rechargement auto) |
| `npm run deploy` | Déploie les slash commands |
| `npx prisma migrate dev` | Applique les migrations (dev) |
| `npx prisma migrate deploy` | Applique les migrations (prod) |
| `npx prisma studio` | Interface graphique de la base de données |
