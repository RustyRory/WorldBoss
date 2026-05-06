# Roadmap — WorldBoss

---

## MVP — Jouable solo donjon lvl 1 à 3 *(en cours)*

Objectif : un bot jouable sur un serveur, avec les donjons solo du chapitre 1 (3 salles + boss), la structure de channels automatique, et le World Boss coopératif de base.

### Système joueur
- [x] Création de personnage (`/start`) — un personnage par serveur Discord
- [x] Niveau, XP, gold, HP — propres à chaque serveur (pas de partage cross-serveur)
- [x] Items de base + inventaire + loadout 6 slots
- [x] Stats calculées (ATK, DEF, SPD, CRIT)
- [x] Points d'action (PA) avec recharge temporelle

### Système de combat
- [x] Moteur de combat tour par tour (rawDamage, crit, initiative, DOT, buffs)
- [x] Sessions Redis (combat 30min, donjon 2h) — resumable, clés par `characterId`

### Donjon solo — Chapitre 1

Structure : **3 salles** progressives, déblocables par niveau + progression.

#### Salle 1 — 1v1
- Combat contre 1 monstre (gobelin / squelette)
- Mécanique de base : attaque, skill, potion, fuite
- Récompense : XP + or

#### Salle 2 — 1v2
- Combat simultané contre 2 monstres
- Le joueur choisit sa cible à chaque tour
- Les 2 ennemis contre-attaquent chacun leur tour
- Récompense : XP + or

#### Salle 3 (Boss) — Roi des Squelettes
- Boss avec mécanique spéciale : à 50% HP, +5 ATK permanent
- Débloque le lvl 3 et le channel `wb-marchand` (chat uniquement, pas encore implémenté)
- Récompense : XP + or + loot garanti

#### Progression donjons
- [ ] Affichage liste donjons sous forme de boutons dans `wb-donjon`
- [ ] Donjon 1 visible dès lvl 1
- [ ] Donjon 2 visible si lvl 2 ET donjon 1 terminé
- [ ] Donjon 3 visible si lvl 3 ET donjon 2 terminé

### Setup serveur
- [x] Setup automatique au démarrage (vérification de tous les serveurs)
- [x] Channels MVP : `wb-info` (lecture seule), `wb-general`, `wb-commandes`, `wb-donjon`
- [x] Message de bienvenue nouveaux membres
- [x] Commande admin `/setup`

### World Boss
- [x] World Boss coopératif par serveur (phases, scaling, leaderboard)

---

## Phase 2 — Économie & Contenu

- [ ] **Marchand** — channel `wb-marchand` actif après le boss donjon 3 : vente/achat entre joueurs (enchères), achat direct, stock marchand refresh toutes les heures
- [ ] **Loot complet** — tables de drop par salle, choix parmi 2–3 items après boss
- [ ] **Reset automatique World Boss** — cron BullMQ (lundi 00h00 UTC)
- [ ] **Chapitres 4–6** (suite de la progression donjon solo)

---

## Phase 3 — Social & Guilde

- [ ] **Quêtes journalières / hebdomadaires**
- [ ] **Leaderboard global** inter-serveurs
- [ ] **Hauts faits** + rôles Discord automatiques
- [ ] **PvP 1v1** entre joueurs du même serveur

---

## Phase 4 — Multi & PvP inter-serveurs

Débloqué à partir du donjon solo lvl 7.

- [ ] **Primes (donjon multi 4v4)** — channel `wb-primes`
- [ ] **PvP inter-serveurs 4v4** — 4 personnages d'une guild affrontent 4 personnages d'une autre guild
  - Chaque participant est un `Character` de sa guild respective
  - Aucune stat n'est partagée cross-serveur : on joue avec son personnage local
  - Le lien cross-serveur se fait uniquement au niveau de la session de combat

---

## Phase 5 — Endgame

- [ ] Chapitres 7–12 (Château → Désert → Profondeurs → Steampunk → Médiéval → Céleste)
- [ ] Sets d'équipement (bonus 2 et 4 pièces)
- [ ] Saisons PvP + cosmétiques premium
- [ ] Dashboard web (stats, leaderboard, profil hors Discord)

---

## Backlog (idées non planifiées)

- Guildes nommées (nom, bannière, description)
- Marchands itinérants en donjon (event aléatoire)
- Défis quotidiens spéciaux (boss aléatoire le weekend)
- Système de prestige (reset volontaire lvl 50)
- Mode spectateur (observer un combat en cours)
- Notifications DM (boss à 20% HP)

---

## Dépendances

```
MVP (donjon 1→3 + channels + World Boss)
   │
   ├── Phase 2 (marchand + loot + donjons 4→6)
   │       │
   │       └── Phase 3 (social + guilde + PvP serveur)
   │               │
   │               └── Phase 4 (multi + PvP inter-serveurs) ← débloqué lvl 7
   │                       │
   │                       └── Phase 5 (endgame)
   │
   └── [Backlog] indépendant des phases
```
