# Changelog — WorldBoss

---

## [0.2.0] — 2026-05-03

### Ajouté

#### World Boss coopératif
- **`WorldBoss`** et **`WorldBossParticipant`** : nouveaux modèles Prisma pour le boss hebdomadaire par serveur
- **`/worldboss status`** : affiche HP, phase (normal/enragé/berserk), stats, participants
- **`/worldboss attack`** : attaque le boss avec les stats du personnage. Formules cohérentes avec le moteur de donjon (rawDamage + applyCrit de combatEngine.js). Riposte du boss appliquée aux HP du joueur
- **`/worldboss leaderboard`** : top 10 participants par dégâts cumulés + hits
- **Phases de combat** : normal (>30% HP), enragé (≤30%, ATK ×1.25), berserk (≤15%, ATK ×1.5)
- **Scaling par niveau** : HP ×1.4/niveau, ATK et DEF ×1.2/niveau (courbe exponentielle)
- **7 boss thématiques** avec nom et lore selon le palier (Catacombes → Forêt Corrompue → Citadelle des Ténèbres)
- **`resetBoss(guildId)`** : reset hebdomadaire — monte le niveau si le boss a été vaincu
- **Transaction DB atomique** : mise à jour HP boss + contribution joueur en une seule transaction Prisma

#### Setup automatique des serveurs
- **`Guild`** et **`GuildChannels`** : nouveaux modèles Prisma pour les serveurs
- **`guildCreate.js`** : event — init DB + création automatique catégorie + 3 channels Discord (`wb-annonces`, `wb-raid`, `wb-taverne`) + embed de bienvenue
- **`guildDelete.js`** : event — suppression cascade en DB (Guild → GuildChannels + WorldBoss + Participants)
- **`guildMemberAdd.js`** : event — message de bienvenue dans `wb-annonces` avec avatar et rappel des commandes
- **`/setup`** : commande admin pour recréer les channels manuellement (idempotent)
- **`guild.service.js`** : service avec `ensureGuildInDb()`, `initGuildChannels()`, `updateGuildChannels()`, `removeGuildFromDb()`
- **`worldboss.service.js`** : service avec `getGuildBoss()`, `attackBoss()`, `resetBoss()`, `getBossLeaderboard()`

### Modifié

- **`src/index.js`** : ajout intent `GuildMembers` + découverte automatique de tous les sous-dossiers de `src/commands/` (plus de liste manuelle)
- **`prisma/schema.prisma`** : ajout de 4 modèles (`Guild`, `GuildChannels`, `WorldBoss`, `WorldBossParticipant`)

---

## [0.1.0] — Initial (MVP donjon solo)

### Ajouté

#### Système joueur
- **`/start`** : création de personnage avec équipement de départ (Épée rouillée, Vêtements simples, 3× Potion de soin)
- **`/profile`** : stats, niveau, XP, équipement actif
- Seed automatique des items au démarrage (`ready.js` → `ensureItemsSeeded()`)

#### Inventaire & équipement
- **`/inventory`** : liste des items avec quantités et loadout actif
- **`/equip <item_id>`** : équiper un item dans le slot approprié
- Loadout 6 slots : arme, armure, casque, bottes, 2× accessoire

#### Donjon solo
- **`/dungeon`** : démarre ou reprend le Chapitre 1 — Catacombes (3 salles)
- Boutons d'action : ⚔️ Attaquer · ✨ Skill · 💊 Potion · 🏃 Fuir
- Session Redis avec TTL 30min (combat) et 2h (donjon)
- Mécanique boss : Roi des Squelettes invoque des renforts à 50% HP (+5 ATK)

#### Moteur de combat
- `combatEngine.js` : `rawDamage()`, `applyCrit()`, `resolveTurn()`, `rollInitiative()`
- DOTs (poison), buffs temporaires, stun
- Système de fuite (40% base + avantage SPD)

#### Data
- 200+ items définis dans `src/data/items.js` (armes, armures, casques, bottes, accessoires, consommables)
- Ennemis et donjons dans `src/data/enemies.js`
- Raretés : common, rare, epic, legendary

#### Infrastructure
- PostgreSQL + Prisma v5 (User, Item, UserItem, Loadout, DungeonRun)
- Redis (ioredis) + BullMQ
- discord.js v14 avec slash commands
