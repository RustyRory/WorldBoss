# Données de jeu — WorldBoss

Référence complète de toutes les données statiques du jeu.

---

## Table des matières

1. [Items](#items)
   - [Armes](#armes)
   - [Armures](#armures)
   - [Casques](#casques)
   - [Bottes](#bottes)
   - [Accessoires](#accessoires)
   - [Consommables](#consommables)
2. [Ennemis](#ennemis)
   - [Arc 1 — Catacombes](#arc-1--catacombes)
   - [Arc 2 — Château maudit](#arc-2--château-maudit)
3. [Skills joueur](#skills-joueur)
   - [Offensifs](#offensifs)
   - [Défensifs](#défensifs)
   - [Support](#support)
4. [Passives d'armes](#passives-darmes)
5. [Capacités ennemies](#capacités-ennemies)
   - [Arc 1](#arc-1)
   - [Arc 2](#arc-2)
6. [Donjons](#donjons)
7. [Primes](#primes)

---

## Items

> Raretés : `common` · `rare` · `epic` · `legendary`

### Armes

| ID | Nom | Rareté | ATK | Bonus | Skill | Passive | Prix | Niv. |
|---|---|---|---|---|---|---|---|---|
| `fists` | Poings | common | 3 | — | — | — | 0 | 1 |
| `sword_rusty` | Épée rouillée | common | 5 | — | — | — | 100 | 2 |
| `bow_wooden` | Arc en bois | common | 4 | crit +10 | — | — | 60 | 1 |
| `staff_bone` | Bâton d'os | common | 6 | — | bone_bolt | — | 80 | 2 |
| `sword_steel` | Lame d'acier | rare | 8 | crit +5 | — | — | 150 | 3 |
| `spear_iron` | Lance de fer | rare | 10 | def +2 | — | — | 160 | 3 |
| `book_fire` | Livre de feu | rare | 5 | — | firebolt | fire_dot | 200 | 4 |
| `dagger_shadow` | Dague de l'ombre | rare | 7 | crit +15 | — | poison_dot | 190 | 4 |
| `axe_heavy` | Hache lourde | rare | 12 | spd -2 | — | — | 180 | 5 |
| `crossbow_steel` | Arbalète d'acier | rare | 9 | crit +12 | — | — | 220 | 5 |
| `bow_hunter` | Arc du chasseur | epic | 6 | crit +15 | — | — | 350 | 6 |
| `sword_ancient` | Épée ancienne | epic | 12 | crit +8 | — | bleed | 300 | 6 |
| `throwing_knife` | Couteau de lancer | rare | 8 | crit +20 | — | — | 200 | 8 |
| `scimitar_gold` | Cimeterre doré | epic | 11 | spd +3, crit +10 | — | — | 380 | 8 |
| `whip_venom` | Fouet venimeux | epic | 9 | crit +12 | — | poison_dot | 360 | 10 |
| `staff_desert` | Bâton du désert | epic | 10 | — | sand_storm | — | 400 | 10 |
| `staff_royal` | Bâton royal | epic | 14 | — | thunder_bolt | fire_dot | 800 | 16 |
| `rifle_steam` | Fusil à vapeur | epic | 16 | crit +15 | — | — | 600 | 14 |
| `sword_pharaoh` | Épée du Pharaon | legendary | 18 | crit +12 | royal_smite | cursed_strike | 1200 | 17 |
| `staff_infernal` | Bâton infernal | legendary | 20 | — | inferno_blast | fire_dot | 1800 | 20 |
| `sword_hell` | Épée de l'enfer | legendary | 25 | crit +15 | hellstrike | fire_dot | 2000 | 21 |
| `axe_infernal` | Hache infernale | legendary | 28 | spd -3 | — | bleed | 1600 | 22 |

---

### Armures

| ID | Nom | Rareté | HP | DEF | Bonus | Prix | Niv. |
|---|---|---|---|---|---|---|---|
| `cloth_simple` | Vêtements simples | common | 5 | 1 | — | 0 | 1 |
| `robe_cloth` | Robe de tissu | common | 8 | 2 | — | 50 | 1 |
| `leather_armor` | Armure de cuir | common | 15 | 3 | — | 80 | 2 |
| `iron_armor` | Armure de fer | rare | 25 | 8 | spd -1 | 200 | 4 |
| `magic_robe` | Robe magique | rare | 10 | — | atk +3 | 220 | 5 |
| `scale_armor` | Armure d'écailles | rare | 35 | 12 | spd -2 | 280 | 5 |
| `studded_leather` | Cuir clouté | rare | 22 | 8 | crit +5 | 240 | 6 |
| `desert_cloth` | Vêtement du désert | common | 20 | 5 | spd +2 | 150 | 8 |
| `desert_robe` | Robe du désert | rare | 30 | — | atk +5 | 350 | 10 |
| `steam_armor` | Armure à vapeur | epic | 60 | 20 | spd -3 | 700 | 14 |
| `royal_armor` | Armure royale | epic | 55 | 18 | atk +5 | 900 | 17 |
| `infernal_plate` | Plastron infernal | legendary | 100 | 30 | spd -4 | 2000 | 21 |

---

### Casques

| ID | Nom | Rareté | DEF | Bonus | Prix | Niv. |
|---|---|---|---|---|---|---|
| `helmet_broken` | Casque cassé | common | 2 | — | 30 | 1 |
| `circlet_bone` | Diadème d'os | common | 3 | atk +2 | 45 | 2 |
| `helmet_soldier` | Casque de soldat | rare | 5 | — | 120 | 3 |
| `hood_shadow` | Capuche de l'ombre | rare | 2 | crit +15 | 200 | 5 |
| `turban_desert` | Turban du désert | rare | 6 | spd +2 | 220 | 8 |
| `goggles_steam` | Lunettes à vapeur | epic | 8 | crit +20 | 650 | 14 |
| `crown_pharaoh` | Couronne du Pharaon | legendary | 10 | atk +8, crit +10 | 1500 | 17 |
| `helm_infernal` | Heaume infernal | legendary | 18 | atk +6 | 1800 | 21 |

---

### Bottes

| ID | Nom | Rareté | SPD | Bonus | Prix | Niv. |
|---|---|---|---|---|---|---|
| `boots_simple` | Bottes simples | common | 1 | — | 20 | 1 |
| `boots_light` | Bottes légères | rare | 3 | — | 100 | 3 |
| `boots_shadow` | Bottes de l'ombre | rare | 5 | crit +8 | 180 | 5 |
| `sandals_desert` | Sandales du désert | rare | 6 | — | 200 | 8 |
| `boots_steam` | Bottes à vapeur | epic | 8 | def +5 | 600 | 14 |
| `boots_infernal` | Bottes infernales | legendary | 10 | atk +4 | 1800 | 21 |

---

### Accessoires

> 2 slots d'accessoire disponibles dans le loadout.

| ID | Nom | Rareté | Bonus | Skill | Passive | Prix | Niv. |
|---|---|---|---|---|---|---|---|
| `ring_wood` | Anneau de bois | common | hp +5 | — | — | 15 | 1 |
| `ring_power` | Anneau de puissance | rare | atk +2 | — | — | 90 | 2 |
| `amulet_bone` | Amulette d'os | rare | hp +15, def +3 | — | — | 100 | 2 |
| `ring_crit` | Anneau de critique | rare | crit +10 | — | — | 130 | 3 |
| `talisman_old` | Talisman ancien | epic | — | soin | — | 400 | 5 |
| `ring_shadow` | Anneau de l'ombre | epic | crit +15, atk +3 | shadow_burst | — | 450 | 5 |
| `scarab_beetle` | Scarabée sacré | rare | hp +20, spd +3 | — | — | 280 | 8 |
| `ankh_pharaoh` | Ânkh du Pharaon | epic | hp +40 | divine_heal | — | 1100 | 17 |
| `pendant_soul` | Pendentif de l'âme | legendary | atk +10, crit +20 | soul_drain | life_steal | 2200 | 21 |

---

### Consommables

| ID | Nom | Rareté | Effet | Hors combat | Prix | Niv. |
|---|---|---|---|---|---|---|
| `potion_heal` | Potion de soin | common | heal +30 | ✓ | 25 | 1 |
| `potion_mana` | Potion de boost | common | buff atk +5 / 2 tours | — | 35 | 1 |
| `antidote` | Antidote | common | cure_dot | ✓ | 30 | 1 |
| `bomb` | Bombe | common | dégâts +25 (AOE) | — | 40 | 1 |
| `potion_speed` | Potion de vitesse | rare | buff spd +5 / 3 tours | — | 60 | 2 |
| `scroll_ice` | Parchemin de glace | rare | stun 2 tours | — | 80 | 3 |
| `poison_vial` | Fiole de poison | rare | DOT +10 / 3 tours | — | 70 | 3 |
| `elixir_iron` | Élixir de fer | rare | buff def +15 / 3 tours | — | 90 | 6 |
| `scroll_fire` | Parchemin de feu | rare | dégâts +40 | — | 75 | 5 |
| `elixir_berserk` | Élixir berserker | rare | buff atk +15 / 2 tours | — | 100 | 8 |
| `smoke_bomb` | Bombe fumigène | rare | stun AOE 1 tour | — | 90 | 7 |
| `elixir_ap` | Élixir de volonté | rare | restore_ap +3 | ✓ | 120 | 1 |

---

## Ennemis

> Colonnes : HP · ATK · DEF · SPD · CRIT · restHeal · XP · Or (min-max)

### Arc 1 — Catacombes

| ID | Nom | HP | ATK | DEF | SPD | CRIT | Heal | XP | Or | Capacité | Élite |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `skeleton` | Squelette | 50 | 8 | 3 | 6 | 0 | 5 | 12 | 1-3 | — | |
| `skeleton_archer` | Archer Squelette | 45 | 10 | 2 | 12 | 5 | 5 | 18 | 1-3 | precise_shot | |
| `skeleton_mage` | Mage Squelette | 40 | 13 | 1 | 8 | 5 | 5 | 22 | 2-4 | fireball | |
| `skeleton_knight` | Chevalier Squelette | 90 | 13 | 8 | 4 | 0 | 8 | 28 | 3-6 | shield_bash | |
| `skeleton_warlord` | Chef de guerre | 120 | 15 | 9 | 5 | 5 | 10 | 45 | 5-8 | war_cry | |
| `skeleton_king` | Roi Squelette | 150 | 22 | 1 | 9 | 8 | 10 | 55 | 6-10 | bone_shield | ⭐ |
| `necromancer` | Nécromancien | 100 | 16 | 3 | 7 | 5 | 8 | 48 | 4-7 | necromancer_power | ⭐ |

**Alliés PNJ**

| ID | Nom | HP | ATK | DEF | SPD |
|---|---|---|---|---|---|
| `merchant_aldric` | Aldric le Marchand | 45 | 8 | 3 | 5 |

---

### Arc 2 — Château maudit

| ID | Nom | HP | ATK | DEF | SPD | CRIT | Heal | XP | Or | Capacité | Élite |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `castle_warrior` | Guerrier du château | 100 | 16 | 9 | 5 | 0 | 8 | 30 | 3-6 | power_strike | |
| `castle_priest` | Prêtre du château | 80 | 14 | 5 | 6 | 0 | 8 | 35 | 3-6 | heal | |
| `bandit_scout` | Éclaireur bandit | 120 | 18 | 6 | 16 | 10 | 12 | 38 | 4-7 | quick_strike | |
| `bandit_thief` | Voleur bandit | 130 | 20 | 7 | 14 | 8 | 12 | 45 | 5-9 | steal | |
| `bandit_brute` | Brute bandit | 175 | 24 | 12 | 7 | 0 | 15 | 58 | 6-10 | smash | |
| `bandit_leader` | Chef bandit | 190 | 26 | 10 | 12 | 8 | 15 | 65 | 8-12 | intimidate | |
| `desert_assassin` | Assassin du désert | 175 | 34 | 9 | 17 | 20 | 15 | 80 | 9-15 | shadow_strike | ⭐ |

---

## Skills joueur

> Les skills sont liés aux armes (champ `skill`) ou aux accessoires.  
> `oncePerCombat` : utilisable une seule fois par combat. Sinon, le champ `cooldown` indique le nombre de tours avant réutilisation.

### Offensifs

| ID | Nom | Cooldown | Effet |
|---|---|---|---|
| `firebolt` | Firebolt | 2 | Dégâts ×1,8 ATK |
| `bone_bolt` | Trait osseux | 2 | Dégâts ×1,5 + DOT Froid Osseux (3 dégâts/tour, 2 tours) |
| `shadow_burst` | Explosion d'ombre | 3 | Dégâts ×2,2 ATK |
| `ice_lance` | Lance de glace | 3 | Dégâts ×1,6 + stun (si cible encore vivante) |
| `thunder_bolt` | Éclair | 3 | Dégâts ×1,7 ATK |
| `soul_rend` | Déchirement d'âme | 2 | Dégâts ×1,5 + DOT Saignement (5 dégâts/tour, 3 tours) |
| `power_slash` | Taille puissante | 3 | Dégâts ×2,0 ATK |
| `royal_smite` | Frappe royale | 4 | Dégâts ×2,2 ATK |
| `hellstrike` | Frappe infernale | 4 | Dégâts ×2,5 + DOT Brûlure (5 dégâts/tour, 3 tours) |
| `inferno_blast` | Souffle infernal | 5 | Dégâts ×2,0 ATK |
| `soul_drain` | Drain d'âme | 3 | Dégâts ×1,8 + soin joueur = 30% des dégâts |
| `sand_storm` | Tempête de sable | 3 | Dégâts ×1,4 + réduit DEF cible de 5 |

### Défensifs

| ID | Nom | Cooldown | Effet |
|---|---|---|---|
| `soin` | Soin | 1×/combat | Récupère 20 HP |
| `divine_heal` | Soin divin | 1×/combat | Récupère 50 HP |
| `second_wind` | Second souffle | 5 | Récupère 25% des HP max |
| `iron_skin` | Peau de fer | 4 | DEF +15 pendant 3 tours |
| `barrier` | Barrière | 5 | DEF +30 pendant 2 tours |

### Support

| ID | Nom | Cooldown | Effet |
|---|---|---|---|
| `battle_cry` | Cri de bataille | 4 | ATK +10 pendant 3 tours |
| `quicken` | Accélération | 3 | SPD +8 pendant 3 tours |
| `resurrection` | Résurrection | 1×/combat | Revit à 30% HP max (ou soin si déjà vivant) |

---

## Passives d'armes

> Déclenchées automatiquement après chaque attaque du joueur.

| ID | Nom | Effet |
|---|---|---|
| `fire_dot` | Brûlure | Applique DOT feu (2 dégâts/tour, 2 tours) |
| `poison_dot` | Poison | Applique DOT poison (1 dégât/tour, 3 tours) |
| `bleed` | Saignement | Applique DOT saignement (3 dégâts/tour, 3 tours) |
| `cursed_strike` | Frappe maudite | Réduit la DEF de la cible de 2 |
| `life_steal` | Vol de vie | Récupère 5 HP par tour |

---

## Capacités ennemies

### Arc 1

| ID | Nom | Ennemi | Effet |
|---|---|---|---|
| `precise_shot` | Tir précis | Archer Squelette | Dégâts = ATK ennemi, ignore 50% DEF |
| `fireball` | Boule de feu | Mage Squelette | Dégâts = ATK×1,8, ignore 30% DEF |
| `shield_bash` | Coup de bouclier | Chevalier Squelette | Dégâts normaux + stun joueur 1 tour |
| `war_cry` | Cri de guerre | Chef de guerre | Buff ATK ennemi +6 |
| `bone_shield` | Bouclier d'os | Roi Squelette | Buff DEF ennemi +8 |
| `raise_skeletons` | Invoquer squelettes | Nécromancien | Invoque des squelettes (remplit jusqu'à 4 slots) |
| `dark_ritual` | Rituel des ténèbres | Nécromancien | Soin selon alliés vivants : 0/5/10/20 HP |
| `necromancer_power` | Pouvoir nécromantique | Nécromancien | 50/50 entre raise_skeletons et dark_ritual |

### Arc 2

| ID | Nom | Ennemi | Effet |
|---|---|---|---|
| `quick_strike` | Frappe rapide | Éclaireur bandit | Dégâts = ATK ennemi, ignore toute DEF |
| `steal` | Vol | Voleur bandit | Dégâts normaux dans la mêlée |
| `smash` | Écrasement | Brute bandit | Dégâts ×1,4 + debuff DEF joueur -4 / 2 tours |
| `intimidate` | Intimidation | Chef bandit | Debuff ATK joueur -5 / 2 tours (pas de dégâts) |
| `power_strike` | Frappe puissante | Guerrier du château | Dégâts ×1,5 |
| `heal` | Soin | Prêtre du château | Soin ennemi +25% HP max |
| `rally` | Ralliement | Roi du château | Buff ATK ennemi +5, DEF +3 |
| `shadow_strike` | Frappe de l'ombre | Assassin du désert | Dégâts ×1,6, ignore 40% DEF, 30% chance crit ×1,5 |

---

## Donjons

> Mode solo. Niveau requis = niveau minimum du personnage pour accéder au donjon.

### Donjon 1 — Les Catacombes

| Salle | Ennemis | Notes |
|---|---|---|
| 1 | skeleton | — |
| 2 | skeleton_archer | — |
| 3 | skeleton + skeleton_archer | — |

**Prérequis :** Niveau 1

---

### Donjon 2 — Les Catacombes Part 2

| Salle | Ennemis |
|---|---|
| 1 | skeleton + skeleton_mage |
| 2 | skeleton_mage + skeleton_archer |
| 3 | skeleton + skeleton_archer |

**Prérequis :** Niveau 2

---

### Donjon 3 — Les Catacombes Part 3

| Salle | Ennemis | Notes |
|---|---|---|
| 1 | skeleton + skeleton_mage | — |
| 2 | skeleton + skeleton_archer | — |
| 3 | skeleton + skeleton_mage + skeleton_archer + skeleton_knight | Allié : Aldric le Marchand |

**Prérequis :** Niveau 3  
**Récompense :** Débloque le marché (`unlockMarket: true`)

---

### Donjon 4 — Les Catacombes Part 4

| Salle | Ennemis |
|---|---|
| 1 | skeleton_knight + skeleton_archer |
| 2 | skeleton_knight + skeleton_knight |
| 3 | skeleton_warlord + skeleton_mage + skeleton_archer |

**Prérequis :** Niveau 4

---

### Donjon 5 — Les Catacombes Part 5

| Salle | Ennemis | Notes |
|---|---|---|
| 1 | skeleton_warlord + skeleton_warlord | — |
| 2 | skeleton_king + skeleton_warlord | — |
| 3 | necromancer | Boss final |

**Prérequis :** Niveau 5  
**Récompense :** Débloque les primes (`unlockPrimes: true`)

---

## Primes

> Mode coopératif 4 joueurs. Niveau requis : 5. Coût : 1 PA par joueur.  
> Les stats `enemyStats` surchargent les stats de base pour l'équilibrage 4v4.

### Prime 1 — Les Catacombes : Expédition Élite

**Prérequis :** Niveau 5 + donjon 5 complété

#### Salle 1

| Ennemi | Quantité | HP (4v4) | ATK (4v4) | DEF | restHeal |
|---|---|---|---|---|---|
| skeleton_warlord | ×4 | 420 | 22 | 9 | 25 |

#### Salle 2 — Boss room

| Ennemi | Quantité | HP (4v4) | ATK (4v4) | DEF | restHeal | CRIT |
|---|---|---|---|---|---|---|
| skeleton_king | ×1 | 600 | 40 | 1 | 35 | 12 |
| necromancer | ×1 | 280 | 24 | 5 | 20 | — |
| skeleton_warlord | ×2 | 420 | 22 | 9 | 25 | — |
