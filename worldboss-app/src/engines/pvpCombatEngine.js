'use strict';

const { PASSIVES } = require('../data/passives');
const { SKILLS } = require('../data/skills');
const { COMBAT_CONFIG } = require('../data/combat');
const { playerAttack: baseAttack } = require('./combatEngine');

/**
 * PvP arena engine — same turn-by-turn model as combatEngine.js (Pokémon/Final Fantasy
 * style: pick an action, resolve, repeat), but for two independent human players instead
 * of a player vs scripted enemies. No items/flee in arena for now (kept out of scope —
 * pure 1v1 attack/skill duel), and every hit is scaled by COMBAT_CONFIG.PVP_DAMAGE_MULT.
 */

function rollInitiative(spd) {
  return spd + Math.random() * spd * COMBAT_CONFIG.INITIATIVE_RNG_VARIANCE;
}

// Wraps combatEngine's playerAttack so every arena hit (basic or via a skill's
// ctx.playerAttack call) gets the PvP damage multiplier, without touching combatEngine.js.
function pvpAttack(actor, target, skillMult = 1.0) {
  return baseAttack(actor, target, skillMult * COMBAT_CONFIG.PVP_DAMAGE_MULT);
}

function decayStatus(c, logs) {
  if (c.dots?.length) {
    c.dots = c.dots.map((dot) => {
      c.hp = Math.max(0, c.hp - dot.value);
      logs.push(`☠️ **${c.name}** perd **${dot.value}** dégâts (${dot.label ?? 'Poison'}).`);
      return { ...dot, turns: dot.turns - 1 };
    }).filter((d) => d.turns > 0);
  }
  if (c.buffs?.length) {
    c.buffs = c.buffs.map((b) => ({ ...b, turns: b.turns - 1 })).filter((b) => {
      if (b.turns <= 0) {
        c[b.stat] -= b.value;
        logs.push(`🔻 **${c.name}** : buff **${b.stat}** expiré.`);
        return false;
      }
      return true;
    });
  }
  for (const key of Object.keys(c.skillCooldowns ?? {})) {
    if (c.skillCooldowns[key] > 0) c.skillCooldowns[key] -= 1;
  }
}

function executeAction(actor, target, action, logs) {
  if (target.hp <= 0 || actor.hp <= 0) return;

  if (!action || action === 'attack') {
    const result = pvpAttack(actor, target, 1.0);
    target.hp = Math.max(0, target.hp - result.damage);
    logs.push(`⚔️ **${actor.name}** : ${result.log}`);
    if (target.hp <= 0) {
      target.hp = 0;
      logs.push(`☠️ **${target.name}** est vaincu !`);
    }
    for (const passiveKey of actor.activePassives ?? []) {
      const passive = PASSIVES[passiveKey];
      if (passive && target.hp > 0) passive.resolve(actor, target, logs);
    }
    return;
  }

  if (action.startsWith('skill_')) {
    const skillKey  = action.slice(6);
    const skillMeta = (actor.activeSkills ?? []).find((s) => s.key === skillKey);
    if (!skillMeta) { logs.push(`**${actor.name}** : compétence introuvable !`); return; }

    const skillDef = SKILLS[skillKey];
    if (!skillDef?.resolve) { logs.push(`**${actor.name}** : compétence non définie !`); return; }

    const cd = actor.skillCooldowns[skillKey] ?? 0;
    if (cd > 0) { logs.push(`**${skillMeta.name}** en recharge encore **${cd}** tour(s) !`); return; }
    if (skillMeta.oncePerCombat && actor.usedOnceSkills.includes(skillKey)) {
      logs.push(`**${skillMeta.name}** déjà utilisé ce combat !`);
      return;
    }

    skillDef.resolve(actor, target, logs, { playerAttack: pvpAttack });

    if (skillMeta.oncePerCombat) actor.usedOnceSkills.push(skillKey);
    else actor.skillCooldowns[skillKey] = skillMeta.cooldown ?? 0;
  }
}

