# Changelog — WorldBoss

---

## [Unreleased] — en cours

### Ajouté

#### Animation des combats
- **`utils/animate.js`** (nouveau) : fonctions `animateLore`, `animateCombatLogs`, `animateXpGain`
  - `animateLore` : révèle la description d'une salle phrase par phrase (split sur `.!?…`)
  - `animateCombatLogs` : rejoue les logs d'un tour action par action, anime les barres HP bloc par bloc entre chaque ligne
  - `animateXpGain` : (à venir)
- **`CombatLog`** (classe interne, `combatEngine.js` et `primeCombatEngine.js`) : étend `Array` et prend un snapshot HP après chaque `push`. Les moteurs retournent maintenant `{ logs, frames, initialSnapshot }` en plus du résultat habituel
- **`combat.service.js`** et **`prime.service.js`** : intègrent `animateCombatLogs` pour afficher les combats en temps réel via `interaction.editReply`

#### Arc 2 — Bandits (nouveau contenu)
- **4 nouveaux ennemis** dans `enemies/arc2_chateau.js` :
  - `bandit_scout` (HP 120, ATK 18, SPD 16) — capacité `quick_strike`
  - `bandit_thief` (HP 130, ATK 20) — capacité `steal`
  - `bandit_brute` (HP 175, ATK 24, DEF 12) — capacité `smash` (debuff DEF)
  - `bandit_leader` (HP 190, ATK 26) — capacité `intimidate` (debuff ATK)
- **5 nouvelles capacités ennemies** dans `abilities/arc2_chateau.js` :
  - `quick_strike` : ATK pleine, ignore toute la DEF
  - `steal` : dégâts normaux dans la mêlée
  - `smash` : ×1,4 ATK + réduit DEF joueur de 4 pour 2 tours
  - `intimidate` : réduit ATK joueur de 5 pour 2 tours (pas de dégâts)
  - `shadow_strike` : ×1,6 ATK, ignore 40% DEF, 30% chance de crit ×1,5

#### Donjon 5 — restructuré (3 salles)
- **Salle 1** : `skeleton_knight` + `skeleton_archer` (inchangé)
- **Salle 2** : remplace `necromancer` par `skeleton_warlord` — boss intermédiaire plus robuste
- **Salle 3** (nouvelle) : `necromancer` seul — climax du chapitre
- **Récompense** `unlockPrimes: true` : déclenche le déblockage du mode prime à la victoire

#### Primes — balance 4v4
- Champ `enemyStats` par salle dans `primes.js` pour surcharger les stats des ennemis en contexte 4v4 :
  - Salle 1 — `skeleton_warlord` : HP 420 (×3,5 solo), ATK 22 (×1,5), restHeal 25
  - Salle 2 — `skeleton_king` : HP 600, ATK 40, crit 12 ; `necromancer` : HP 280, ATK 24 ; `skeleton_warlord` : HP 420

### Modifié

- **`abilities/index.js`** : arcs 3, 4, 6, 8 retirés (fichiers supprimés, évite les crash au démarrage)
- **`enemies/index.js`** : même nettoyage pour les arcs non implémentés
- **`deploy-commands.js`** : ajout du dossier `commands/admin` dans `commandDirs`
- **`dungeonEngine.js`** : `createDungeonState` accepte un paramètre `replayMode` (booléen, défaut `false`)
- **`potion_mana`** renommée en **`potion_boost`** (effet réel : buff ATK +5 / 2 tours)

### Corrigé

- HP négatifs impossibles dans tous les moteurs et skills (`Math.max(0, ...)`)
- Stun appliqué sur cible morte (`lance_de_glace` : stun conditionnel si HP > 0 après l'attaque)
- Messages de logs uniformisés : affichage `*(HP courant/maxHP)*` après chaque action
- Équilibrage arc 1 : `skeleton_king.def` 7 → 1 (moins tanky), `necromancer.hp` 80 → 100

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
