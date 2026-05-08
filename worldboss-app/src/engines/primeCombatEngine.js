'use strict';

const { playerAttack, rawDamage } = require('./combatEngine');
const { ABILITIES } = require('../data/abilities');
const { PASSIVES }  = require('../data/passives');
const { ITEMS }     = require('../data/items');

/**
 * Resolve one full round of prime combat.
 * All player actions execute first (by SPD desc), then all enemy actions.
 *
 * @param {object} primeState - full prime combat state from Redis
 * @returns {{ players, enemies, logs, allEnemiesDead, allPlayersDead }}
 */
class CombatLog extends Array {
  constructor(snap) {
    super();
    this._snap = snap;
    this.initialSnapshot = snap();
    this.frames = [];
  }
  push(...items) {
    const r = super.push(...items);
    this.frames.push(this._snap());
    return r;
  }
}

function resolvePrimeRound(primeState) {
  // Deep-clone mutable arrays to avoid mutating the original state
  const players = primeState.players.map((p) => ({
    ...p,
    buffs:          [...(p.buffs          ?? [])],
    dots:           [...(p.dots           ?? [])],
    consumables:    (p.consumables ?? []).map((c) => ({ ...c })),
    activeSkills:   (p.activeSkills  ?? []).map((s) => ({ ...s })),
    activePassives: [...(p.activePassives ?? [])],
    skillCooldowns: { ...(p.skillCooldowns ?? {}) },
    usedOnceSkills: [...(p.usedOnceSkills ?? [])],
  }));
  const enemies = primeState.enemies.map((e) => ({
    ...e,
    dots: [...(e.dots ?? [])],
  }));

  const logs = new CombatLog(() => ({
    playersHp: players.map((p) => p.hp),
    enemiesHp: enemies.map((e) => e.hp),
  }));

  // ── Player DoTs ────────────────────────────────────────────────────────────
  for (const player of players.filter((p) => p.hp > 0)) {
    if (player.dots.length > 0) {
      player.dots = player.dots.map((dot) => {
        player.hp = Math.max(0, player.hp - dot.value);
        logs.push(`☠️ **${dot.label ?? 'Poison'}** : **${player.name}** perd **${dot.value}** HP *(${player.hp}/${player.maxHp} HP)*.`);
        return { ...dot, turns: dot.turns - 1 };
      }).filter((d) => d.turns > 0);
    }
  }

  // ── Enemy DoTs ─────────────────────────────────────────────────────────────
  for (const enemy of enemies.filter((e) => e.hp > 0)) {
    if (enemy.dots.length > 0) {
      enemy.dots = enemy.dots.map((dot) => {
        enemy.hp = Math.max(0, enemy.hp - dot.value);
        logs.push(`🔥 **${dot.label ?? 'DoT'}** : **${enemy.name}** perd **${dot.value}** HP *(${enemy.hp}/${enemy.maxHp} HP)*.`);
        return { ...dot, turns: dot.turns - 1 };
      }).filter((d) => d.turns > 0);
    }
  }

  // ── Buff / CD decay ────────────────────────────────────────────────────────
  for (const player of players) {
    player.buffs = (player.buffs ?? []).map((b) => ({ ...b, turns: b.turns - 1 })).filter((b) => {
      if (b.turns <= 0) { player[b.stat] -= b.value; return false; }
      return true;
    });
    for (const key of Object.keys(player.skillCooldowns ?? {})) {
      if (player.skillCooldowns[key] > 0) player.skillCooldowns[key] -= 1;
    }
  }

  // ── Player actions (SPD desc) ──────────────────────────────────────────────
  const sortedPlayers = [...players].sort((a, b) => b.spd - a.spd);

  for (const player of sortedPlayers) {
    if (player.hp <= 0) continue;
    if (player.stunned) {
      logs.push(`💫 **${player.name}** est **étourdi** et passe son tour.`);
      player.stunned = false;
      continue;
    }

    const action = primeState.pendingActions[player.characterId];
    if (!action) continue;

    const aliveEnemies = enemies.filter((e) => e.hp > 0);
    if (aliveEnemies.length === 0) break;

    const target = enemies[action.targetIndex]?.hp > 0
      ? enemies[action.targetIndex]
      : aliveEnemies[0];

    if (action.type === 'attack') {
      const result = playerAttack(player, target, 1.0);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`⚔️ **${player.name}** — Attaque : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);

      for (const passiveKey of (player.activePassives ?? [])) {
        const passive = PASSIVES[passiveKey];
        if (passive && target.hp > 0) passive.resolve(player, target, logs);
      }
    } else if (action.type === 'skill') {
      const skill = (player.activeSkills ?? []).find((s) => s.key === action.skillKey);
      if (!skill) continue;
      const cd = player.skillCooldowns[action.skillKey] ?? 0;
      if (cd > 0) { logs.push(`**${player.name}** : **${skill.name}** en recharge (${cd}t) !`); continue; }
      if (skill.oncePerCombat && player.usedOnceSkills.includes(action.skillKey)) {
        logs.push(`**${player.name}** : **${skill.name}** déjà utilisé ce combat !`); continue;
      }

      skill.resolve(player, target, logs, { playerAttack });
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);

      if (skill.oncePerCombat) {
        player.usedOnceSkills.push(action.skillKey);
      } else {
        player.skillCooldowns[action.skillKey] = skill.cooldown ?? 0;
      }
    } else if (action.type === 'item') {
      const itemDef = ITEMS[action.itemId];
      if (!itemDef) continue;
      const idx = (player.consumables ?? []).findIndex(
        (c) => c.itemId === action.itemId && (c.quantity > 0 || c.quantity === -1),
      );
      if (idx === -1) { logs.push(`**${player.name}** : **${itemDef.name}** non disponible !`); continue; }

      const { effect } = itemDef;
      const aliveEnemiesNow = enemies.filter((e) => e.hp > 0);

      if (effect?.type === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + effect.value);
        logs.push(`💊 **${player.name}** utilise **${itemDef.name}** : +**${effect.value}** HP *(${player.hp}/${player.maxHp} HP)*.`);
      } else if (effect?.type === 'damage') {
        const targets = effect.aoe ? aliveEnemiesNow : [target];
        for (const t of targets) {
          t.hp = Math.max(0, t.hp - effect.value);
          logs.push(`💣 **${player.name}** utilise **${itemDef.name}** sur **${t.name}** : **${effect.value}** dégâts${t.hp <= 0 ? ' ☠️' : ''}.`);
        }
      } else if (effect?.type === 'buff') {
        player[effect.stat] = (player[effect.stat] ?? 0) + effect.value;
        player.buffs.push({ stat: effect.stat, value: effect.value, turns: effect.turns });
        logs.push(`⚡ **${player.name}** utilise **${itemDef.name}** : ${effect.stat.toUpperCase()}+${effect.value} (${effect.turns}t).`);
      } else if (effect?.type === 'cure_dot') {
        const count = (player.dots ?? []).length;
        player.dots = [];
        logs.push(count > 0
          ? `💊 **${player.name}** utilise **${itemDef.name}** : tous les effets négatifs sont dissipés.`
          : `💊 **${player.name}** utilise **${itemDef.name}** : aucun effet à dissiper.`);
      }

      if (player.consumables[idx].quantity !== -1) player.consumables[idx].quantity -= 1;
    }
  }

  // ── Check victory ──────────────────────────────────────────────────────────
  if (enemies.every((e) => e.hp <= 0)) {
    return { players, enemies, logs: Array.from(logs), frames: logs.frames, initialSnapshot: logs.initialSnapshot, allEnemiesDead: true, allPlayersDead: false };
  }

  // ── Enemy turns ────────────────────────────────────────────────────────────
  for (const enemy of enemies.filter((e) => e.hp > 0)) {
    const alivePlayers = players.filter((p) => p.hp > 0);
    if (alivePlayers.length === 0) break;

    if (enemy.stunned) {
      logs.push(`💫 **${enemy.name}** est **étourdi** et passe son tour.`);
      enemy.stunned = false;
      continue;
    }

    // Random AI: 0 = attack, 1 = ability, 2 = rest
    const choice = Math.floor(Math.random() * 3);
    const randomTarget = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];

    if (choice === 2) {
      const heal = enemy.restHeal ?? Math.max(1, Math.floor(enemy.maxHp * 0.15));
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
      logs.push(`💤 **${enemy.name}** se repose et récupère **${heal}** HP *(${enemy.hp}/${enemy.maxHp} HP)*.`);
    } else if (choice === 1 && enemy.ability) {
      const ability = ABILITIES[enemy.ability];
      if (ability) {
        ability.resolve(enemy, randomTarget, logs, { enemies });
        if (randomTarget.hp < 0) randomTarget.hp = 0;
      } else {
        const dmg = Math.max(1, Math.round(rawDamage(enemy.atk, randomTarget.def)));
        randomTarget.hp = Math.max(0, randomTarget.hp - dmg);
        logs.push(`🗡️ **${enemy.name}** attaque **${randomTarget.name}** pour **${dmg}** dégâts *(${randomTarget.hp}/${randomTarget.maxHp} HP)*${randomTarget.hp <= 0 ? ' 💀' : ''}.`);
      }
    } else {
      const dmg = Math.max(1, Math.round(rawDamage(enemy.atk, randomTarget.def)));
      randomTarget.hp = Math.max(0, randomTarget.hp - dmg);
      logs.push(`🗡️ **${enemy.name}** attaque **${randomTarget.name}** pour **${dmg}** dégâts *(${randomTarget.hp}/${randomTarget.maxHp} HP)*${randomTarget.hp <= 0 ? ' 💀' : ''}.`);
    }
  }

  const allPlayersDead = players.every((p) => p.hp <= 0);
  return { players, enemies, logs: Array.from(logs), frames: logs.frames, initialSnapshot: logs.initialSnapshot, allEnemiesDead: false, allPlayersDead };
}

module.exports = { resolvePrimeRound };
