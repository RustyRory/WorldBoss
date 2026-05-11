'use strict';

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { ITEMS } = require('../data/items');
const { getCharacterEmoji, RACES, formatRaceBonuses } = require('../data/races');
const { PROGRESSION_CONFIG } = require('../data/progression');

const RARITY_COLOR = {
  common: 0x9e9e9e,
  rare: 0x2196f3,
  epic: 0x9c27b0,
  legendary: 0xff9800,
};

/**
 * ASCII HP bar.
 * @param {number} current
 * @param {number} max
 * @param {number} size - number of blocks
 */
function hpBar(current, max, size = 10) {
  const clamped = Math.max(0, Math.min(current, max));
  const filled = Math.round((clamped / max) * size);
  const empty = size - filled;
  return `${'▰'.repeat(filled)}${'▱'.repeat(empty)} ${clamped}/${max} HP`;
}

/**
 * HP bar with ANSI color for use inside ```ansi``` blocks.
 * delta < 0 → red, delta > 0 → green, 0 → no color.
 */
function hpBarAnsi(current, max, delta, size = 10) {
  const clamped     = Math.max(0, Math.min(current, max));
  const prevClamped = Math.max(0, Math.min(current - delta, max));
  const currFilled  = Math.round((clamped / max) * size);
  const prevFilled  = Math.round((prevClamped / max) * size);
  const suffix      = ` ${clamped}/${max} HP`;

  if (delta < 0) {
    // blocs qui viennent d'être perdus → rouge
    const kept  = '▰'.repeat(currFilled);
    const lost  = `\x1b[1;31m${'▱'.repeat(Math.max(0, prevFilled - currFilled))}\x1b[0m`;
    const empty = '▱'.repeat(Math.max(0, size - prevFilled));
    return `${kept}${lost}${empty}${suffix}`;
  }
  if (delta > 0) {
    // blocs qui viennent d'être gagnés → vert
    const kept   = '▰'.repeat(prevFilled);
    const gained = `\x1b[1;32m${'▰'.repeat(Math.max(0, currFilled - prevFilled))}\x1b[0m`;
    const empty  = '▱'.repeat(Math.max(0, size - currFilled));
    return `${kept}${gained}${empty}${suffix}`;
  }
  return `${'▰'.repeat(currFilled)}${'▱'.repeat(size - currFilled)}${suffix}`;
}

