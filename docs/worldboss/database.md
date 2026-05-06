# Base de données — WorldBoss

Schéma source : [`worldboss-app/prisma/schema.prisma`](../../worldboss-app/prisma/schema.prisma)

Provider : **PostgreSQL**. ORM : **Prisma v5**.

---

## Diagramme des relations

```
User (identité Discord)
 └── Character (n)  ──→  Guild
       ├── CharacterItem (n)  ──→  Item
       ├── Loadout (1)
       └── DungeonRun (n)

Guild
 └── GuildChannels (1)

MarketListing
 ├── seller  ──→  Character
 └── bidder  ──→  Character
```

---

## Tables

### `User`

Identité Discord d'un joueur. N'existe qu'une fois par utilisateur, toutes guildes confondues. Ne contient aucune stat de jeu.

| Colonne | Type | Description |
|---|---|---|
| `id` | String PK | Discord user ID |
| `username` | String | Tag Discord |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

### `Character`

Personnage d'un joueur **sur un serveur Discord spécifique**. Un joueur peut avoir autant de personnages que de serveurs où il est présent.

Clé unique : `(userId, guildId)`.

| Colonne | Type | Défaut | Description |
|---|---|---|---|
| `id` | Int PK | autoincrement | |
| `userId` | String FK | | → `User.id` |
| `guildId` | String FK | | → `Guild.id` |
| `level` | Int | 1 | Niveau actuel |
| `xp` | Int | 0 | XP cumulée |
| `gold` | Int | 0 | Or disponible |
| `hp` | Int | 120 | HP courants |
| `actionPoints` | Int | 10 | PA disponibles |
| `actionPointsUpdatedAt` | DateTime | now() | Référence pour le calcul de recharge |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | updatedAt | |

---

### `Item`

Catalogue de tous les items (seed depuis `src/data/items.js` au démarrage).

| Colonne | Type | Description |
|---|---|---|
| `id` | String PK | Slug identifiant (ex: `sword_rusty`, `potion_heal`) |
| `name` | String | Nom affiché |
| `type` | String | `weapon` · `armor` · `helmet` · `boots` · `accessory` · `consumable` |
| `rarity` | String | `common` · `rare` · `epic` · `legendary` |
| `statsJson` | Json | Bonus de stats : `{ atk, def, hp, spd, crit, critMult }` |
| `skillJson` | Json? | Skill conféré : `{ name, mult, oncePerCombat, heal }` |
| `effectJson` | Json? | Effets passifs ou DOT |
| `price` | Int | Prix en or (shop) |
| `levelRequired` | Int | Niveau minimum pour équiper |

---

### `CharacterItem`

Inventaire d'un personnage. Junction entre `Character` et `Item`.

| Colonne | Type | Description |
|---|---|---|
| `id` | Int PK | |
| `characterId` | Int FK | → `Character.id` |
| `itemId` | String FK | → `Item.id` |
| `quantity` | Int | Quantité possédée |

Contrainte unique : `(characterId, itemId)`.

---

### `Loadout`

Équipement actif d'un personnage (un seul loadout par personnage).

| Colonne | Type | Description |
|---|---|---|
| `id` | Int PK | |
| `characterId` | Int FK unique | → `Character.id` |
| `weaponId` | String? | ID item équipé en arme |
| `armorId` | String? | ID item équipé en armure |
| `helmetId` | String? | ID item équipé en casque |
| `bootsId` | String? | ID item équipé en bottes |
| `accessory1Id` | String? | ID accessoire 1 |
| `accessory2Id` | String? | ID accessoire 2 |

---

### `DungeonRun`

Suivi d'une run de donjon (active ou terminée).

| Colonne | Type | Défaut | Description |
|---|---|---|---|
| `id` | Int PK | | |
| `characterId` | Int FK | | → `Character.id` |
| `chapter` | Int | | Numéro de chapitre |
| `currentRoom` | Int | 1 | Salle actuelle |
| `totalRooms` | Int | | Nombre total de salles |
| `status` | String | `active` | `active` · `completed` · `failed` |
| `lootJson` | Json | `[]` | Items collectés pendant la run |
| `createdAt` | DateTime | now() | |
| `updatedAt` | DateTime | updatedAt | |

---

### `Guild`

Serveur Discord enregistré.

| Colonne | Type | Description |
|---|---|---|
| `id` | String PK | Discord guild ID |
| `name` | String | Nom du serveur |
| `ownerId` | String | Discord ID du propriétaire |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

### `GuildChannels`

IDs des channels Discord créés par le bot pour ce serveur.

| Colonne | Type | Description |
|---|---|---|
| `id` | Int PK | |
| `guildId` | String FK unique | → `Guild.id` |
| `categoryId` | String? | ID catégorie "WorldBoss" |
| `infoChannelId` | String? | `wb-info` |
| `generalChannelId` | String? | `wb-general` |
| `dungeonChannelId` | String? | `wb-donjon` |
| `marketChannelId` | String? | `wb-marchand` |

---

### `MarketListing`

Annonce sur le marché d'un serveur (enchère ou vente marchant).

| Colonne | Type | Défaut | Description |
|---|---|---|---|
| `id` | Int PK | | |
| `guildId` | String | | Serveur concerné |
| `sellerId` | Int FK | | → `Character.id` du vendeur |
| `itemId` | String FK | | → `Item.id` |
| `quantity` | Int | 1 | |
| `type` | String | | `auction` · `merchant` |
| `startPrice` | Int | | Prix de départ |
| `buyoutPrice` | Int? | | Prix d'achat direct |
| `currentBid` | Int? | | Meilleure enchère actuelle |
| `bidderId` | Int? FK | | → `Character.id` de l'enchérisseur |
| `messageId` | String? | | Discord message ID de l'embed |
| `status` | String | `active` | `active` · `sold` · `expired` · `cancelled` |
| `expiresAt` | DateTime? | | |

---

## Migrations

```bash
# Créer et appliquer une migration
npx prisma migrate dev --name <description>

# Régénérer le client après modification du schéma
npx prisma generate

# Pousser le schéma sans migration (développement rapide)
npx prisma db push
```

---

## Notes de conception

- **Character par serveur** : un joueur a un personnage distinct par serveur Discord (guild). Rien n'est partagé entre serveurs — ni gold, ni inventaire, ni progression. Le seul lien cross-serveur prévu est le PvP inter-guildes (Phase 4).
- **Cascade delete** : toutes les relations enfants utilisent `onDelete: Cascade`. Supprimer une `Guild` supprime ses `GuildChannels` et tous les `Character` associés (avec leur inventaire, loadout, donjons).
- **statsJson** sur `Item` : évite de multiplier les colonnes nullables. Le champ est désérialisé dans `utils/stats.js`.
- **lootJson** sur `DungeonRun` : liste des IDs d'items collectés pendant la run, appliqués à l'inventaire salle par salle.
- **MarketListing** : le marché est local au serveur. `sellerId` et `bidderId` sont des `Character.id` (Int), pas des Discord user IDs — garantit qu'on vend/achète avec le personnage du bon serveur.
