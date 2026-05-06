# Système de combat — WorldBoss

Le moteur de combat est implémenté dans `src/engines/combatEngine.js`. C'est du code pur (aucun I/O) — utilisé pour les donjons solo et le World Boss coopératif.

---

## Formules de base

### Dégâts bruts

```
rawDmg = ATK × skillMultiplier × (100 / (100 + DEF))
```

La réduction par DEF est **asymptotique** — elle ne peut jamais atteindre 0.

| DEF | Réduction |
|---|---|
| 0 | 0% |
| 25 | 20% |
| 50 | 33% |
| 100 | 50% |
| 200 | 67% |

### Coup critique

```
isCrit   = random(0, 100) < CRIT%
finalDmg = rawDmg × critMult   (si crit)
finalDmg = rawDmg              (sinon)
```

`critMult` par défaut : **1.5×**. Modifiable par équipement.

### Exemple complet

```
Joueur : ATK = 50, CRIT% = 10%, critMult = 1.5
Ennemi : DEF = 30
Skill  : ×1.8 (firebolt)

rawDmg = 50 × 1.8 × (100 / 130) ≈ 69.2 → 69
isCrit → oui (10% de chance)
finalDmg = 69 × 1.5 = 104
```

---

## Initiative

```
Initiative = SPD + Random(0, SPD × 0.1)
```

Le joueur avec la plus haute initiative agit en premier. Si l'ennemi est **stun**, son initiative est 0 — il passe toujours après.

---

## Résolution d'un tour

Fonction `resolveTurn(state, playerAction, targetIndex)` dans `combatEngine.js`.

```
1. Appliquer DoTs joueur (poison, brûlure…) → réduire turns restants
2. Décrémenter buffs joueur → supprimer buff expiré et retirer le bonus
3. Décrémenter cooldowns skills
4. Calculer initiative joueur vs ennemi le plus rapide
5. Si joueur en premier :
   ├── Joueur agit sur la cible choisie
   └── Chaque ennemi vivant contre-attaque (si joueur encore en vie)
   Sinon :
   ├── Chaque ennemi vivant contre-attaque
   └── Joueur agit (si encore en vie)
6. Alliés NPC agissent (après joueur + ennemis)
7. Vérifier mort joueur / tous ennemis morts
```

---

## Actions du joueur

### Attaque basique (`attack`)

- Dégâts : `rawDmg × 1.0 + crit`
- Déclenche tous les **passifs actifs** du joueur après chaque coup porté

### Skill (`skill_<key>`)

- Chaque skill a un multiplicateur de dégâts et un effet optionnel
- Soumis aux **cooldowns** (tours) et à la limite `oncePerCombat`

| Skill | Multiplicateur | Effet | Cooldown |
|---|---|---|---|
| `firebolt` | ×1.8 | — | 2 tours |
| `bone_bolt` | ×1.5 | DoT os_froid 3 dmg/2 tours | 3 tours |
| `shadow_burst` | ×2.2 | — | 3 tours |
| `ice_lance` | ×1.6 | Stun ennemi | 3 tours |
| `thunder_bolt` | ×1.7 | — | 3 tours |
| `soul_rend` | ×1.5 | Saignement 5 dmg/3 tours | 3 tours |
| `power_slash` | ×2.0 | — | 3 tours |
| `royal_smite` | ×2.2 | — | 3 tours |
| `hellstrike` | ×2.5 | DoT feu 5 dmg/3 tours | 4 tours |
| `inferno_blast` | ×2.0 | — | 4 tours |
| `soul_drain` | ×1.8 | Soin 30% des dégâts infligés | 3 tours |
| `sand_storm` | ×1.4 | DEF ennemi −5 permanent | 3 tours |
| `soin` | — | +20 HP joueur | 1 fois/combat |
| `divine_heal` | — | +50 HP joueur | 1 fois/combat |
| `second_wind` | — | +25% HP max | CD 5 tours |
| `iron_skin` | — | DEF +15 pendant 4 tours | CD 4 tours |
| `barrier` | — | DEF +30 pendant 3 tours | CD 5 tours |
| `battle_cry` | — | ATK +10 pendant 3 tours | CD 4 tours |
| `quicken` | — | SPD +8 pendant 3 tours | CD 4 tours |
| `resurrection` | — | Soin 30% HP (si mort) | 1 fois/combat |