function buildCombatEmbed(state) {
  const { player, enemies, log, turn } = state;
  const deltas = state.hpDeltas ?? {};

  const ansi = [];

  // ── Player ────────────────────────────────────────────────────────────────
  ansi.push(`\x1b[1m${player.emoji ?? '🧑'} Vous\x1b[0m — Tour ${turn}`);
  ansi.push(hpBarAnsi(player.hp, player.maxHp, deltas.player ?? 0));

  const playerStatus = [];
  for (const dot of (player.dots ?? [])) playerStatus.push(`☠️ ${dot.label ?? 'DoT'} (${dot.turns}t)`);
  for (const buf of (player.buffs ?? [])) playerStatus.push(`⚡ ${buf.stat.toUpperCase()}+${buf.value} (${buf.turns}t)`);
  if (playerStatus.length > 0) ansi.push(playerStatus.join(' · '));

  const cdLines = Object.entries(player.skillCooldowns ?? {})
    .filter(([, cd]) => cd > 0)
    .map(([key, cd]) => {
      const sk = (player.activeSkills ?? []).find((s) => s.key === key);
      return `⏳ ${sk?.name ?? key} (${cd}t)`;
    });
  if (cdLines.length > 0) ansi.push(cdLines.join(' · '));

  // ── Allies ───────────────────────────────────────────────────────────────
  for (const [ai, ally] of (state.allies ?? []).entries()) {
    ansi.push('');
    if (ally.hp <= 0) {
      ansi.push(`\x1b[2m${ally.emoji ?? '🧑‍💼'} ${ally.name} — K.O.\x1b[0m`);
    } else {
      ansi.push(`\x1b[1m${ally.emoji ?? '🧑‍💼'} ${ally.name}\x1b[0m`);
      ansi.push(hpBarAnsi(ally.hp, ally.maxHp, deltas.allies?.[ai] ?? 0));
    }
  }

  ansi.push('');

  // ── Enemies ───────────────────────────────────────────────────────────────
  for (const [ei, enemy] of enemies.entries()) {
    if (enemy.hp <= 0) {
      ansi.push(`\x1b[2m☠️ ${enemy.name} — Vaincu\x1b[0m`);
    } else {
      ansi.push(`\x1b[1m${enemy.emoji ?? '👾'} ${enemy.name}\x1b[0m`);
      ansi.push(hpBarAnsi(enemy.hp, enemy.maxHp, deltas.enemies?.[ei] ?? 0));
      const enemyStatus = [];
      if (enemy.stunned) enemyStatus.push('💫 Étourdi');
      for (const dot of (enemy.dots ?? [])) enemyStatus.push(`🔥 ${dot.label ?? 'DoT'} (${dot.turns}t)`);
      if (enemyStatus.length > 0) ansi.push(enemyStatus.join(' · '));
    }
  }

  // ── Journal ───────────────────────────────────────────────────────────────
  const activeIdx = state.activeLogIndex ?? -1;
  const allLogs   = (log || []);
  if (allLogs.length > 0) {
    ansi.push('');
    ansi.push('\x1b[1m📜 Journal\x1b[0m');
    const mdBold = (s) => s.replace(/\*\*(.+?)\*\*/g, '\x1b[1m$1\x1b[0m\x1b[2m');
    const lastLogs = allLogs.slice(-PROGRESSION_CONFIG.LOG_DISPLAY_COUNT);
    const offset   = allLogs.length - lastLogs.length;
    for (let li = 0; li < lastLogs.length; li++) {
      const globalIdx = offset + li;
      if (globalIdx === activeIdx) {
        const line = lastLogs[li].replace(/\*\*(.+?)\*\*/g, '\x1b[1;33m$1\x1b[0m\x1b[33m');
        ansi.push(`\x1b[33m▶ ${line}\x1b[0m`);
      } else {
        ansi.push(`\x1b[2m${mdBold(lastLogs[li])}\x1b[0m`);
      }
    }
  }

  const lines = ['```ansi', ...ansi, '```'];

  const footerParts = [];
  if (state.currentRoom && state.totalRooms) footerParts.push(`Salle ${state.currentRoom}/${state.totalRooms}`);

  const embed = new EmbedBuilder()
    .setColor(player.hp / player.maxHp < PROGRESSION_CONFIG.HP_WARNING_THRESHOLD ? 0xe74c3c : 0x8e44ad)
    .setDescription(lines.join('\n'));

  if (footerParts.length > 0) embed.setFooter({ text: footerParts.join(' · ') });

  return embed;
}

function buildConsumableRow(player) {
  const available = (player.consumables ?? []).filter((c) => {
    const def = ITEMS[c.itemId];
    if (!def?.effect) return false;
    if (def.effect.type === 'restore_ap') return false;
    return c.quantity > 0 || c.quantity === -1;
  });
  if (!available.length) return null;
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('combat_consumable')
      .setPlaceholder('🎒 Utiliser un consommable…')
      .addOptions(available.map((c) => {
        const def = ITEMS[c.itemId];
        const qty = c.quantity === -1 ? '∞' : `×${c.quantity}`;
        return { label: `${def.name} (${qty})`, value: c.itemId };
      })),
  );
}

/**
 * Phase 1 — action select + consumable select + flee button (always ≤ 3 rows).
 */
function buildCombatRow(state) {
  const { player } = state;
  const skills    = player.activeSkills  ?? [];
  const cooldowns = player.skillCooldowns ?? {};
  const usedOnce  = player.usedOnceSkills ?? [];

  const actionRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('combat_action_select')
      .setPlaceholder('⚔️ Choisir une action…')
      .addOptions([
        { label: 'Attaquer', value: 'attack', emoji: '⚔️' },
        ...skills
          .filter((sk) => {
            const cd = cooldowns[sk.key] ?? 0;
            return cd <= 0 && !(sk.oncePerCombat && usedOnce.includes(sk.key));
          })
          .map((sk) => ({
            label: sk.name,
            value: `skill_${sk.key}`,
            emoji: '🔥',
          })),
        { label: 'Fuir', value: 'flee', emoji: '🏃', description: 'Quitter le combat' },
      ]),
  );

  const consumableRow = buildConsumableRow(player);
  const rows = [actionRow];
  if (consumableRow) rows.push(consumableRow);
  return rows;
}

