'use strict';

const { ABILITIES } = require('../data/abilities');
const { PASSIVES }  = require('../data/passives');

function rollInitiative(spd) {
  return spd + Math.random() * spd * 0.1;
}

function rawDamage(atk, def, skillMult = 1.0) {
  return atk * skillMult * (100 / (100 + def));
}

function applyCrit(raw, critChance, critMult = 1.5) {
  const roll = Math.random() * 100;
  const isCrit = roll < critChance;
  return { damage: isCrit ? raw * critMult : raw, isCrit };
}

function playerAttack(player, enemy, skillMult = 1.0) {
  const raw = rawDamage(player.atk, enemy.def, skillMult);
  const { damage: afterCrit, isCrit } = applyCrit(raw, player.crit ?? 0, player.critMult ?? 1.5);
  const finalDmg = Math.max(1, Math.round(afterCrit));
  const critText = isCrit ? ' 💥 **CRITIQUE!**' : '';
  const hpAfter = Math.max(0, enemy.hp - finalDmg);
  return { damage: finalDmg, isCrit, critText, log: `**${finalDmg}** dégâts à **${enemy.name}**${critText} *(${hpAfter}/${enemy.maxHp} HP)*` };
}

function resolveEnemyTurn(enemy, player, logs, allies = [], enemies = []) {
  if (enemy.hp <= 0) return;

  // Enemy DoTs (e.g. fire_dot from player passive)
  if (enemy.dots && enemy.dots.length > 0) {
    enemy.dots = enemy.dots.map((dot) => {
      enemy.hp -= dot.value;
      logs.push(`🔥 **${dot.label ?? 'DoT'}** : **${enemy.name}** perd **${dot.value}** HP *(${Math.max(0, enemy.hp)}/${enemy.maxHp} HP)*.`);
      return { ...dot, turns: dot.turns - 1 };
    }).filter((d) => d.turns > 0);
    if (enemy.hp <= 0) { enemy.hp = 0; return; }
  }

  if (enemy.stunned) {
    logs.push(`💫 **${enemy.name}** est **étourdi** et passe son tour.`);
    enemy.stunned = false;
    return;
  }

  // Pick a target: player or a living ally (equal probability per combatant)
  const aliveAllies = allies.filter((a) => a.hp > 0);
  const allTargets  = [player, ...aliveAllies];
  const target      = allTargets[Math.floor(Math.random() * allTargets.length)];
  const isAlly      = target !== player;

  // Random AI: 0 = attack, 1 = ability (or attack if none), 2 = rest
  const choice = Math.floor(Math.random() * 3);

  if (choice === 2) {
    const heal = enemy.restHeal ?? Math.max(1, Math.floor(enemy.maxHp * 0.15));
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
    logs.push(`💤 **${enemy.name}** se repose et récupère **${heal}** HP *(${enemy.hp}/${enemy.maxHp} HP)*.`);
  } else if (choice === 1 && enemy.ability && !isAlly) {
    // Abilities always target the player (complex effects)
    const ability = ABILITIES[enemy.ability];
    if (ability) {
      ability.resolve(enemy, player, logs, { enemies });
    } else {
      const raw = rawDamage(enemy.atk, player.def);
      const dmg = Math.max(1, Math.round(raw));
      player.hp = Math.max(0, player.hp - dmg);
      logs.push(`🗡️ **${enemy.name}** vous attaque pour **${dmg}** dégâts *(${player.hp}/${player.maxHp} HP)*.`);
    }
  } else {
    const raw = rawDamage(enemy.atk, target.def);
    const dmg = Math.max(1, Math.round(raw));
    target.hp = Math.max(0, target.hp - dmg);
    if (isAlly) {
      logs.push(`🗡️ **${enemy.name}** attaque **${target.name}** pour **${dmg}** dégâts *(${target.hp}/${target.maxHp} HP)*${target.hp <= 0 ? ' — *il tombe !*' : ''}.`);
    } else {
      logs.push(`🗡️ **${enemy.name}** vous attaque pour **${dmg}** dégâts *(${player.hp}/${player.maxHp} HP)*.`);
    }
  }
}

/**
 * Resolve a full turn.
 * @param {object} state        - combat state
 * @param {string} playerAction - 'attack' | 'skill_<key>' | 'item_potion_heal' | 'flee'
 * @param {number} targetIndex  - index in state.enemies array
 */
