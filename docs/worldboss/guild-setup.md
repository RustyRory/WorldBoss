# Setup automatique des serveurs — WorldBoss

Quand le bot démarre ou rejoint un nouveau serveur Discord, il vérifie et initialise automatiquement la structure de channels.

---

## Événements Discord concernés

| Événement | Fichier | Déclencheur |
|---|---|---|
| `ClientReady` | `src/events/clientReady.js` | Bot démarre — vérifie tous les serveurs |
| `GuildCreate` | `src/events/guildCreate.js` | Bot ajouté à un nouveau serveur |
| `GuildDelete` | `src/events/guildDelete.js` | Bot retiré ou serveur supprimé |
| `GuildMemberAdd` | `src/events/guildMemberAdd.js` | Nouveau membre rejoint le serveur |

---

## Flux ClientReady — vérification au démarrage

Au démarrage du bot, pour **chaque serveur** où il est présent :

```
Bot connecté
      │
      ▼
Pour chaque guild :
  ensureGuildInDb(guild)
        │
        ▼
  initGuildChannels(guild)   ← crée ce qui manque, ne touche pas à l'existant
        │
        ▼
  updateGuildChannels(guildId, channelIds)
```

Ce flux est **idempotent** : si les channels existent déjà, rien n'est recréé.

---

## Flux GuildCreate

```
Bot rejoint le serveur
        │
        ▼
ensureGuildInDb(guild)
  └── prisma.guild.upsert()
        ├── create Guild + GuildChannels (vide)
        └── update name + ownerId si déjà existant
        │
        ▼
initGuildChannels(guild)   ← même logique que ClientReady
        │
        ▼
Envoie embed de bienvenue dans wb-info
```

---

## Channels créés

Tous créés sous la catégorie **WorldBoss**.

| Channel | Nom Discord | Permissions | Usage |
|---|---|---|---|
| Info bot | `wb-info` | Lecture seule pour tous | Statut bot, classements, infos générales |
| Général | `wb-general` | Tout le monde peut écrire | Tchat libre lié au jeu |
| Commandes | `wb-commandes` | Tout le monde peut écrire | Toutes les commandes sauf `/dungeon` |
| Donjon | `wb-donjon` | Tout le monde peut écrire | Uniquement `/dungeon` |

> Channel futur (non implémenté dans le MVP) : `wb-marchand` (marché entre joueurs, débloqué après boss donjon lvl 3).

---

## Flux GuildDelete

```
Bot retiré du serveur (ou serveur supprimé)
        │
        ▼
removeGuildFromDb(guild.id)
  └── prisma.guild.delete()
        └── Cascade : GuildChannels + Character (+ CharacterItem, Loadout, DungeonRun)
```

Les channels Discord ne sont **pas** supprimés côté Discord (le bot n'a plus les permissions).

---

## Flux GuildMemberAdd

```
Nouveau membre rejoint
        │
        ▼
Lire Guild + GuildChannels depuis DB
        │
        ▼
Si wb-info existe
  └── Envoie embed de bienvenue avec :
        - Mention du membre
        - Rappel de /start pour créer son personnage sur ce serveur
        - Rappel des channels disponibles
        - Avatar du membre en thumbnail
```

---

## Commande manuelle : /setup

Un administrateur peut relancer l'initialisation à tout moment :

```
/setup
```

- Recrée uniquement ce qui manque (catégorie, channels)
- Met à jour les IDs en DB
- Répond en éphémère (visible uniquement par l'admin)
- Idempotent

---

## Données stockées en DB

```
Guild {
  id:      "1234567890"
  name:    "Mon Serveur"
  ownerId: "9876543210"
}

GuildChannels {
  guildId:          "1234567890"
  categoryId:       "1111111111"
  infoChannelId:    "2222222222"
  generalChannelId: "3333333333"
  dungeonChannelId: "4444444444"
  marketChannelId:  null          ← débloqué plus tard
}

User {
  id:       "111222333"           ← Discord user ID (partagé entre serveurs)
  username: "Rusty"
}

Character {
  userId:  "111222333"
  guildId: "1234567890"
  level:   5
  gold:    320
  hp:      140
  ...                             ← stats et progression propres à ce serveur
}
```

---

## Permissions requises pour le bot

- `Manage Channels` — créer catégorie et channels
- `View Channel` + `Send Messages` + `Embed Links` — dans tous les channels créés
- `GuildMembers` intent (privilegié) — pour l'événement GuildMemberAdd