/**
 * Phase 2 (multi-ennemis) — boutons de cible + consumable + retour (toujours ≤ 3 rows).
 * action : 'attack' | 'skill_<key>'
 */
function buildTargetRow(action, state) {
  const { player, enemies } = state;
  const aliveEnemies = enemies.filter((e) => e.hp > 0);

  const targetRow = new ActionRowBuilder().addComponents(
    ...aliveEnemies.map((e) => {
      const idx = enemies.indexOf(e);
      return new ButtonBuilder()
        .setCustomId(`combat_${action}:${idx}`)
        .setLabel(e.name)
        .setEmoji('🎯')
        .setStyle(ButtonStyle.Primary);
    }),
    new ButtonBuilder()
      .setCustomId('combat_action_back')
      .setLabel('Retour')
      .setEmoji('↩️')
      .setStyle(ButtonStyle.Secondary),
  );

  const consumableRow = buildConsumableRow(player);
  const rows = [targetRow];
  if (consumableRow) rows.push(consumableRow);
  return rows;
}

/**
 * Build the "next room" button row used between dungeon rooms.
 */
function buildDungeonNextRow(label = 'Salle suivante ➡️') {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('dungeon_next')
      .setLabel(label)
      .setStyle(ButtonStyle.Success),
  );
}

/**
 * Build loot selection embed + buttons after combat victory.
 */
function buildLootEmbed(lootOptions) {

  const desc = lootOptions
    .map((id, i) => {
      const item = ITEMS[id];
      if (!item) return `${i + 1}. Item inconnu`;
      const emoji = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠' }[item.rarity] ?? '⚪';
      return `**${i + 1}.** ${emoji} **${item.name}** (${item.rarity})`;
    })
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🎁 Butin — Choisissez un item')
    .setDescription(desc)
    .setColor(0xf39c12);

  const row = new ActionRowBuilder().addComponents(
    ...lootOptions.map((_, i) =>
      new ButtonBuilder()
        .setCustomId(`loot_${i}`)
        .setLabel(`Choix ${i + 1}`)
        .setStyle(ButtonStyle.Primary),
    ),
  );

  return { embed, row };
}

/**
 * XP progress bar.
 */
function xpBar(current, required, size = PROGRESSION_CONFIG.XP_BAR_SIZE) {
  const filled = Math.round((current / required) * size);
  const empty = size - filled;
  return `${'▰'.repeat(filled)}${'▱'.repeat(empty)} ${current}/${required}`;
}

const SEP = '┄'.repeat(32);

/**
 * Build sell-choice buttons (marchant / enchère) for an item.
 */
function buildSellChoiceRow(itemId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`market_merchant:${itemId}`)
      .setLabel('Vendre au marchant')
      .setEmoji('🏪')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`market_auction_start:${itemId}`)
      .setLabel('Mettre aux enchères')
      .setEmoji('🔨')
      .setStyle(ButtonStyle.Primary),
  );
}

/**
 * Profile embed.
 */
