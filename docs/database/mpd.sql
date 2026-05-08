-- =========================
-- TABLE : servers
-- =========================
CREATE TABLE servers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    owner_id VARCHAR(50) NOT NULL,
    level INT DEFAULT 1,
    prestige INT DEFAULT 0,
    gold_reserve INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category_id VARCHAR(50),
    combat_channel_id VARCHAR(50),
    combat_message_id VARCHAR(50),
    merchant_channel_id VARCHAR(50),
    merchant_message_id VARCHAR(50),
    event_id VARCHAR(50),
    general_channel_id VARCHAR(50)
) ENGINE=InnoDB;

-- =========================
-- TABLE : players
-- =========================
CREATE TABLE players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(50) NOT NULL UNIQUE,
    server_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    level INT DEFAULT 1,
    exp INT DEFAULT 0,
    hp INT,
    hp_max INT,
    attack INT,
    attack_max INT,
    defense INT,
    defense_max INT,
    crit_rate INT,
    crit_rate_max INT,
    gold INT DEFAULT 0,
    actions_points INT DEFAULT 0,
    skills_points INT DEFAULT 0,

    CONSTRAINT fk_players_server
        FOREIGN KEY (server_id) REFERENCES servers(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- TABLE : inventories
-- =========================
CREATE TABLE inventories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT NOT NULL UNIQUE,

    CONSTRAINT fk_inventory_player
        FOREIGN KEY (player_id) REFERENCES players(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- TABLE : items
-- =========================
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('consommable', 'arme', 'equipement') NOT NULL,
    description TEXT,
    hp_bonus INT DEFAULT 0,
    attack_bonus INT DEFAULT 0,
    defense_bonus INT DEFAULT 0,
    price INT DEFAULT 0,
    sell_price INT DEFAULT 0
) ENGINE=InnoDB;

-- =========================
-- TABLE : item_instances
-- =========================
CREATE TABLE item_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    inventory_id INT NOT NULL,
    equipped TINYINT(1) DEFAULT 0,

    CONSTRAINT fk_item_instance_item
        FOREIGN KEY (item_id) REFERENCES items(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_instance_inventory
        FOREIGN KEY (inventory_id) REFERENCES inventories(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- TABLE : merchants
-- =========================
CREATE TABLE merchants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL UNIQUE,
    gold INT DEFAULT 0,
    last_refresh DATETIME,

    CONSTRAINT fk_merchant_server
        FOREIGN KEY (server_id) REFERENCES servers(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================
-- TABLE : merchant_items
-- =========================
CREATE TABLE merchant_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT NOT NULL,
    item_id INT NOT NULL,

    CONSTRAINT fk_merchant_items_merchant
        FOREIGN KEY (merchant_id) REFERENCES merchants(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_merchant_items_item
        FOREIGN KEY (item_id) REFERENCES items(id)
        ON DELETE CASCADE,

    UNIQUE (merchant_id, item_id)
) ENGINE=InnoDB;

-- =========================
-- TABLE : boss_templates
-- =========================
CREATE TABLE boss_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INT NOT NULL,
    base_hp INT NOT NULL,
    base_attack INT NOT NULL,
    base_defense INT NOT NULL,
    lore TEXT,
    gif_url VARCHAR(255),
    gif_url_lore_01 VARCHAR(255),
    gif_url_lore_02 VARCHAR(255),
    gif_url_lore_03 VARCHAR(255),
    gif_url_lore_04 VARCHAR(255),
    gif_url_lore_05 VARCHAR(255),
    gif_url_lore_06 VARCHAR(255),
    gif_url_lore_07 VARCHAR(255),
    gif_url_lore_08 VARCHAR(255),
    gif_url_lore_09 VARCHAR(255),
    gif_url_lore_10 VARCHAR(255)
) ENGINE=InnoDB;

-- =========================
-- TABLE : bosses
-- =========================
CREATE TABLE bosses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_id INT NOT NULL,
    template_id INT NOT NULL,
    hp INT NOT NULL,
    attack INT NOT NULL,
    defense INT NOT NULL,
    last_reset DATETIME,

    CONSTRAINT fk_boss_server
        FOREIGN KEY (server_id) REFERENCES servers(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_boss_template
        FOREIGN KEY (template_id) REFERENCES boss_templates(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;
