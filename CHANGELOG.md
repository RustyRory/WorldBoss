# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur **[Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)**
et ce projet suit le **[Semantic Versioning](https://semver.org/lang/fr/)**.

---

## [Unreleased]



---

## [0.2.0] - 2026-05-07 — MVP

### ✨ Features

#### Personnage
- Commande `/start` : création du personnage via un modal — le joueur saisit lui-même le nom de son personnage
- Nom de personnage indépendant du pseudo Discord, affiché partout (profil, primes, marché)

#### Système de combat
- Régénération passive des HP hors combat (2 HP/minute)
- Soins des ennemis entre les tours : valeur fixe par ennemi (`restHeal`) au lieu d'un pourcentage
- Passives d'armes déclenchées après chaque attaque du joueur

#### Donjons solo
- Premier arc disponible, avec plusieurs salles et ennemis progressifs
- Système de butin après combat : item au hasard dans le pool de l'ennemi
- Système d'alliés PNJ dans certaines salles
- Persistence de l'état de donjon en Redis (reprise possible après reconnexion)

#### Primes (mode multijoueur)
- Commande `/prime` restreinte au canal `wb-battle`
- Phase de recrutement : lobby public avec 4 slots, boutons Rejoindre / Quitter / Commencer
- Débloquée uniquement après avoir complété le donjon solo 5 (niveau 5 requis)
- Coût de lancement : 1 PA par joueur
- Combat à 4 joueurs simultanés contre vagues d'ennemis (tours résolus quand tous les joueurs ont agi)
- Phase de repos entre les salles : utilisation libre de consommables avant d'avancer
- Ennemis élites (⭐) : 10 % de chance par élite tué de recevoir un drop exclusif
- Butin final : chaque joueur choisit 1 item parmi 2 options + drops élites automatiques
- Récompenses (XP et or) ×1,5 distribuées aux survivants à la victoire

#### Marché & Marchand
- Vente aux enchères : durée configurable (1h / 6h / 24h), prix de départ et achat direct optionnel
- Timer d'enchère en temps réel via le format Discord natif `<t:UNIX:R>` (mise à jour automatique)
- Vente au marchand ambulant : 10 % du prix de base, consomme 1 PA
- Boutique du marchand ambulant : réinitialisation toutes les 8h, stock généré selon les richesses du marchand
- Économie dynamique du marchand : les achats l'enrichissent, les ventes le drainent
- Stock basé sur le nombre de personnages actifs du serveur, items filtrés par budget disponible
- Message de boutique épinglé dans `wb-market`, édité automatiquement à chaque reset ou achat
- Prévention du blocage économique (reset au capital initial si budget insuffisant)

#### Système de PA (Points d'Action)
- Maximum de 10 PA, rechargé à raison de 1 PA toutes les 2 heures
- Vente au marchand et lancement de prime consomment chacun 1 PA
- Restauration complète des PA lors d'une montée de niveau

#### Serveurs multiples
- Initialisation correcte de tous les serveurs au démarrage du bot
- Shops restaurés ou réinitialisés automatiquement après redémarrage

#### Commandes slash
- `/start` — Créer son personnage (modal de saisie du nom)
- `/profile` — Afficher son profil, stats et équipement actuel
- `/inventory` — Gérer son inventaire (équiper, déséquiper, vendre, utiliser)
- `/dungeon` — Lancer ou reprendre un donjon solo
- `/prime` — Lancer une expédition de groupe (Prime)
- `/setup` *(admin)* — Initialiser les canaux WorldBoss sur le serveur

#### Capacité spéciale — Nécromancien
- `raise_skeletons` : invoque des squelettes pour remplir les slots libres (max 4 ennemis sur le board)
- `dark_ritual` : soin personnel en fonction du nombre d'alliés vivants (5 / 10 / 20 HP)
- `necromancer_power` : dispatch aléatoire 50/50 entre les deux capacités ci-dessus

#### Animation des combats
- Nouveau module `utils/animate.js` : `animateLore` (révèle le lore phrase par phrase), `animateCombatLogs` (rejoue les logs action par action avec transition HP animée), `animateXpGain`
- Classe `CombatLog` dans `combatEngine.js` et `primeCombatEngine.js` : snapshot HP après chaque action (`frames`), permet l'animation d'état précis

#### Arc 2 — Bandits du Château (nouveau contenu)
- 4 nouveaux ennemis dans `enemies/arc2_chateau.js` : `bandit_scout`, `bandit_thief`, `bandit_brute`, `bandit_leader`
- 5 nouvelles capacités ennemies dans `abilities/arc2_chateau.js` : `quick_strike`, `steal`, `smash`, `intimidate`, `shadow_strike`

#### Donjon 5 — restructuré
- Salle 2 : remplace `necromancer` par `skeleton_warlord` (boss intermédiaire)
- Salle 3 ajoutée : combat final contre le nécromancien seul
- Récompense `unlockPrimes: true` ajoutée au donjon 5 (débloque les primes à la victoire)

#### Primes — équilibrage 4v4
- `primes.js` : `enemyStats` par salle pour ajuster HP/ATK des ennemis selon le contexte multijoueur
  - Salle 1 : `skeleton_warlord` HP ×3,5, ATK ×1,5 vs solo
  - Salle 2 (boss room) : `skeleton_king` HP 600, `necromancer` HP 280, scaling distinct

### 🐛 Fixes

- Profil affichant "undefined" corrigé (relation `user` incluse dans la requête personnage)
- Initialisation d'un seul serveur sur deux corrigée (`client.guilds.fetch()` avant la boucle)
- Randomisation biaisée du stock marchand corrigée (Fisher-Yates au lieu de `.sort(() => Math.random())`)
- Items légendaires dans le stock du marchand débutant corrigés (filtrage strict par budget)
- Doublons de commandes Discord supprimés (nettoyage des commandes globales après passage en guild commands)
- Timer d'enchère statique corrigé (passage au format timestamp Discord natif)
 HP négatifs impossibles : `Math.max(0, ...)` appliqué partout dans les moteurs de combat et les skills/capacités
- Stun sur cible déjà morte corrigé (Lance de glace n'applique plus le stun si HP ≤ 0)
- `deploy-commands.js` : dossier `admin` manquant dans `commandDirs`
- Arcs non implémentés (3, 4, 6, 8) retirés de `abilities/index.js` et `enemies/index.js` pour éviter les erreurs au démarrage

### 🧹 Maintenance

- Deploy commands : mode guild (instantané) via `DEPLOY_GUILD_IDS` dans `.env`, mode global par défaut
- État de combat et de donjon persisté en Redis avec TTL
- Jobs BullMQ pour l'expiration des enchères et le reset du marchand
- Migration Prisma : `add_merchant_shop`, `add_character_name`, `add_prime_system`
- Messages de logs de combat uniformisés : HP courant affiché après chaque action `*(HP/maxHP)* `
- `potion_mana` renommée en `potion_boost` (cohérence — l'effet est un buff ATK, pas un soin de mana)
- Équilibrage ennemis arc 1 : `skeleton_king.def` 7 → 1, `necromancer.hp` 80 → 100
- Refactor skills offensifs : suppression des blocs `if/else` redondants, logs simplifiés

---

## [0.1.0] - 2025-01-01 — Installation

### ✨ Features

- Initialisation du projet Discord bot (Node.js + Discord.js v14)
- Connexion base de données PostgreSQL via Prisma ORM
- Cache Redis (ioredis) pour les états de combat et de donjon
- Structure de projet : `commands/`, `events/`, `services/`, `engines/`, `data/`, `cache/`
- Chargement dynamique des commandes et événements au démarrage
- Script de déploiement des commandes slash (`npm run deploy`)
- Fichier `.env` pour la configuration (token Discord, URL DB, URL Redis)
- Schéma Prisma initial : `User`, `Character`, `Item`, `CharacterItem`, `Loadout`, `DungeonRun`, `Guild`, `GuildChannels`
- Commande `/setup` *(admin)* : création automatique de la catégorie et des canaux WorldBoss (`wb-info`, `wb-general`, `wb-battle`, `wb-market`)

### 📚 Documentation

- `README.md` — présentation du projet
- `CHANGELOG.md` — journal des versions (Keep a Changelog + Semantic Versioning)
- Cahier des charges initial

---

## Types de changements

- **✨ Features** : nouvelles fonctionnalités
- **🐛 Fixes** : corrections de bugs
- **⚠️ Breaking Changes** : changements incompatibles
- **🧹 Maintenance** : refactor, chores, dépendances
- **📚 Documentation** : documentation uniquement

---

## Règles de contribution

- Les messages de commit suivent la convention **Conventional Commits**
- Les issues peuvent être fermées automatiquement avec :

  - `Fixes #<numéro>`
  - `Closes #<numéro>`
  - `Resolves #<numéro>`