function buildProfileEmbed(user, stats, loadout, xpReq, interaction = null, ap = null) {

  const SLOTS = [
    { field: 'weaponId',     icon: '⚔️',  label: 'Arme'        },
    { field: 'armorId',      icon: '🧥',  label: 'Armure'      },
    { field: 'helmetId',     icon: '🪖',  label: 'Casque'      },
    { field: 'bootsId',      icon: '👢',  label: 'Bottes'      },
    { field: 'accessory1Id', icon: '💍',  label: 'Accessoire 1' },
    { field: 'accessory2Id', icon: '💍',  label: 'Accessoire 2' },
  ];

  const equippedLines = SLOTS.map(({ field, icon, label }) => {
    const item = loadout?.[field] ? ITEMS[loadout[field]] : null;
    const rarityEmoji = item ? ({ common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠' }[item.rarity] ?? '⚪') : null;
    return item
      ? `> ${icon} **${label}** · ${rarityEmoji} ${item.name}`
      : `> ${icon} **${label}** · *—*`;
  });

  const hpPct  = Math.round((user.hp / stats.hp) * 100);
  const hpIcon = hpPct > 50 ? '🟩' : hpPct > 25 ? '🟨' : '🟥';

  const displayName = user.name || user.user?.username || 'Aventurier';

  const isMaxLevel   = user.level >= 50;
  const rank         = user.rank ?? 0;
  const race         = user.race ?? 'humain';
  const gender       = user.gender ?? 'male';
  const charEmoji    = getCharacterEmoji(race, gender);
  const raceLabel    = RACES[race]?.label ?? 'Humain';
  const genderLabel  = gender === 'female' ? 'Féminin' : 'Masculin';

  const embed = new EmbedBuilder()
    .setTitle(`📋  Profil — ${charEmoji} ${displayName}`)
    .setDescription(
      isMaxLevel
        ? `> Aventurier au niveau maximum — ⚜️ Rang **${rank}** !\n\`${SEP}\``
        : `> Aventurier de niveau **${user.level}**, continuez à explorer les donjons !\n\`${SEP}\``,
    )
    .setColor(isMaxLevel ? 0xf39c12 : 0x3498db)
    .setThumbnail(interaction?.user?.displayAvatarURL({ size: 128 }) ?? null)
    .addFields(
      // ── Progression ───────────────────────────────────────────────
      {
        name: '🏅 Progression',
        value: [
          isMaxLevel
            ? `> Niveau  **${user.level}** *(max)* · ⚜️ Rang **${rank}**`
            : `> Niveau  **${user.level}**`,
          `> XP      \`${xpBar(user.xp, xpReq)}\``,
          `> Or      **${user.gold}** 🪙`,
          ap != null
            ? `> PA      **${ap.current}** / ${ap.max} ⚡`
            : '',
          `> Race    ${charEmoji} **${raceLabel}** · \`${formatRaceBonuses(race, gender)}\``,
          `> Genre   **${genderLabel}**`,
        ].filter(Boolean).join('\n'),
        inline: true,
      },
      // ── Statistiques ──────────────────────────────────────────────
      {
        name: '📊 Statistiques',
        value: [
          `> ${hpIcon} HP   **${user.hp}** / ${stats.hp}`,
          `> ⚔️  ATK  **${stats.atk}**`,
          `> 🛡️  DEF  **${stats.def}**`,
          `> 💨  SPD  **${stats.spd}**`,
          `> 🎯  CRIT **${stats.crit}%**`,
        ].join('\n'),
        inline: true,
      },
      // ── Séparateur ────────────────────────────────────────────────
      {
        name: '​',
        value: `\`${SEP}\``,
        inline: false,
      },
      // ── Équipement ────────────────────────────────────────────────
      {
        name: '🛡️ Équipement',
        value: equippedLines.join('\n'),
        inline: false,
      },
    )
    .setFooter({ text: 'WorldBoss  •  /inventory pour gérer ton équipement' })
    .setTimestamp();

  return embed;
}

/**
 * Inventory embed + action rows (équiper / déséquiper).
 * Retourne { embed, rows }
 */
function buildInventoryMessage(user, userItems, loadout, ap = null) {

  const RARITY_EMOJI = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟠' };
  const RARITY_LABEL = { common: 'Commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' };
  const TYPE_ICON    = { weapon: '⚔️', armor: '🧥', helmet: '🪖', boots: '👢', accessory: '💍', consumable: '🧪' };
  const TYPE_LABEL   = { weapon: 'Armes', armor: 'Armures', helmet: 'Casques', boots: 'Bottes', accessory: 'Accessoires', consumable: 'Consommables' };

  const equippedList = [
    loadout?.weaponId, loadout?.armorId, loadout?.helmetId,
    loadout?.bootsId, loadout?.accessory1Id, loadout?.accessory2Id,
  ].filter(Boolean);

  const groups = {};
  for (const ui of userItems) {
    const item = ITEMS[ui.itemId];
    if (!item) continue;
    if (!groups[item.type]) groups[item.type] = [];
    const rarity        = RARITY_EMOJI[item.rarity] ?? '⚪';
    const qty           = ui.quantity > 1 ? ` ×${ui.quantity}` : '';
    const statsStr      = item.stats
      ? Object.entries(item.stats).map(([k, v]) => `\`${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}\``).join(' ')
      : '';
    const equippedCount = equippedList.filter((id) => id === ui.itemId).length;
    const equipped      = equippedCount > 0
      ? ` · ✅ **équipé${equippedCount > 1 ? ` ×${equippedCount}` : ''}**`
      : '';
    groups[item.type].push(
      `> ${rarity} **${item.name}**${qty}${statsStr ? ` · ${statsStr}` : ''}${equipped}`,
    );
  }

  const TYPE_ORDER = ['weapon', 'armor', 'helmet', 'boots', 'accessory', 'consumable'];

  const fields = [];
  const orderedTypes = TYPE_ORDER.filter((t) => groups[t]);

  if (orderedTypes.length === 0) {
    // inventaire vide — géré via description
  } else {
    for (let i = 0; i < orderedTypes.length; i++) {
      const type = orderedTypes[i];
      fields.push({
        name: `${TYPE_ICON[type] ?? '📦'} ${TYPE_LABEL[type] ?? type}`,
        value: groups[type].join('\n'),
        inline: false,
      });
      // séparateur entre sections sauf après la dernière
      if (i < orderedTypes.length - 1) {
        fields.push({ name: '​', value: `\`${SEP}\``, inline: false });
      }
    }
  }

  const totalItems = userItems.reduce((acc, ui) => acc + ui.quantity, 0);

  const embed = new EmbedBuilder()
    .setTitle(`🎒  Inventaire — ${user.username}`)
    .setDescription(
      `> **${totalItems}** objet${totalItems > 1 ? 's' : ''} · Or **${user.gold}** 🪙` +
      (ap != null ? ` · PA **${ap.current}** / ${ap.max} ⚡` : '') + '\n' +
      `\`${SEP}\``,
    )
    .setColor(0x27ae60)
    .setTimestamp()
    .setFooter({ text: 'WorldBoss  •  Utilise le menu ci-dessous pour équiper un item' });

  if (fields.length) {
    embed.addFields(fields);
  } else {
    embed.setDescription(
      '> Ton inventaire est vide.\n' +
      '> Bats des ennemis pour obtenir du butin !\n' +
      `\`${SEP}\``,
    );
  }

  // ── Select menu équiper ────────────────────────────────────────────────────
  const equipable = userItems.filter((ui) => {
    const item = ITEMS[ui.itemId];
    if (!item || item.type === 'consumable') return false;
    const ec = equippedList.filter((id) => id === ui.itemId).length;
    return ui.quantity - ec >= 1;
  });

  const rows = [];

  if (equipable.length > 0) {
    const { StringSelectMenuBuilder } = require('discord.js');

    const equipOptions = equipable.map((ui) => {
      const item     = ITEMS[ui.itemId];
      const rarity   = RARITY_EMOJI[item.rarity] ?? '⚪';
      const statsStr = item.stats
        ? Object.entries(item.stats).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`).join(', ')
        : '';
      return {
        label:       `${rarity} ${item.name}`.slice(0, 100),
        description: `${TYPE_LABEL[item.type] ?? item.type} · ${RARITY_LABEL[item.rarity] ?? item.rarity}${statsStr ? ` · ${statsStr}` : ''}`.slice(0, 100),
        value:       `equip:${ui.itemId}`,
      };
    });

    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('inventory_action')
          .setPlaceholder('⚔️  Sélectionne un item à équiper…')
          .addOptions(equipOptions.slice(0, 25)),
      ),
    );
  }

  // ── Select menu utiliser (consommables hors combat) ──────────────────────
  const usable = userItems.filter((ui) => {
    const item = ITEMS[ui.itemId];
    return item && item.type === 'consumable' && item.usableOutOfCombat && ui.quantity > 0;
  });

  if (usable.length > 0) {
    const { StringSelectMenuBuilder } = require('discord.js');
    const useOptions = usable.map((ui) => {
      const item  = ITEMS[ui.itemId];
      const rarity = RARITY_EMOJI[item.rarity] ?? '⚪';
      const qty   = ui.quantity > 1 ? ` ×${ui.quantity}` : '';
      const effectLabel = {
        heal:       `Restaure ${item.effect?.value ?? '?'} HP`,
        restore_ap: `Restaure ${item.effect?.value ?? '?'} PA`,
      }[item.effect?.type] ?? item.effect?.type ?? '';
      return {
        label:       `${rarity} ${item.name}${qty}`.slice(0, 100),
        description: effectLabel.slice(0, 100),
        value:       `use:${ui.itemId}`,
      };
    });
    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('inventory_use')
          .setPlaceholder('🧪  Utiliser un consommable…')
          .addOptions(useOptions.slice(0, 25)),
      ),
    );
  }

  // ── Select menu vendre ────────────────────────────────────────────────────
  const sellable = userItems.filter((ui) => {
    const item = ITEMS[ui.itemId];
    if (!item) return false;
    const equippedCount = equippedList.filter((id) => id === ui.itemId).length;
    return ui.quantity - equippedCount >= 1;
  });

  if (sellable.length > 0) {
    const { StringSelectMenuBuilder } = require('discord.js');

    const sellOptions = sellable.map((ui) => {
      const item         = ITEMS[ui.itemId];
      const rarity       = RARITY_EMOJI[item.rarity] ?? '⚪';
      const sellPrice    = Math.max(1, Math.floor(item.price * 0.1));
      const equippedCount = equippedList.filter((id) => id === ui.itemId).length;
      const sellableQty  = ui.quantity - equippedCount;
      const qty          = sellableQty > 1 ? ` ×${sellableQty}` : '';
      return {
        label:       `${rarity} ${item.name}${qty}`.slice(0, 100),
        description: `Marchant: ${sellPrice} 🪙 · Enchère possible · 1 PA requis`.slice(0, 100),
        value:       `sell_choice:${ui.itemId}`,
      };
    });

    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('inventory_sell_choice')
          .setPlaceholder('🪙  Sélectionne un item à vendre…')
          .addOptions(sellOptions.slice(0, 25)),
      ),
    );
  }

  // ── Boutons déséquiper ─────────────────────────────────────────────────────
  const occupiedSlots = [
    { field: 'weaponId',     label: 'Arme',          slot: 'weapon'     },
    { field: 'armorId',      label: 'Armure',         slot: 'armor'      },
    { field: 'helmetId',     label: 'Casque',         slot: 'helmet'     },
    { field: 'bootsId',      label: 'Bottes',         slot: 'boots'      },
    { field: 'accessory1Id', label: 'Accessoire 1',   slot: 'accessory1' },
    { field: 'accessory2Id', label: 'Accessoire 2',   slot: 'accessory2' },
  ].filter((s) => loadout?.[s.field]);

  if (occupiedSlots.length > 0) {
    const unequipButtons = occupiedSlots.map((s) =>
      new ButtonBuilder()
        .setCustomId(`unequip:${s.slot}`)
        .setLabel(`↩ ${s.label}`)
        .setStyle(ButtonStyle.Secondary),
    );
    for (let i = 0; i < unequipButtons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(unequipButtons.slice(i, i + 5)));
    }
  }

  return { embed, rows };
}

/** @deprecated Utiliser buildInventoryMessage */
function buildInventoryEmbed(user, userItems, loadout) {
  return buildInventoryMessage(user, userItems, loadout).embed;
}

/**
 * Generic error embed.
 */
function errorEmbed(message) {
  return new EmbedBuilder().setColor(0xe74c3c).setDescription(`❌ ${message}`);
}

/**
 * Generic success embed.
 */
function successEmbed(message) {
  return new EmbedBuilder().setColor(0x2ecc71).setDescription(`✅ ${message}`);
}

module.exports = {
  hpBar,
  hpBarAnsi,
  buildCombatEmbed,
  buildCombatRow,
  buildTargetRow,
  buildDungeonNextRow,
  buildLootEmbed,
  buildProfileEmbed,
  buildInventoryMessage,
  buildInventoryEmbed,
  buildSellChoiceRow,
  errorEmbed,
  successEmbed,
  RARITY_COLOR,
};
