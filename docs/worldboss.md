# WorldBoss — Design Document

> Bot Discord RPG coopératif. Un serveur = une guilde. Les membres combattent ensemble le World Boss hebdomadaire, progressent en solo dans des donjons, et s'affrontent en PvP.

---

## Sommaire

1. [Architecture technique](#1-architecture-technique)
2. [Base de données](#2-base-de-données)
3. [Création du joueur](#3-création-du-joueur)
4. [Système de donjon solo](#4-système-de-donjon-solo)
5. [World Boss coopératif](#5-world-boss-coopératif)
6. [Déblocages par niveau](#6-déblocages-par-niveau)
7. [Shop](#7-shop)
8. [Progression narrative](#8-progression-narrative)
9. [Modes de jeu](#9-modes-de-jeu)
10. [Philosophie du game design](#10-philosophie-du-game-design)
11. [Système d'équipement](#11-système-déquipement)
12. [Stats & Formules de combat](#12-stats--formules-de-combat)
13. [Système de rareté & loot](#13-système-de-rareté--loot)
14. [Base d'items (MVP)](#14-base-ditems-mvp)
15. [Économie](#15-économie)
16. [Quêtes](#16-quêtes)
17. [Système PvP](#17-système-pvp)
18. [Guildes](#18-guildes)
19. [Classements & Hauts faits](#19-classements--hauts-faits)
20. [Flow global du jeu](#20-flow-global-du-jeu)
21. [Roadmap](#21-roadmap)

---

## 1. Architecture technique

| Composant | Techno | Rôle |
|---|---|---|
| Bot Discord | Node.js · discord.js v14 | Interface utilisateur + logique de jeu |
| Base de données | PostgreSQL | Persistance de toutes les données |
| ORM | Prisma v5 | Accès type-safe à la DB |
| Cache temps réel | Redis (ioredis v5) | État combat/donjon en session active |
| Workers | BullMQ v5 | Jobs async (combat, loot, donjons) |

### Flux global

```
Interaction Discord (slash command / bouton)
        ↓
discord.js — interactionCreate.js
        ↓
Command handler → Service (combat, donjon, boss…)
        ↓
Engine (pure logic, no I/O)    Redis (état temps réel)
        ↓
Prisma → PostgreSQL (persistance)
        ↓
Embed Discord (réponse au joueur)
```

### Structure du projet

```
worldboss-app/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js                   # Entrée — charge commandes + events auto
│   ├── deploy-commands.js         # Enregistrement slash commands Discord
│   ├── commands/
│   │   ├── admin/
│   │   │   └── setup.js           # /setup — init channels (admin)
│   │   ├── boss/
│   │   │   └── worldboss.js       # /worldboss status|attack|leaderboard
│   │   ├── dungeon/
│   │   │   └── dungeon.js         # /dungeon
│   │   ├── inventory/
│   │   │   ├── inventory.js       # /inventory
│   │   │   └── equip.js           # /equip
│   │   └── player/
│   │       ├── start.js           # /start
│   │       └── profile.js         # /profile
│   ├── events/
│   │   ├── ready.js               # Seed items au démarrage
│   │   ├── interactionCreate.js   # Route commandes + boutons
│   │   ├── guildCreate.js         # Join serveur → init DB + channels Discord
│   │   ├── guildDelete.js         # Quitte serveur → nettoyage DB
│   │   └── guildMemberAdd.js      # Nouveau membre → message de bienvenue
│   ├── services/
│   │   ├── player.service.js      # CRUD joueur, XP, seed items
│   │   ├── inventory.service.js   # Items, loadout
│   │   ├── combat.service.js      # Combat donjon (orchestre engine + Redis)
│   │   ├── dungeon.service.js     # Progression donjon (salles, statut)
│   │   ├── guild.service.js       # Init serveur, channels Discord
│   │   └── worldboss.service.js   # Boss coopératif par serveur
│   ├── engines/
│   │   ├── combatEngine.js        # Formules dégâts, initiative, tours (pure logic)
│   │   ├── dungeonEngine.js       # Salles, ennemis, état (pure logic)
│   │   └── lootEngine.js          # Distribution loot (pure logic)
│   ├── data/
│   │   ├── items/                 # Catalogue items (weapons, armors, helmets, boots, accessories, consumables)
│   │   ├── enemies/               # Templates ennemis par arc (arc1–arc8)
│   │   ├── skills/                # Skills actifs (offensive, defensive, support)
│   │   ├── passives/              # Passifs (offensive, defensive)
│   │   ├── abilities/             # Abilities ennemies par arc
│   │   └── dungeons.js            # Définition donjons + alliés NPC
│   ├── cache/
│   │   └── redis.js               # Helpers Redis (combat TTL 30min, donjon 2h)
│   ├── db/
│   │   └── prisma.js              # Singleton PrismaClient
│   └── utils/
│       ├── stats.js               # Calcul stats joueur (HP, ATK, DEF, SPD, CRIT)
│       └── embed.js               # Builders d'embeds Discord
```

---

## 2. Base de données

Schéma complet dans [`prisma/schema.prisma`](../worldboss-app/prisma/schema.prisma).

### Diagramme des relations

```
User ──────────────── UserItem (inventaire)
  │                   └── Item
  ├── Loadout (équipement actif)
  └── DungeonRun (historique donjons)

Guild ─────────────── GuildChannels (IDs channels Discord)
  └── WorldBoss ────── WorldBossParticipant (dégâts/hits par joueur)
```

### Tables principales

| Table | Clé | Description |
|---|---|---|
| `User` | Discord user ID | Personnage global (niveau, XP, gold, HP courant) |
| `Item` | slug (ex: `sword_rusty`) | Catalogue d'items avec stats JSON et skills |
| `UserItem` | userId + itemId | Inventaire joueur (quantité) |
| `Loadout` | userId | Équipement actif (weapon, armor, helmet, boots, 2× accessory) |
| `DungeonRun` | autoincrement | Run actif ou terminé par joueur |
| `Guild` | Discord guild ID | Serveur enregistré (nom, owner) |
| `GuildChannels` | guildId | IDs catégorie + channels WorldBoss du serveur |
| `WorldBoss` | guildId | Boss hebdomadaire du serveur (HP, ATK, DEF, phase, statut) |
| `WorldBossParticipant` | bossId + userId | Dégâts cumulés + nb de frappes par joueur |

### Cache Redis

```
combat:{userId}    → état du combat en cours (TTL 30 min)
dungeon:{userId}   → session de donjon (TTL 2 h)
```

---

## 3. Création du joueur

Commande `/start` — crée un personnage lié au serveur (userId + guildId).

- Niveau 1, stats de départ : 120 HP · 12 ATK · 6 DEF · 10 SPD
- **Aucun item de départ** — les items s'obtiennent via les donjons et le marché
- Accès immédiat : Donjon Solo + World Boss du serveur

---

## 4. Système de donjon solo

Commande `/dungeon` — combat salle par salle avec boutons d'action.

3 donjons disponibles dans le MVP (arc Catacombes) — voir [dungeon.md](worldboss/dungeon.md) pour le détail complet.

| Donjon | Niveau | Salles | Récompense |
|---|---|---|---|
| Les Catacombes | 1 | skeleton / skeleton_archer / skeleton×2+archer | — |
| Les Catacombes Pt.2 | 2 | skeleton+archer / skeleton_mage / skeleton+mage | — |
| Les Catacombes Pt.3 | 3 | skeleton+mage / skeleton+archer / 4 ennemis + Aldric | Débloque le marché |

### Actions en combat

| Action | Effet |
|---|---|
| ⚔️ Attaquer | Attaque normale (×1.0) + déclenche tous les passifs équipés |
| 🔥 Skill | Selon skill de l'item (multiplicateur + effet spécial, cooldown) |
| 🎒 Consommable | Select menu — choisir un item de l'inventaire |
| 🏃 Fuir | 40% de base + bonus SPD relatif |

### Sessions Redis (TTL 2h)

- `combat:{characterId}` — HP, ennemis, buffs/DoTs, cooldowns, consommables
- `dungeon:{characterId}` — salle courante, ennemis combattus, progression

### Loot donjon

Chaque ennemi contribue **un candidat** à une pool d'items (tiré depuis sa table de loot). À la fin du donjon, **un seul item** est tiré au sort parmi tous les candidats.

---

## 5. World Boss coopératif

Commande `/worldboss` — boss partagé par serveur, réinitialisé chaque semaine.

### Sous-commandes

| Commande | Description |
|---|---|
| `/worldboss status` | Affiche HP, phase, ATK, DEF, nombre de participants |
| `/worldboss attack` | Attaque le boss (utilise les stats du personnage) |
| `/worldboss leaderboard` | Top 10 des participants par dégâts |

### Phases de combat

| Phase | Condition | Multiplicateur ATK boss |
|---|---|---|
| Normal | HP > 30% | ×1.0 |
| Enragé | HP ≤ 30% | ×1.25 |
| Berserk | HP ≤ 15% | ×1.5 |

### Scaling par niveau

À chaque reset, si le boss a été vaincu, il monte d'un niveau :

```
HP max  = 5000 × 1.4^(niveau − 1)
ATK     = 80   × 1.2^(niveau − 1)
DEF     = 40   × 1.2^(niveau − 1)
```

### Boss thématiques par palier

| Niveaux | Biome | Noms |
|---|---|---|
| 1–3 | Catacombes | Seigneur des Ossements → Liche Écarlate → Roi Squelette Maudit |
| 4–6 | Forêt Corrompue | Sylvanide Corrompu → Chasseur Maudit → Esprit de la Forêt Noire |
| 7+ | Citadelle des Ténèbres | Seigneur des Ténèbres |

### Setup automatique (guildCreate)

Quand le bot rejoint un serveur, il crée automatiquement :
- Une catégorie **WorldBoss**
- `📜 wb-annonces` — infos, bienvenues, résultats
- `⚔️ wb-raid` — attaques du boss
- `🍺 wb-taverne` — marchand, quêtes (futur)

Et stocke les IDs en base (`GuildChannels`).

---

## 6. Déblocages par niveau

| Niveau | Contenu débloqué |
|---|---|
| 1 | Donjon Solo 1 + World Boss |
| 2 | Donjon Solo 2 |
| 3 | Donjon Solo 3 (+ marché si terminé) |
| 5 | Donjon coopératif 3v3 · Arc 2 |
| 10 | Infinite Dungeon · Arc 3 |
| 15 | Arc 4 |
| 20 | Arc 5 |
| 25 | Arc 6 |
| 32 | Arc 7 |
| 40 | Arc 8 |
| 50 | PvP ranked + Guild Wars |

---

## 7. Shop

Débloqué au niveau 2. Stock limité, refresh toutes les 6h. Items scalés selon le niveau du joueur. Prix en gold.

> Le shop complète le donjon — il ne le remplace pas.

---

## 8. Progression narrative

### Chapitre 1 — Les Squelettes (lvl 1–5)
Biome : Catacombes / Cryptes. Boss : **Roi des Squelettes** — invoque des renforts à 50% HP.

### Chapitre 2 — Les Morts-Vivants (lvl 6–10)
Biome : Marais maudit / Forêt corrompue. Boss : **Le Nécromancien** — ressuscite les ennemis vaincus une fois.

### Chapitre 3 — Retour au Château (lvl 11–15)
Biome : Château royal. Boss : **L'Assassin du Roi** — phase 2 enrage après la mort du roi. Révélation : l'Empire du Désert commandite l'assassinat.

### Chapitre 4 — Le Désert de l'Empire (lvl 16–20)
Biome : Désert brûlant / Ruines ensablées. Boss : **Le Général de l'Empire** — vagues de soldats.

### Chapitre 5 — Les Profondeurs (lvl 21–25)
Biome : Mines / Cité engloutie. Boss : **Le Gardien Ancien** — colosse à points faibles.

### Chapitre 6 — L'Arc Steampunk (lvl 26–32)
Biome : Cité industrielle / Usines à vapeur. Boss : **Le Maître Ingénieur** — multi-phases, tourelles.

### Chapitre 7 — L'Arc Médiéval (lvl 33–40)
Biome : Forteresses / Villages assiégés. Boss : **Le Seigneur de Guerre Éternel** — résurrection à 20% HP.

### Chapitre 8 — L'Arc Céleste (lvl 41–50)
Biome : Cités flottantes / Temples célestes. Boss final : **L'Empereur des Sables** — 3 phases. Débloque le PvP.

---

## 9. Modes de jeu

| Mode | Condition | Description |
|---|---|---|
| Solo | dès lvl 1 | Donjons progressifs, histoire principale |
| World Boss | dès lvl 1 | Raid coopératif hebdomadaire par serveur |
| Coopératif 3v3+ | lvl 5 | Donjons plus difficiles, synergies d'équipe |
| Infinite Dungeon | lvl 10 | Salles en boucle, difficulté croissante, run à la mort |
| PvP | lvl 50 | 1v1 / 2v2 / 3v3 / 4v4, casual + ranked ELO |

---

## 10. Philosophie du game design

- **Builds libres** via équipement uniquement — pas de classe fixe
- Le niveau débloque du **contenu**, pas des stats majeures
- **Roguelike** : donjons rejouables, loot à chaque run
- **Progression narrative** forte par paliers
- **PvP endgame** comme objectif long terme
- **Coopération** liée à la mécanique Discord (serveur = guilde)
- Jeu gratuit — cosmétiques optionnels payants (skins, titres, effets)

---

## 11. Système d'équipement

| Slot | Rôle |
|---|---|
| Arme | ATK · skill actif · passif offensif |
| Armure | HP · DEF · passif défensif |
| Casque | DEF · ATK · CRIT |
| Bottes | SPD · DEF |
| Accessoire 1 | HP · CRIT · skill / passif |
| Accessoire 2 | HP · CRIT · skill / passif |

Chaque item équipé peut apporter :
- Des **bonus de stats** (`stats: { atk, def, hp, spd, crit, critMult }`)
- Un ou plusieurs **skills actifs** (cooldown, once per combat)
- Un ou plusieurs **passifs** (déclenchés sur chaque attaque basique)

Un joueur peut avoir simultanément plusieurs skills et passifs provenant de slots différents.

---

## 12. Stats & Formules de combat

### Stats de base (lvl 1, sans équipement)

| Stat | Valeur lvl 1 | Scaling |
|---|---|---|
| HP | 120 | +20/niveau |
| ATK | 12 | +2/niveau |
| DEF | 6 | +1/niveau |
| SPD | 10 | +1 tous les 5 niveaux |
| CRIT% | 0% | Via équipement uniquement |
| CRIT_MULT | 1.5× | Via équipement uniquement |

### Formules

```
rawDmg    = ATK × skillMultiplier × (100 / (100 + DEF))
finalDmg  = rawDmg × critMult  (si critique, sinon ×1)
isCrit    = random(0,100) < CRIT%
```

Implémenté dans `src/engines/combatEngine.js` — fonctions `rawDamage()` et `applyCrit()`.

### Initiative

```
Initiative = SPD + Random(0, SPD × 0.1)
```

Léger RNG, SPD reste dominant.

### Effets additionnels

- **DOT** (poison, brûlure) : X dégâts/tour pendant N tours
- **Shield** : absorbe X dégâts avant les HP
- **Stun** : l'ennemi passe son tour
- **Buffs/Debuffs** : multiplicateurs temporaires (décroissent chaque tour)

### Ajustement PvP

```
Dégâts PvP = Dégâts normaux × 0.75
```

Évite les one-shots, favorise la stratégie.

---

## 13. Système de rareté & loot

| Rareté | Couleur | Contenu typique |
|---|---|---|
| Commun | ⚪ | Stats simples, aucun effet |
| Rare | 🔵 | Stats + 1 passif ou skill de base |
| Épique | 🟣 | Stats solides + skill offensif |
| Légendaire | 🟠 | Stats hautes + skill + passif unique (build-defining) |

### Mécanique de loot donjon

À la fin d'un donjon complet :
1. Chaque ennemi contribue **un candidat** à la pool (tiré aléatoirement depuis sa table `loot[]`)
2. **Un seul item** est sélectionné au hasard dans toute la pool
3. L'item est ajouté à l'inventaire du joueur

Plus il y a d'ennemis dans le run → plus la pool est diversifiée → plus de chances d'obtenir un item rare.

---

## 14. Base d'items

Catalogue complet dans `src/data/items/`. 69 items répartis en 6 fichiers.

### Armes — 28 items

| Item | Rareté | Stats | Skill | Passif |
|---|---|---|---|---|
| `sword_rusty` | Commun | +3 ATK | — | — |
| `sword_iron` | Commun | +6 ATK | — | — |
| `bow_short` | Commun | +5 ATK, +1 SPD | — | — |
| `staff_wood` | Commun | +4 ATK | — | — |
| `sword_steel` | Rare | +10 ATK, +2% CRIT | — | — |
| `axe_iron` | Rare | +12 ATK | — | — |
| `staff_fire` | Rare | +6 ATK | `firebolt` | — |
| `bow_long` | Rare | +8 ATK, +2 SPD | — | — |
| `staff_bone` | Rare | +7 ATK | `bone_bolt` | — |
| `dagger_shadow` | Épique | +9 ATK, +5% CRIT | — | `poison_dot` |
| `sword_ancient` | Épique | +14 ATK | — | `bleed` |
| `crossbow_steel` | Épique | +12 ATK, +3 SPD | — | — |
| `ring_shadow` | Épique | skill uniquement | `shadow_burst` | — |
| `scimitar_gold` | Épique | +13 ATK, +3% CRIT | — | — |
| `staff_desert` | Épique | +10 ATK | `sand_storm` | — |
| `whip_venom` | Épique | +11 ATK | — | `poison_dot` |
| `rifle_steam` | Épique | +15 ATK, +2 SPD | — | — |
| `sword_pharaoh` | Légendaire | +18 ATK, +5% CRIT | `royal_smite` | `cursed_strike` |
| `staff_royal` | Légendaire | +14 ATK | `thunder_bolt` | `fire_dot` |
| `sword_hell` | Légendaire | +22 ATK, +8% CRIT | `hellstrike` | `fire_dot` |
| `staff_infernal` | Légendaire | +18 ATK | `inferno_blast` | `fire_dot` |
| `axe_infernal` | Légendaire | +25 ATK | — | `bleed` |

### Armures — 31 items (Arc 1–8)

Exemples représentatifs :

| Item | Arc | Rareté | Stats |
|---|---|---|---|
| `cloth_simple` | 1 | Commun | +5 HP, +1 DEF |
| `cloth_leather` | 1 | Commun | +10 HP, +2 DEF |
| `robe_cloth` | 1 | Commun | +8 HP, +1 DEF, +1 ATK |
| `armor_iron` | 2 | Rare | +25 HP, +6 DEF |
| `robe_mage` | 2 | Rare | +15 HP, +3 DEF, +3 ATK |
| `desert_robe` | 5 | Épique | +35 HP, +8 DEF, +2 ATK |
| `steam_armor` | 6 | Épique | +50 HP, +12 DEF |
| `royal_armor` | 7 | Légendaire | +65 HP, +18 DEF, +3 ATK |
| `infernal_plate` | 8 | Légendaire | +100 HP, +30 DEF |

### Casques — 10 items

| Item | Rareté | Stats notables |
|---|---|---|
| `helmet_broken` | Commun | +2 DEF |
| `helmet_iron` | Rare | +5 DEF, +1 ATK |
| `circlet_bone` | Rare | +3 DEF, +2 ATK |
| `hood_shadow` | Épique | +4 DEF, +3 ATK, +3% CRIT |
| `turban_desert` | Épique | +5 DEF, +2 ATK, +2 SPD |
| `goggles_steam` | Épique | +6 DEF, +4 ATK |
| `crown_pharaoh` | Légendaire | +8 DEF, +6 ATK, +5% CRIT |
| `helm_infernal` | Légendaire | +10 DEF, +8 ATK, +5% CRIT |

### Bottes — 8 items

| Item | Rareté | Stats notables |
|---|---|---|
| `boots_leather` | Commun | +2 SPD |
| `boots_iron` | Rare | +3 SPD, +1 DEF |
| `boots_shadow` | Épique | +5 SPD, +2 ATK |
| `sandals_desert` | Épique | +5 SPD, +1 DEF |
| `boots_steam` | Épique | +6 SPD, +2 DEF |
| `boots_infernal` | Légendaire | +10 SPD, +4 ATK |

### Accessoires — 12 items

| Item | Rareté | Stats | Skill | Passif |
|---|---|---|---|---|
| `ring_wood` | Commun | +5 HP | — | — |
| `ring_power` | Rare | +3 ATK, +3% CRIT | — | — |
| `amulet_bone` | Rare | +10 HP, +2 ATK | — | — |
| `talisman_old` | Rare | +8 HP | `soin` | — |
| `ring_shadow` | Épique | +5 ATK, +5% CRIT | `shadow_burst` | — |
| `scarab_beetle` | Épique | +8 ATK, +3% CRIT | — | — |
| `ankh_pharaoh` | Légendaire | +15 HP, +5 ATK | `divine_heal` | — |
| `pendant_soul` | Légendaire | +20 HP, +8 ATK | `soul_drain` | `life_steal` |

### Consommables — 16 items

| Item | Effet | Hors combat | Infini |
|---|---|---|---|
| `potion_heal` | +30 HP | ✅ | — |
| `potion_mana` | +15 HP | ✅ | — |
| `elixir_berserk` | ATK +15 pendant 3 tours | — | — |
| `elixir_iron` | DEF +10 pendant 3 tours | — | — |
| `bomb` | 25 dégâts AoE | — | — |
| `smoke_bomb` | Stun 1 tour | — | — |
| `antidote` | Supprime tous les DoTs | ✅ | — |
| `scroll_fire` | 40 dégâts feu | — | — |
| `throwing_knife` | 15 dégâts directs | — | — |
| `potion_ap` | +3 PA | ✅ | — |

---

## 15. Économie

- **Gold** gagné en donjons, quêtes, PvP
- **Shop** : achat avec gold, stock limité, refresh 6h
- **Loot** : drop après salles et boss (choix guidé après boss)
- Pas de crafting dans le MVP

---

## 16. Quêtes

- Journalières et hebdomadaires
- Types : tuer X ennemis, finir un donjon, blesser le boss, gagner en PvP
- Récompenses : gold, XP, items

---

## 17. Système PvP

| Format | Mode |
|---|---|
| 1v1 | Ranked + Casual |
| 2v2 | Casual |
| 3v3 | Ranked + Casual |
| 4v4 | Casual / Guild Wars |

- Matchmaking ELO pour le ranked
- Saisons avec reset partiel et récompenses cosmétiques
- Équilibrage PvP distinct du PvE (×0.75)

---

## 18. Guildes

- 1 serveur Discord = 1 guilde (table `Guild`)
- Progression collective (niveau, XP, victoires)
- Bonus passifs pour les membres
- Channels dédiés créés automatiquement (`GuildChannels`)
- Guild Wars inter-serveurs (planifié Phase 4)

---

## 19. Classements & Hauts faits

**Joueurs** : niveau · gear score · victoires PvP/ELO · record Infinite Dungeon · plus gros crit · dégâts World Boss

**Guildes** : XP totale · victoires PvP · classement Guild Wars · boss vaincus

**Achievements** : atteindre lvl X · finir un donjon sans mourir · top dégâts boss · gagner 100 PvP…

**Rôles Discord automatiques** · Titres : "Tueur de Dragons", "Champion des Arènes"…

---

## 20. Flow global du jeu

```
/start → Personnage lvl 1 + équipement de base
  → Accès : Donjon Solo (Chapitre 1) + World Boss du serveur

Lvl 2   → Shop débloqué

Lvl 5   → Boss : Roi des Squelettes
           Donjon coopératif 3v3 débloqué
           Chapitre 2 (Marais maudit)

Lvl 10  → Boss : Nécromancien
           Infinite Dungeon débloqué
           Chapitre 3 (Château royal)

Lvl 15  → Boss : Assassin du Roi · Révélation Empire du Désert

Lvl 20  → Boss : Général de l'Empire · Chapitre 5

Lvl 25  → Boss : Gardien Ancien · Arc Steampunk

Lvl 32  → Boss : Maître Ingénieur · Arc Médiéval

Lvl 40  → Boss : Seigneur de Guerre Éternel · Arc Céleste

Lvl 50  → Boss final : Empereur des Sables
           PvP ranked + Guild Wars débloqués
```

---

## 21. Roadmap

### Phase 1 — MVP *(en cours)*

- [x] Système joueur (création, niveau, XP, gold, régénération HP 2/min)
- [x] 69 items répartis en 6 types + système de rarité
- [x] Inventaire, loadout (6 slots), équipement/déséquipement
- [x] Système de skills actifs avec cooldowns
- [x] Système de passifs déclenchés sur attaque basique
- [x] Consommables en combat (select menu) et hors combat
- [x] Vente d'items au marchant (10% prix, 1 PA requis)
- [x] Combat tour par tour multi-ennemis (initiative, DoTs, buffs, stun)
- [x] 3 donjons solo (arc Catacombes, lvl 1–3)
- [x] Alliés NPC en combat (Aldric le Marchand — donjon 3)
- [x] Loot donjon (pool d'un item par ennemi, tirage unique)
- [x] Marché débloqué après donjon 3 complété
- [x] 37 ennemis sur 8 arcs (arc1–arc8)
- [x] 31 abilities ennemies sur 6 arcs
- [x] 20 skills joueur (offensifs, défensifs, support)
- [x] 7 passifs joueur (offensifs, défensifs)
- [x] World Boss coopératif par serveur (phases, scaling, leaderboard)
- [x] Système de marché (enchères BullMQ + vente marchant)
- [x] Points d'action (PA) par action économique
- [x] Setup automatique serveur (catégorie + channels + DB)
- [x] Message de bienvenue nouveaux membres

### Phase 2

- [ ] Donjons arcs 2–8 (bandit, désert, steampunk, pharaon, enfers)
- [ ] Donjons coopératifs 3v3
- [ ] Reset hebdomadaire automatique World Boss (cron BullMQ)
- [ ] Quêtes journalières / hebdomadaires

### Phase 3

- [ ] Arènes 4v4
- [ ] Guild Wars inter-serveurs
- [ ] Ranked ELO + saisons

### Phase 4

- [ ] Infinite Dungeon
- [ ] Leaderboard global
- [ ] Quêtes journalières/hebdomadaires
- [ ] Hauts faits + rôles Discord automatiques

### Phase 5

- [ ] Chapitres 3–8
- [ ] Sets d'équipement (bonus 2/4 pièces)
- [ ] Cosmétiques premium
- [ ] Saisons PvP avec reset
