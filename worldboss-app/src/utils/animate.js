'use strict';

const { EmbedBuilder } = require('discord.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Animate a lore description sentence by sentence.
 * @param {Function} editFn     - async (payload) => void
 * @param {string}   title
 * @param {string}   description
 * @param {number}   [color]
 */
async function animateLore(editFn, title, description, color = 0x8e44ad) {
  const parts = description
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    await editFn({
      embeds: [new EmbedBuilder().setTitle(title).setDescription(`*${description}*`).setColor(color)],
      components: [],
    });
    return;
  }

  let revealed = '';
  for (let i = 0; i < parts.length; i++) {
    revealed += (i > 0 ? ' ' : '') + parts[i];
    const isLast = i === parts.length - 1;
    await editFn({
      embeds: [new EmbedBuilder()
        .setTitle(title)
        .setDescription(`*${revealed}${isLast ? '' : ' ▌'}*`)
        .setColor(color)],
      components: [],
    });
    if (!isLast) await sleep(700);
  }
}

/**
 * Animate combat log lines one by one.
 * For each line, HP bars animate block by block from prevHp to currHp.
 *
 * @param {Function} editFn           - async (payload) => void
 * @param {object}   state            - PRE-turn state
 * @param {string[]} newLogs          - new log lines for this turn
 * @param {Array}    frames           - HP snapshots, one per log line
 * @param {Function} embedBuilder     - (state) => EmbedBuilder
 * @param {Array}    finalComponents  - Discord ActionRows shown on the very last frame
 */
async function animateCombatLogs(editFn, state, newLogs, frames, embedBuilder, finalComponents) {
  if (newLogs.length === 0) {
    await editFn({ embeds: [embedBuilder(state)], components: finalComponents });
    return;
  }

  let prevHps = {
    playerHp:  state.player?.hp,
    playersHp: state.players?.map((p) => p.hp),
    enemiesHp: (state.enemies ?? []).map((e) => e.hp),
    alliesHp:  (state.allies  ?? []).map((a) => a.hp),
  };

  for (let i = 0; i < newLogs.length; i++) {
    const isLastLog = i === newLogs.length - 1;
    const curr      = frames[i] ?? prevHps;

    const hpDeltas = {};
    if (curr.playerHp  !== undefined) hpDeltas.player  = curr.playerHp  - (prevHps.playerHp  ?? curr.playerHp);
    if (curr.playersHp)               hpDeltas.players = curr.playersHp.map((hp, pi) => hp - (prevHps.playersHp?.[pi] ?? hp));
    if (curr.enemiesHp)               hpDeltas.enemies = curr.enemiesHp.map((hp, ei) => hp - (prevHps.enemiesHp[ei]  ?? hp));
    if (curr.alliesHp)                hpDeltas.allies  = curr.alliesHp.map( (hp, ai) => hp - (prevHps.alliesHp?.[ai] ?? hp));

    const hasHpChange = (hpDeltas.player ?? 0) !== 0
      || (hpDeltas.players ?? []).some((d) => d !== 0)
      || (hpDeltas.enemies ?? []).some((d) => d !== 0)
      || (hpDeltas.allies  ?? []).some((d) => d !== 0);

    // ── Frame A : log line apparaît, barre à l'état AVANT ────────────────────
    const frameA = { ...state, log: newLogs, activeLogIndex: i, hpDeltas: {} };
    if (curr.playerHp  !== undefined && state.player)  frameA.player  = { ...state.player,  hp: prevHps.playerHp  ?? state.player.hp };
    if (curr.playersHp && state.players)                frameA.players = state.players.map((p, pi) => ({ ...p, hp: prevHps.playersHp?.[pi]  ?? p.hp }));
    if (curr.enemiesHp && state.enemies)                frameA.enemies = state.enemies.map((e, ei) => ({ ...e, hp: prevHps.enemiesHp?.[ei]  ?? e.hp }));
    if (curr.alliesHp  && state.allies)                 frameA.allies  = state.allies.map( (a, ai) => ({ ...a, hp: prevHps.alliesHp?.[ai]   ?? a.hp }));
    await editFn({ embeds: [embedBuilder(frameA)], components: [] });

    if (hasHpChange) {
      await sleep(400);

      // ── Frame B : barre à l'état APRÈS, delta coloré ─────────────────────
      const frameB = { ...state, log: newLogs, activeLogIndex: i, hpDeltas };
      if (curr.playerHp  !== undefined && state.player)  frameB.player  = { ...state.player,  hp: curr.playerHp };
      if (curr.playersHp && state.players)                frameB.players = state.players.map((p, pi) => ({ ...p, hp: curr.playersHp[pi] ?? p.hp }));
      if (curr.enemiesHp && state.enemies)                frameB.enemies = state.enemies.map((e, ei) => ({ ...e, hp: curr.enemiesHp[ei]  ?? e.hp }));
      if (curr.alliesHp  && state.allies)                 frameB.allies  = state.allies.map( (a, ai) => ({ ...a, hp: curr.alliesHp[ai]   ?? a.hp }));
      await editFn({ embeds: [embedBuilder(frameB)], components: isLastLog ? finalComponents : [] });
    }

    if (!isLastLog) await sleep(hasHpChange ? 300 : 700);
    else if (!hasHpChange) await editFn({ embeds: [embedBuilder(frameA)], components: finalComponents });
    prevHps = curr;
  }
}

/**
 * Animate an XP bar filling up after a victory.
 *
 * @param {Function} editFn          - async (payload) => void
 * @param {Function} buildEmbed      - (xpBarLine: string) => EmbedBuilder
 * @param {number}   startXp         - XP before the gain
 * @param {number}   startLevel      - level before the gain
 * @param {object}   xpResult        - { newXp, newLevel, leveledUp }
 * @param {Function} xpRequiredFn    - (level) => number
 * @param {Array}    [finalComponents] - Discord ActionRows shown on the last frame
 */
async function animateXpGain(editFn, buildEmbed, startXp, startLevel, xpResult, xpRequiredFn, finalComponents = []) {
  const { newXp, newLevel, leveledUp } = xpResult;
  const displayLevel = leveledUp ? newLevel : startLevel;
  const xpReq    = xpRequiredFn(displayLevel);
  const fromXp   = leveledUp ? 0 : startXp;

  const makeBar = (xp) => {
    const filled = Math.round((Math.min(xp, xpReq) / xpReq) * 12);
    return `${'▰'.repeat(filled)}${'▱'.repeat(12 - filled)} ${xp}/${xpReq} XP`;
  };

  await editFn({ embeds: [buildEmbed(makeBar(fromXp))], components: [] });
  await sleep(600);
  await editFn({ embeds: [buildEmbed(makeBar(newXp))], components: finalComponents });
}

module.exports = { sleep, animateLore, animateCombatLogs, animateXpGain };