### Consommable (`item_<itemId>`)

Les consommables sont sélectionnés via un **select menu** pendant le combat. Seuls les items avec `type: 'consumable'` et un effet compatible sont affichés (les `restore_ap` sont exclus).

| Type d'effet | Comportement |
|---|---|
| `heal` | +N HP joueur (capped maxHp) |
| `damage` | N dégâts à la cible (ou tous si `aoe: true`) |
| `stun` | Ennemi stun N tours |
| `buff` | Stat +valeur pendant N tours |
| `dot` | DoT sur l'ennemi N dmg/tour pendant N tours |
| `cure_dot` | Supprime tous les DoTs du joueur |

Les items `infiniteUse: true` ont une quantité sentinel `-1` et ne sont jamais consommés.

### Fuite (`flee`)

```
fleeChance = 0.4 + (SPD_joueur / (SPD_joueur + SPD_ennemi)) × 0.3
```

En cas de succès : session de combat et de donjon supprimées, `DungeonRun` marqué `failed`.

---

## Passifs du joueur

Les passifs sont déclenchés automatiquement après **chaque attaque basique** réussie.

| Passif | Source | Effet |
|---|---|---|
| `fire_dot` | Arme / Accessoire | DoT feu 2 dmg/tour × 2 tours sur l'ennemi (refresh si déjà actif) |
| `poison_dot` | Arme | DoT poison 1 dmg/tour × 3 tours |
| `bleed` | Arme | DoT saignement 3 dmg/tour × 3 tours |
| `cursed_strike` | Arme | DEF ennemi −2 permanent |
| `regeneration` | Accessoire | +3 HP joueur |
| `life_steal` | Accessoire | +5 HP joueur |
| `frost_shield` | Accessoire | DEF +3 pendant 2 tours (si non actif) |

---

## IA ennemie

À chaque tour, l'ennemi choisit aléatoirement :

| Choix | Probabilité | Action |
|---|---|---|
| 0 | 1/3 | Attaque normale |
| 1 | 1/3 | Utilise son **ability** (si définie) |
| 2 | 1/3 | Repos → +15% HP max |

Les ennemis ont aussi des **DoTs ennemis** traités en début de leur tour.

---

## IA alliée (NPC)

| Choix | Probabilité | Action |
|---|---|---|
| Attaque | 2/3 | Frappe un ennemi vivant aléatoire |
| Repos | 1/3 | +15% HP max allié |

L'allié agit **après** le joueur et les ennemis.

---

## Abilities ennemies (exemples)

| Ability | Arc | Effet |
|---|---|---|
| `precise_shot` | Arc 1 | Ignore 50% DEF |
| `fireball` | Arc 1 | ×1.8 + ignore 30% DEF |
| `shield_bash` | Arc 1 | Dégâts + stun |
| `war_cry` | Arc 1 | ATK ennemi +6 |
| `quick_strike` | Arc 3 | ATK pleine sans réduction DEF |
| `frenzy_strike` | Arc 4 | 2 attaques |
| `curse` | Arc 4 | DoT 8 dmg/3 tours + DEF joueur −3 |
| `life_drain` | Arc 8 | ×1.2 + soin 50% dégâts |
| `inferno` | Arc 8 | ×2.5 + DoT 20 dmg/3 tours |
| `charm` | Arc 8 | SPD joueur −100 pendant 1 tour (ennemi passe en premier) |

---

## Stats du joueur

Calculées dans `src/utils/stats.js` — fonction `computeStats(character, loadout)`.

Stats de base par niveau :

```
HP  = 120 + (level − 1) × 20
ATK = 12  + (level − 1) × 2
DEF = 6   + (level − 1) × 1
SPD = 10  + floor((level − 1) / 5)
```

Les items équipés ajoutent leurs bonus (`stats.hp`, `stats.atk`, etc.). Les items avec `skill` ou `passive` alimentent `activeSkills[]` et `activePassives[]`.

### Régénération HP hors combat

```
HP régénérés = 2 HP / minute
```

Calculé lazily à partir du champ `hpUpdatedAt` (timestamp de dernière mise à jour HP).

---

## World Boss — phases de combat

| Phase | Condition HP | Multiplicateur ATK boss |
|---|---|---|
| Normal | > 30% | ×1.0 |
| Enragé | ≤ 30% | ×1.25 |
| Berserk | ≤ 15% | ×1.5 |