function resolveAllyTurn(ally, enemies, logs) {
  if (ally.hp <= 0) return;

  const aliveEnemies = enemies.filter((e) => e.hp > 0);
  if (aliveEnemies.length === 0) return;

  // Simple AI: 1/3 rest, 2/3 attack
  if (Math.random() < 0.33) {
    const heal = Math.max(1, Math.floor(ally.maxHp * 0.15));
    ally.hp = Math.min(ally.maxHp, ally.hp + heal);
    logs.push(`💤 **${ally.name}** reprend son souffle (+**${heal}** HP).`);
  } else {
    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const raw = rawDamage(ally.atk, target.def);
    const dmg = Math.max(1, Math.round(raw));
    target.hp = Math.max(0, target.hp - dmg);
    logs.push(`🧑‍💼 **${ally.name}** attaque **${target.name}** pour **${dmg}** dégâts${target.hp <= 0 ? ' ☠️' : ''}.`);
  }
}

// Auto-snapshots HP after every push so the animation can replay per-action.
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

function resolveTurn(state, playerAction, targetIndex = 0) {
  const player = {
    ...state.player,
    buffs:          [...(state.player.buffs          ?? [])],
    dots:           [...(state.player.dots           ?? [])],
    consumables:    (state.player.consumables ?? []).map((c) => ({ ...c })),
    activeSkills:   (state.player.activeSkills  ?? []).map((s) => ({ ...s })),
    activePassives: [...(state.player.activePassives ?? [])],
    skillCooldowns: { ...(state.player.skillCooldowns ?? {}) },
    usedOnceSkills: [...(state.player.usedOnceSkills ?? [])],
  };
  const enemies = state.enemies.map((e) => ({ ...e, dots: [...(e.dots ?? [])] }));
  const allies  = (state.allies ?? []).map((a) => ({ ...a }));
  const logs = new CombatLog(() => ({
    playerHp:  player.hp,
    enemiesHp: enemies.map((e) => e.hp),
    alliesHp:  allies.map((a) => a.hp),
  }));

  // ── Flee ──────────────────────────────────────────────────────────────────
  if (playerAction === 'flee') {
    const aliveEnemy = enemies.find((e) => e.hp > 0);
    const fleeChance = aliveEnemy ? 0.4 + (player.spd / (player.spd + aliveEnemy.spd)) * 0.3 : 1;
    if (Math.random() < fleeChance) {
      logs.push('Vous avez **fui** le combat !');
      return { playerState: player, enemiesState: enemies, logs: Array.from(logs), frames: logs.frames, initialSnapshot: logs.initialSnapshot, fled: true, playerDied: false, allEnemiesDead: false };
    }
    logs.push('Fuite **échouée** !');
  }

  // ── Player DoTs ───────────────────────────────────────────────────────────
  if (player.dots.length > 0) {
    player.dots = player.dots.map((dot) => {
      player.hp = Math.max(0, player.hp - dot.value);
      logs.push(`☠️ **${dot.label ?? 'Poison'}** : vous perdez **${dot.value}** HP *(${player.hp}/${player.maxHp} HP)*.`);
      return { ...dot, turns: dot.turns - 1 };
    }).filter((d) => d.turns > 0);
  }

  // ── Buffs decay ───────────────────────────────────────────────────────────
  if (player.buffs.length > 0) {
    player.buffs = player.buffs.map((b) => ({ ...b, turns: b.turns - 1 })).filter((b) => {
      if (b.turns <= 0) { player[b.stat] -= b.value; logs.push(`🔻 Buff **${b.stat}** expiré (-${b.value}).`); return false; }
      return true;
    });
  }

  // ── Skill cooldowns decay ─────────────────────────────────────────────────
  for (const key of Object.keys(player.skillCooldowns)) {
    if (player.skillCooldowns[key] > 0) player.skillCooldowns[key] -= 1;
  }

  // ── Initiative ────────────────────────────────────────────────────────────
  const aliveEnemies = enemies.filter((e) => e.hp > 0);
  const fastestEnemy = aliveEnemies.reduce((a, b) => (b.spd > a.spd ? b : a), aliveEnemies[0] ?? { spd: 0 });
  const playerGoesFirst = rollInitiative(player.spd) >= rollInitiative(fastestEnemy.stunned ? 0 : fastestEnemy.spd);

  // ── Player action ─────────────────────────────────────────────────────────
  function executePlayerAction() {
    const target = enemies[targetIndex]?.hp > 0
      ? enemies[targetIndex]
      : enemies.find((e) => e.hp > 0);

    if (!target) return;

    if (playerAction === 'attack') {
      const result = playerAttack(player, target, 1.0);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`⚔️ **Attaque** : ${result.log}.`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
      // Trigger all weapon passives
      for (const passiveKey of player.activePassives) {
        const passive = PASSIVES[passiveKey];
        if (passive && target.hp > 0) passive.resolve(player, target, logs);
      }
    } else if (playerAction.startsWith('skill_')) {
      const skillKey = playerAction.slice(6); // strip 'skill_'
      const skill = (player.activeSkills ?? []).find((s) => s.key === skillKey);
      if (!skill) { logs.push('Skill introuvable !'); return; }

      const cd = player.skillCooldowns[skillKey] ?? 0;
      if (cd > 0) {
        logs.push(`**${skill.name}** en recharge encore **${cd}** tour(s) !`);
        return;
      }
      if (skill.oncePerCombat && player.usedOnceSkills.includes(skillKey)) {
        logs.push(`**${skill.name}** déjà utilisé ce combat !`);
        return;
      }

      skill.resolve(player, target, logs, { playerAttack });

      if (skill.oncePerCombat) {
        player.usedOnceSkills.push(skillKey);
      } else {
        player.skillCooldowns[skillKey] = skill.cooldown ?? 0;
      }
    } else if (playerAction.startsWith('item_')) {
      const { ITEMS } = require('../data/items');
      const itemId = playerAction.slice(5);
      const itemDef = ITEMS[itemId];
      if (!itemDef) { logs.push('Item inconnu !'); return; }

      const idx = (player.consumables || []).findIndex((c) => c.itemId === itemId && (c.quantity > 0 || c.quantity === -1));
      if (idx === -1) { logs.push(`**${itemDef.name}** non disponible !`); return; }

      const effect = itemDef.effect;
      if (effect?.type === 'heal') {
        player.hp = Math.min(player.maxHp, player.hp + effect.value);
        logs.push(`💊 **${itemDef.name}** : vous récupérez **${effect.value}** HP *(${player.hp}/${player.maxHp} HP)*.`);
      } else if (effect?.type === 'damage') {
        const targets = effect.aoe ? enemies.filter((e) => e.hp > 0) : [target];
        for (const t of targets) {
          t.hp = Math.max(0, t.hp - effect.value);
          logs.push(`💣 **${itemDef.name}** inflige **${effect.value}** dégâts à **${t.name}** *(${t.hp}/${t.maxHp} HP)*${t.hp <= 0 ? ' ☠️' : ''}.`);
        }
      } else if (effect?.type === 'stun') {
        target.stunned = true;
        logs.push(`❄️ **${itemDef.name}** : **${target.name}** est **étourdi** !`);
      } else if (effect?.type === 'buff') {
        player[effect.stat] = (player[effect.stat] ?? 0) + effect.value;
        player.buffs = [...(player.buffs ?? []), { stat: effect.stat, value: effect.value, turns: effect.turns }];
        logs.push(`⚡ **${itemDef.name}** : **${effect.stat}** +${effect.value} pendant **${effect.turns}** tours (total : ${player[effect.stat]}).`);
      } else if (effect?.type === 'dot') {
        target.dots = [...(target.dots ?? []), { id: itemId, label: itemDef.name, value: effect.value, turns: effect.turns }];
        logs.push(`☠️ **${itemDef.name}** : **${target.name}** est empoisonné (**${effect.value}** dégâts/tour, **${effect.turns}** tours).`);
      } else if (effect?.type === 'cure_dot') {
        const count = (player.dots ?? []).length;
        player.dots = [];
        logs.push(count > 0 ? `💊 **${itemDef.name}** : tous vos effets négatifs sont dissipés.` : `💊 **${itemDef.name}** : aucun effet à dissiper.`);
      }

      if (player.consumables[idx].quantity !== -1) player.consumables[idx].quantity -= 1;
    }
  }

  if (playerGoesFirst) {
    executePlayerAction();
    const stillAlive = enemies.filter((e) => e.hp > 0);
    for (const enemy of stillAlive) {
      resolveEnemyTurn(enemy, player, logs, allies, enemies);
      if (player.hp <= 0) break;
    }
  } else {
    const stillAlive = enemies.filter((e) => e.hp > 0);
    for (const enemy of stillAlive) {
      resolveEnemyTurn(enemy, player, logs, allies, enemies);
      if (player.hp <= 0) break;
    }
    if (player.hp > 0) executePlayerAction();
  }

  // ── Ally turns (after player + enemies) ─────────────────────────────────
  for (const ally of allies) {
    resolveAllyTurn(ally, enemies, logs);
  }

  const allEnemiesDead = enemies.every((e) => e.hp <= 0);
  const playerDied = player.hp <= 0;
  if (playerDied) { player.hp = 0; logs.push('💀 Vous êtes **tombé** au combat.'); }

  return { playerState: player, enemiesState: enemies, alliesState: allies, logs: Array.from(logs), frames: logs.frames, initialSnapshot: logs.initialSnapshot, fled: false, playerDied, allEnemiesDead };
}

module.exports = { resolveTurn, playerAttack, rawDamage };