/**
 * Resolve one round of a 1v1 arena match.
 * @param {object} state - { playerA, playerB, pendingActions: { A: action, B: action } }
 */
function resolveArenaRound(state) {
  const playerA = { ...state.playerA, buffs: [...(state.playerA.buffs ?? [])], dots: [...(state.playerA.dots ?? [])], skillCooldowns: { ...(state.playerA.skillCooldowns ?? {}) }, usedOnceSkills: [...(state.playerA.usedOnceSkills ?? [])] };
  const playerB = { ...state.playerB, buffs: [...(state.playerB.buffs ?? [])], dots: [...(state.playerB.dots ?? [])], skillCooldowns: { ...(state.playerB.skillCooldowns ?? {}) }, usedOnceSkills: [...(state.playerB.usedOnceSkills ?? [])] };

  const logs = [];

  decayStatus(playerA, logs);
  decayStatus(playerB, logs);

  const aFirst = rollInitiative(playerA.spd) >= rollInitiative(playerB.spd);
  const order  = aFirst ? [['A', playerA, playerB], ['B', playerB, playerA]] : [['B', playerB, playerA], ['A', playerA, playerB]];
  logs.push(`⚡ **${aFirst ? playerA.name : playerB.name}** agit en premier ce tour (VIT ${Math.round(playerA.spd)} vs ${Math.round(playerB.spd)}).`);

  for (const [side, actor, target] of order) {
    executeAction(actor, target, state.pendingActions[side], logs);
  }

  const aDied = playerA.hp <= 0;
  const bDied = playerB.hp <= 0;
  if (aDied) playerA.hp = 0;
  if (bDied) playerB.hp = 0;

  return { playerA, playerB, logs, finished: aDied || bDied, aDied, bDied };
}

function cloneCombatant(c) {
  return { ...c, buffs: [...(c.buffs ?? [])], dots: [...(c.dots ?? [])], skillCooldowns: { ...(c.skillCooldowns ?? {}) }, usedOnceSkills: [...(c.usedOnceSkills ?? [])] };
}

/**
 * Resolve one round of a 4v4 team arena match (Phase 2 — cross-server).
 * @param {object} state - { teamA, teamB, pendingActions: { [characterId]: { action, targetIndex } } }
 *   pendingActions.targetIndex indexes into the ACTOR's enemy team array.
 */
function resolveTeamRound(state) {
  const teamA = state.teamA.map(cloneCombatant);
  const teamB = state.teamB.map(cloneCombatant);
  const logs = [];

  for (const c of [...teamA, ...teamB]) decayStatus(c, logs);

  const entries = [
    ...teamA.map((c) => ({ c, team: 'A' })),
    ...teamB.map((c) => ({ c, team: 'B' })),
  ].filter((e) => e.c.hp > 0);

  const order = entries
    .map((e) => ({ ...e, roll: rollInitiative(e.c.spd) }))
    .sort((a, b) => b.roll - a.roll);

  for (const entry of order) {
    const actor = entry.c;
    if (actor.hp <= 0) continue;

    const enemyTeam = entry.team === 'A' ? teamB : teamA;
    const pending   = state.pendingActions[actor.characterId] ?? { action: 'attack', targetIndex: 0 };

    let target = enemyTeam[pending.targetIndex];
    if (!target || target.hp <= 0) target = enemyTeam.find((t) => t.hp > 0);
    if (!target) continue; // enemy team already wiped out

    executeAction(actor, target, pending.action, logs);
  }

  const aWiped = teamA.every((c) => c.hp <= 0);
  const bWiped = teamB.every((c) => c.hp <= 0);

  return { teamA, teamB, logs, finished: aWiped || bWiped, aWiped, bWiped };
}

module.exports = { resolveArenaRound, resolveTeamRound };
