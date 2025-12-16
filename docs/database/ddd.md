# 🧩 Dictionnaire des Données — Projet WorldBoss

---

## **SERVERS**

`servers`

| Colonne             | Type         | Description                            |
| ------------------- | ------------ | -------------------------------------- |
| id                  | int, PK      | Identifiant unique du serveur          |
| discord_id          | varchar(50)  | Identifiant Discord du serveur, unique |
| name                | varchar(100) | Nom du serveur                         |
| owner_id            | varchar(50)  | Identifiant Discord du propriétaire    |
| level               | int          | Niveau du serveur                      |
| prestige            | int          | Points de prestige                     |
| gold_reserve        | int          | Réserve d’or du serveur                |
| created_at          | datetime     | Date de création du serveur            |
| category_id         | varchar(50)  | ID de la catégorie Discord             |
| combat_channel_id   | varchar(50)  | ID du channel combat                   |
| combat_message_id   | varchar(50)  | ID du message combat                   |
| merchant_channel_id | varchar(50)  | ID du channel marchand                 |
| merchant_message_id | varchar(50)  | ID du message marchand                 |
| event_id            | varchar(50)  | ID du message événement                |
| general_channel_id  | varchar(50)  | ID du channel général                  |

**Relations principales :**

- 1—N `Players`
- 1—1 `Merchants`
- 1—N `Bosses`

---

## **PLAYERS**

`players`

| Colonne        | Type                      | Description                           |
| -------------- | ------------------------- | ------------------------------------- |
| id             | int, PK                   | Identifiant du joueur                 |
| discord_id     | varchar(50)               | Identifiant Discord du joueur, unique |
| server_id      | int, FK vers `servers.id` | Serveur auquel le joueur appartient   |
| name           | varchar(100)              | Nom du joueur                         |
| level          | int                       | Niveau du joueur                      |
| exp            | int                       | Expérience                            |
| hp             | int                       | Points de vie actuels                 |
| hp_max         | int                       | Points de vie maximum                 |
| attack         | int                       | Attaque actuelle                      |
| attack_max     | int                       | Attaque maximale                      |
| defense        | int                       | Défense actuelle                      |
| defense_max    | int                       | Défense maximale                      |
| crit_rate      | int                       | Taux de critique actuel               |
| crit_rate_max  | int                       | Taux de critique maximal              |
| gold           | int                       | Or détenu par le joueur               |
| actions_points | int                       | Points d’action                       |
| skills_points  | int                       | Points de compétence                  |
| alive          | tinyint(1)                | Joueur vivant ou non                  |

**Relations principales :**

- N—1 `Servers`
- 1—1 `Inventories`

---

## **INVENTORIES**

`inventories`

| Colonne   | Type                      | Description         |
| --------- | ------------------------- | ------------------- |
| id        | int, PK                   | Identifiant         |
| player_id | int, FK vers `players.id` | Joueur propriétaire |

**Relations principales :**

- N—1 `Players`
- 1—N `Item_Instances`

---

## **ITEMS**

`items`

| Colonne       | Type                                    | Description                              |
| ------------- | --------------------------------------- | ---------------------------------------- |
| id            | int, PK                                 | Identifiant unique                       |
| name          | varchar(100)                            | Nom de l’objet                           |
| category      | enum('consommable','arme','equipement') | Catégorie de l’objet                     |
| description   | text                                    | Description                              |
| hp_bonus      | int                                     | Bonus points de vie (arme ou équipement) |
| attack_bonus  | int                                     | Bonus attaque (arme ou équipement)       |
| defense_bonus | int                                     | Bonus défense (arme ou équipement)       |
| price         | int                                     | Prix d’achat                             |
| sell_price    | int                                     | Prix de vente                            |

**Relations principales :**

- 1—N `Item_Instances`
- N—N `Merchant_Items`

---

## **ITEM_INSTANCES**

`item_instances`

| Colonne      | Type                          | Description                             |
| ------------ | ----------------------------- | --------------------------------------- |
| id           | int, PK                       | Identifiant unique de l’instance        |
| item_id      | int, FK vers `items.id`       | Objet associé                           |
| inventory_id | int, FK vers `inventories.id` | Inventaire auquel appartient l’instance |
| equipped     | tinyint(1)                    | 1 si équipé, 0 sinon                    |

**Relations principales :**

- N—1 `Items`
- N—1 `Inventories`
- N—1 `Merchants`

---

## **MERCHANTS**

`merchants`

| Colonne      | Type                      | Description                            |
| ------------ | ------------------------- | -------------------------------------- |
| id           | int, PK                   | Identifiant du marchand                |
| server_id    | int, FK vers `servers.id` | Serveur associé                        |
| gold         | int                       | Or détenu par le marchand              |
| last_refresh | datetime                  | Dernière actualisation de l’inventaire |

**Relations principales :**

- N—1 `Servers`
- 1—N `Merchant_Items`

---

## **MERCHANT_ITEMS**

`merchant_items`

| Colonne     | Type                        | Description      |
| ----------- | --------------------------- | ---------------- |
| id          | int, PK                     | Identifiant      |
| merchant_id | int, FK vers `merchants.id` | Marchand associé |
| item_id     | int, FK vers `items.id`     | Objet associé    |

**Relations principales :**

- N—1 `Merchants`
- N—1 `Items`

---

## **BOSS_TEMPLATES**

`boss_templates`

| Colonne         | Type         | Description           |
| --------------- | ------------ | --------------------- |
| id              | int, PK      | Identifiant du modèle |
| name            | varchar(100) | Nom du boss           |
| level           | int          | Niveau du boss        |
| base_hp         | int          | Points de vie de base |
| base_attack     | int          | Attaque de base       |
| base_defense    | int          | Défense de base       |
| lore            | text         | Histoire du boss      |
| gif_url         | varchar(255) | Image du boss         |
| gif_url_lore_01 | varchar(255) | Image lore            |
| gif_url_lore_02 | varchar(255) | Image lore            |
| gif_url_lore_03 | varchar(255) | Image lore            |
| gif_url_lore_04 | varchar(255) | Image lore            |
| gif_url_lore_05 | varchar(255) | Image lore            |
| gif_url_lore_06 | varchar(255) | Image lore            |
| gif_url_lore_07 | varchar(255) | Image lore            |
| gif_url_lore_08 | varchar(255) | Image lore            |
| gif_url_lore_09 | varchar(255) | Image lore            |
| gif_url_lore_10 | varchar(255) | Image lore            |

**Relations principales :**

- 1—N `Bosses`

---

## **BOSSES**

`bosses`

| Colonne     | Type                             | Description                       |
| ----------- | -------------------------------- | --------------------------------- |
| id          | int, PK                          | Identifiant du boss               |
| server_id   | int, FK vers `servers.id`        | Serveur associé                   |
| template_id | int, FK vers `boss_templates.id` | Modèle de boss                    |
| hp          | int                              | Points de vie actuels             |
| attack      | int                              | Attaque actuelle                  |
| defense     | int                              | Défense actuelle                  |
| last_reset  | datetime                         | Date de dernière réinitialisation |

**Relations principales :**

- N—1 `Servers`
- N—1 `Boss_Templates`

---
