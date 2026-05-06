# Commandes Discord — WorldBoss

Toutes les commandes sont des **slash commands** (discord.js v14).

---

## Restrictions par channel

| Channel | Commandes autorisées |
|---|---|
| `wb-commandes` | Toutes sauf `/dungeon` |
| `wb-donjon` | `/dungeon` uniquement |
| `wb-general` | Aucune commande bot |
| `wb-info` | Lecture seule — aucune commande |

---

## Commandes joueur

### `/start`

Crée le personnage du joueur **sur ce serveur**.

- Vérifie qu'il n'a pas déjà de personnage sur ce serveur (`Character` avec `userId + guildId`)
- Crée (ou réutilise) l'entrée `User` Discord, puis crée le `Character` lié à la guild
- Donne l'équipement de départ : Épée rouillée, Vêtements simples, 3× Potion de soin
- Crée le `Loadout` par défaut (épée + armure équipés)

> Un même joueur peut utiliser `/start` sur plusieurs serveurs — il obtient un personnage indépendant sur chacun.

**Fichier** : `src/commands/player/start.js`

---

### `/profile`

Affiche les stats et l'équipement du personnage **sur ce serveur**.

- Niveau, XP (barre de progression), gold
- HP courants
- Équipement actif (tous les slots)
- Stats calculées (ATK, DEF, SPD, CRIT%)
- Points d'action (PA) disponibles

**Fichier** : `src/commands/player/profile.js`

---

### `/inventory`

Affiche l'inventaire complet et le loadout actif du personnage **sur ce serveur**.

- Liste tous les `CharacterItem` avec quantité
- Met en valeur les items équipés
- Boutons pour équiper / vendre chaque item

**Fichier** : `src/commands/inventory/inventory.js`

---

### `/dungeon`

*(uniquement dans `wb-donjon`)*

Affiche la liste des donjons disponibles pour le personnage sous forme de **boutons**.

**Règles d'affichage :**

| Donjon | Niveau requis | Condition supplémentaire |
|---|---|---|
| Donjon 1 | Lvl 1 | — |
| Donjon 2 | Lvl 2 | Avoir terminé Donjon 1 |
| Donjon 3 | Lvl 3 | Avoir terminé Donjon 2 |
| ... | ... | ... |

Quand le joueur clique sur un bouton → lance le donjon correspondant.

Si une session de donjon est déjà active en Redis → reprend là où il s'était arrêté.

**Fichier** : `src/commands/dungeon/dungeon.js`

---

## Commandes admin

### `/setup`

*(Réservé administrateurs — `PermissionFlagsBits.Administrator`)*

Recrée ou met à jour les channels WorldBoss du serveur.

- Crée la catégorie **WorldBoss** si absente
- Crée `wb-info`, `wb-general`, `wb-commandes`, `wb-donjon` si absents
- Met à jour les IDs en DB (`GuildChannels`)
- Répond en éphémère

**Fichier** : `src/commands/admin/setup.js`

---

## Interactions boutons

Les boutons ne sont pas des slash commands mais sont gérés dans `src/events/interactionCreate.js`.

| customId | Déclencheur | Handler |
|---|---|---|
| `combat_attack` / `combat_skill` / `combat_flee` / `combat_item_*` | Combat en cours | `handleCombatButton` |
| `loot_0` / `loot_1` | Choix de loot après victoire | `handleLootChoice` |
| `dungeon_next` | Avancer dans le donjon | `handleDungeonNext` |
| `dungeon_start:{chapter}` | Lancer un donjon spécifique | `startDungeon` |
| `dungeon_abandon` | Abandonner la session active | Redis delete + sélection |
| `market_merchant:{itemId}` | Vente au marchant | `sellToMerchant` |
| `market_bid:{listingId}` | Ouvrir le modal d'enchère | showModal |
| `market_buyout:{listingId}` | Achat direct | `finaliseBuyout` |
| `unequip:{slot}` | Déséquiper un slot | `unequipSlot` |

Tous les handlers boutons résolvent `(userId, guildId)` → `characterId` avant d'agir.

---

## Format d'un fichier de commande

```js
module.exports = {
  data: new SlashCommandBuilder()
    .setName('nom')
    .setDescription('Description'),

  async execute(interaction) {
    const userId  = interaction.user.id;
    const guildId = interaction.guildId;
    // Résoudre le personnage avant tout appel service
    const character = await getCharacter(userId, guildId);
  },
};
```

Les commandes avec interactions longues doivent appeler `deferReply()` avant tout appel async.

---

## Déploiement des commandes

```bash
npm run deploy
```

Les commandes globales peuvent prendre jusqu'à 1h à se propager. Pour un déploiement instantané en dev, utiliser `Routes.applicationGuildCommands(clientId, guildId)` dans `deploy-commands.js`.
