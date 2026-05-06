# Système de donjon solo — WorldBoss

Les donjons solo sont accessibles dans le channel `wb-donjon` via la commande `/dungeon`.

---

## Accès et progression

La commande `/dungeon` affiche les donjons disponibles sous forme de **boutons**. Un donjon est accessible si le joueur a le **niveau requis**.

| Donjon | Niveau requis | Récompense spéciale |
|---|---|---|
| Donjon 1 — Les Catacombes | Lvl 1 | — |
| Donjon 2 — Les Catacombes Pt.2 | Lvl 2 | — |
| Donjon 3 — Les Catacombes Pt.3 | Lvl 3 | Débloque le marché (`wb-market`) |

Un donjon peut être rejoué indéfiniment. Le statut `✅` indique qu'il a déjà été complété au moins une fois.

Si le joueur relance `/dungeon` pendant une session active → peut reprendre ou abandonner.

---

## Donjon 1 — Les Catacombes (Lvl 1)

*Des squelettes réanimés rôdent dans ces ruines oubliées...*

| Salle | Ennemis | Description |
|---|---|---|
| 1 | `skeleton` | Une salle poussiéreuse. Un squelette se retourne lentement vers vous. |
| 2 | `skeleton_archer` | Un couloir étroit. Une flèche siffle avant même que vous voyiez la silhouette. |
| 3 | `skeleton` + `skeleton_archer` | Grande salle voûtée. Un squelette avance pendant que l'archer vise depuis l'ombre. |

---

## Donjon 2 — Les Catacombes Pt.2 (Lvl 2)

*Les squelettes sont de plus en plus nombreux et agressifs dans les profondeurs...*

| Salle | Ennemis | Description |
|---|---|---|
| 1 | `skeleton` + `skeleton_archer` | Salle couverte de crânes. Le squelette attaque pendant que l'archer tire depuis une galerie en hauteur. |
| 2 | `skeleton_mage` | Couloir étroit. Une boule de feu traverse l'obscurité. |
| 3 | `skeleton` + `skeleton_mage` | Corniche étroite au-dessus d'un puits sans fond. Deux squelettes avancent, leurs os grinçant. |

---

## Donjon 3 — Les Catacombes Pt.3 (Lvl 3)

*Un marchand isolé s'est réfugié à l'hôtel, cerné par des squelettes. Il a besoin d'aide...*

| Salle | Ennemis | Allié | Description |
|---|---|---|---|
| 1 | `skeleton` + `skeleton_mage` | — | Entrée de l'hôtel. Un squelette avance pendant que le mage lève les bras pour invoquer. |
| 2 | `skeleton` + `skeleton_archer` | — | Hall de l'hôtel. Le squelette se précipite pendant que l'archer vise depuis la mezzanine. |
| 3 | `skeleton` + `skeleton_mage` + `skeleton_archer` + `skeleton_knight` | **Aldric le Marchand** | Bar de l'hôtel. Quatre silhouettes encerclent Aldric — il se joint au combat ! |

### Allié NPC — Aldric le Marchand 🧑‍💼

| Stat | Valeur |
|---|---|
| HP | 45 |
| ATK | 8 |
| DEF | 3 |
| SPD | 5 |

Aldric attaque chaque tour (IA simple : 2/3 attaque, 1/3 repos).

### Récompense donjon 3

- Or : entre **30 et 60** 🪙
- **Débloque le marché** (`wb-market`) — achat/vente d'items entre joueurs
- Message d'Aldric : *"Tu m'as sauvé la mise, ami. Ma boutique te sera désormais ouverte."*

---

## Mécanique de salle

### Entre les salles

Après chaque salle terminée (tous ennemis vaincus) :
- **+15% HP max** récupérés (minimum 5 HP)
- Si **level up** pendant la salle → HP restaurés à 100% (le level up prime)

### Mort / Fuite

- **Mort** : HP mis à 1, session perdue, `DungeonRun` marqué `failed`
- **Fuite** : HP conservés (min 1), session perdue, `DungeonRun` marqué `failed`

### Fin du donjon

- `DungeonRun` marqué `completed`
- Or attribué (par salle ou récompense fixe pour donjon 3)
- Loot : chaque ennemi contribue **un candidat** à une pool ; **un seul item** est tiré au sort dans la pool

---

## Session de donjon (Redis)

| Clé Redis | Contenu | TTL |
|---|---|---|
| `dungeon:{characterId}` | État complet JSON (salle courante, ennemis combattus) | 2h |
| `combat:{characterId}` | État de combat JSON (HP, buffs, DoTs, cooldowns) | 2h |

---

## Résolution d'un tour

Fonction `resolveTurn(state, playerAction, targetIndex)` dans `combatEngine.js`.

```
1. Appliquer DoTs joueur (poison, brûlure…)
2. Décrémenter buffs joueur
3. Décrémenter cooldowns de skills
4. Calculer initiative : SPD + Random(0, SPD × 0.1)
5. Si joueur en premier :
   └── Joueur agit → ennemis vivants contre-attaquent (ordre SPD)
   Sinon :
   └── Ennemis contre-attaquent → joueur agit (si encore en vie)
6. Alliés agissent (après joueur + ennemis)
7. Vérifier mort joueur / tous ennemis morts
```

### Actions disponibles

| Action | Identifiant | Effet |
|---|---|---|
| Attaque | `combat_attack:N` | rawDmg × 1.0 + crit + passifs |
| Skill | `combat_skill_<key>:N` | rawDmg × mult (voir table skills) |
| Consommable | select menu `combat_consumable` | Selon effet de l'item |
| Fuite | `combat_flee` | 40–70% de réussite selon SPD |

---

## Récompenses XP par ennemi (arc 1)

| Ennemi | XP | Or (min–max) |
|---|---|---|
| `skeleton` | 12 | 1–3 |
| `skeleton_archer` | 15 | 1–4 |
| `skeleton_mage` | 18 | 2–5 |
| `skeleton_knight` | 25 | 3–7 |
| `skeleton_warlord` | 35 | 4–8 |
| `skeleton_king` | 45 | 6–10 |
| `necromancer` | 55 | 5–10 |
