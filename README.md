# WorldBoss

Bot Discord RPG multijoueur — donjons solo, primes coopératives, marché aux enchères.

---

## Aperçu

WorldBoss est un bot Discord en Node.js où les joueurs créent un personnage, progressent dans des donjons solo, et s'unissent pour des expéditions de groupe (Primes) contre des boss difficiles. Un marché dynamique et un marchand ambulant complètent l'expérience.

**Stack** : Node.js 20 · discord.js v14 · PostgreSQL 16 · Redis 7 · Prisma ORM · BullMQ

---

## Fonctionnalités

| Commande | Description |
|---|---|
| `/start` | Créer son personnage (modal de saisie du nom) |
| `/profile` | Afficher ses stats, niveau et équipement |
| `/inventory` | Gérer son inventaire — équiper, vendre, utiliser |
| `/dungeon` | Lancer ou reprendre un donjon solo |
| `/prime` | Lancer une expédition coopérative à 4 joueurs |
| `/setup` *(admin)* | Initialiser les canaux WorldBoss sur le serveur |

### Système de combat
- Tours en temps réel avec animation action par action
- Skills offensifs, DOTs (poison, saignement), buffs/debuffs, stun
- Alliés PNJ dans certaines salles
- Passives d'armes déclenchées après chaque attaque

### Primes (mode multijoueur)
- Lobby public 4 joueurs — rejoindre / quitter / commencer
- Tours résolus quand tous les joueurs ont agi
- Ennemis élites (⭐) avec drops exclusifs
- Récompenses ×1,5 pour les survivants
- Débloqué après le donjon 5

### Marché & Marchand
- Enchères avec timer Discord natif (`<t:UNIX:R>`)
- Marchand ambulant resetté toutes les 8h, stock dynamique
- Système de PA (Points d'Action) — max 10, +1 toutes les 2h

---

## Installation

Voir [INSTALL.md](INSTALL.md) pour le guide complet.

**Démarrage rapide (dev local) :**

```bash
git clone https://github.com/rustyrory/WorldBoss.git
cd WorldBoss/worldboss-app
cp .env.example .env        # remplir DISCORD_TOKEN, CLIENT_ID, DATABASE_URL, REDIS_URL
npm install
npx prisma migrate dev
npm run deploy              # déployer les slash commands
npm start
```

---

## Structure du projet

```
WorldBoss/
├── worldboss-app/
│   ├── src/
│   │   ├── commands/       # Slash commands (player/, dungeon/, inventory/, admin/)
│   │   ├── events/         # Handlers Discord (ready, interactionCreate, guildCreate…)
│   │   ├── engines/        # Logique de combat (combatEngine, dungeonEngine, primeCombatEngine)
│   │   ├── services/       # Couche métier (combat, dungeon, prime, market, merchant…)
│   │   ├── data/           # Données statiques (ennemis, donjons, items, skills, primes)
│   │   ├── utils/          # Embed builders, stats, animations
│   │   └── cache/          # Client Redis (ioredis)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── deployment/         # Dockerfile + docker-compose.prod.yml
├── docs/                   # Documentation technique
└── CHANGELOG.md
```

---

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

Voir [LICENSE](LICENSE).
