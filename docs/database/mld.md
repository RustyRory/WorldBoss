# 🧩 MLD — Projet WorldBoss

---

### **SERVERS**

SERVERS (id, discord_id, name, owner_id, level, prestige, gold_reserve, created_at,
category_id, combat_channel_id, combat_message_id,
merchant_channel_id, merchant_message_id, event_id, general_channel_id)

---

### **PLAYERS**

PLAYERS (id, discord_id, name, level, exp, hp, hp_max, attack, attack_max,
defense, defense_max, crit_rate, crit_rate_max, gold,
actions_points, skills_points, alive,
[server_id])

---

### **INVENTORIES**

INVENTORIES (id, [player_id])

---

### **ITEMS**

ITEMS (id, name, category, description, hp_bonus, attack_bonus, defense_bonus,
price, sell_price)

---

### **ITEM_INSTANCES**

ITEM_INSTANCES (id, equipped, [item_id], [inventory_id])

---

### **MERCHANTS**

MERCHANTS (id, gold, last_refresh, [server_id])

---

### **MERCHANT_ITEMS**

MERCHANT_ITEMS (id, [merchant_id], [item_id])

---

### **BOSS_TEMPLATES**

BOSS_TEMPLATES (id, name, level, base_hp, base_attack, base_defense, lore,
gif_url,
gif_url_lore_01, gif_url_lore_02, gif_url_lore_03, gif_url_lore_04,
gif_url_lore_05, gif_url_lore_06, gif_url_lore_07, gif_url_lore_08,
gif_url_lore_09, gif_url_lore_10)

---

### **BOSSES**

BOSSES (id, hp, attack, defense, last_reset,
[server_id], [template_id])

---
