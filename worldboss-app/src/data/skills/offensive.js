'use strict';

module.exports = {
  firebolt: {
    name: 'Firebolt',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.8);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`🔥 **Firebolt** : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  bone_bolt: {
    name: 'Trait osseux',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.5);
      target.hp = Math.max(0, target.hp - result.damage);
      const dot = { id: 'bone_chill', label: 'Froid Osseux', value: 3, turns: 2 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bone_chill');
      if (existing !== -1) target.dots[existing] = dot;
      else target.dots = [...(target.dots ?? []), dot];
      logs.push(`🦴 **Trait osseux** : ${result.log} + Froid Osseux (3 dégâts/tour, 2 tours).`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  shadow_burst: {
    name: 'Explosion d\'ombre',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.2);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`🌑 **Explosion d'ombre** : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  ice_lance: {
    name: 'Lance de glace',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.6);
      target.hp = Math.max(0, target.hp - result.damage);
      if (target.hp > 0) target.stunned = true;
      logs.push(`❄️ **Lance de glace** : ${result.log}${target.hp > 0 ? ' + **étourdi** !' : '.'}`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  thunder_bolt: {
    name: 'Éclair',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.7);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`⚡ **Éclair** : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  soul_rend: {
    name: 'Déchirement d\'âme',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.5);
      target.hp = Math.max(0, target.hp - result.damage);
      const dot = { id: 'bleed', label: 'Saignement', value: 5, turns: 3 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bleed');
      if (existing !== -1) target.dots[existing] = dot;
      else target.dots = [...(target.dots ?? []), dot];
      logs.push(`💔 **Déchirement d'âme** : ${result.log} + Saignement (5 dégâts/tour, 3 tours).`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  power_slash: {
    name: 'Taille puissante',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.0);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`⚔️ **Taille puissante** : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  royal_smite: {
    name: 'Frappe royale',
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.2);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`👑 **Frappe royale** : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  hellstrike: {
    name: 'Frappe infernale',
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.5);
      target.hp = Math.max(0, target.hp - result.damage);
      const dot = { id: 'fire_dot', label: 'Brûlure', value: 5, turns: 3 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'fire_dot');
      if (existing !== -1) target.dots[existing] = dot;
      else target.dots = [...(target.dots ?? []), dot];
      logs.push(`😈 **Frappe infernale** : ${result.log} + Brûlure (5 dégâts/tour, 3 tours).`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  inferno_blast: {
    name: 'Souffle infernal',
    oncePerCombat: false,
    cooldown: 5,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.0);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`🌋 **Souffle infernal** : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  soul_drain: {
    name: 'Drain d\'âme',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.8);
      target.hp = Math.max(0, target.hp - result.damage);
      const healAmt = Math.floor(result.damage * 0.3);
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`🩸 **Drain d'âme** : ${result.log} + vous récupérez **${healAmt}** HP *(${player.hp}/${player.maxHp} HP)*.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  sand_storm: {
    name: 'Tempête de sable',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.4);
      target.hp = Math.max(0, target.hp - result.damage);
      target.def = Math.max(0, target.def - 5);
      logs.push(`🌪️ **Tempête de sable** : ${result.log} + DEF réduite de 5 *(DEF : ${target.def})*.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  // ── Arc 1 — Catacombes ────────────────────────────────────────────────────

  quick_cut: {
    name: 'Entaille rapide',
    oncePerCombat: false,
    cooldown: 1,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.2);
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`🗡️ **Entaille rapide** : ${result.log}.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  bone_smash: {
    name: 'Coup d\'os',
    oncePerCombat: false,
    cooldown: 1,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.4);
      target.hp = Math.max(0, target.hp - result.damage);
      target.def = Math.max(0, target.def - 2);
      logs.push(`🦴 **Coup d'os** : ${result.log} + DEF réduite de 2 *(DEF : ${target.def})*.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  crypt_bolt: {
    name: 'Trait de crypte',
    oncePerCombat: false,
    cooldown: 1,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.3);
      target.hp = Math.max(0, target.hp - result.damage);
      const dot = { id: 'bone_chill', label: 'Froid Osseux', value: 2, turns: 2 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bone_chill');
      if (existing !== -1) target.dots[existing] = dot;
      else target.dots = [...(target.dots ?? []), dot];
      logs.push(`💀 **Trait de crypte** : ${result.log} + Froid Osseux (2 dégâts/tour, 2 tours).`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  tomb_slash: {
    name: 'Taille de la tombe',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.5);
      target.hp = Math.max(0, target.hp - result.damage);
      const dot = { id: 'bleed', label: 'Saignement', value: 3, turns: 2 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bleed');
      if (existing !== -1) target.dots[existing] = dot;
      else target.dots = [...(target.dots ?? []), dot];
      logs.push(`⚰️ **Taille de la tombe** : ${result.log} + Saignement (3 dégâts/tour, 2 tours).`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  bone_arrow: {
    name: 'Flèche d\'os',
    oncePerCombat: false,
    cooldown: 1,
    resolve(player, target, logs, { playerAttack }) {
      const savedDef = target.def;
      target.def = Math.floor(target.def * 0.7);
      const result = playerAttack(player, target, 1.4);
      target.def = savedDef;
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`🏹 **Flèche d'os** : ${result.log} *(ignore 30% DEF)*.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  impale: {
    name: 'Empalage',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.6);
      target.hp = Math.max(0, target.hp - result.damage);
      const dot = { id: 'bleed', label: 'Saignement', value: 4, turns: 3 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bleed');
      if (existing !== -1) target.dots[existing] = dot;
      else target.dots = [...(target.dots ?? []), dot];
      logs.push(`🗡️ **Empalage** : ${result.log} + Saignement (4 dégâts/tour, 3 tours).`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  dark_bolt: {
    name: 'Éclair des ténèbres',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.5);
      target.hp = Math.max(0, target.hp - result.damage);
      target.def = Math.max(0, target.def - 3);
      logs.push(`🌑 **Éclair des ténèbres** : ${result.log} + DEF réduite de 3 *(DEF : ${target.def})*.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  // ── Armes diverses ────────────────────────────────────────────────────────

  cleave: {
    name: 'Taillade',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.5);
      target.hp = Math.max(0, target.hp - result.damage);
      target.def = Math.max(0, target.def - 3);
      logs.push(`🪓 **Taillade** : ${result.log} + DEF réduite de 3 *(DEF : ${target.def})*.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  hunters_mark: {
    name: 'Marque du chasseur',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.3);
      target.hp = Math.max(0, target.hp - result.damage);
      const buffVal = 15;
      player.crit += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'crit', value: buffVal, turns: 2 }];
      logs.push(`🎯 **Marque du chasseur** : ${result.log} + CRIT +${buffVal}% pour 2 tours.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  precise_bolt: {
    name: 'Tir de précision',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const savedDef = target.def;
      target.def = Math.floor(target.def * 0.5);
      const result = playerAttack(player, target, 1.5);
      target.def = savedDef;
      target.hp = Math.max(0, target.hp - result.damage);
      logs.push(`🎯 **Tir de précision** : ${result.log} *(ignore 50% DEF)*.`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },

  steam_shot: {
    name: 'Tir à vapeur',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.7);
      target.hp = Math.max(0, target.hp - result.damage);
      if (target.hp > 0) target.stunned = true;
      logs.push(`💨 **Tir à vapeur** : ${result.log}${target.hp > 0 ? ' + **étourdi** !' : '.'}`);
      if (target.hp <= 0) logs.push(`☠️ **${target.name}** est vaincu !`);
    },
  },
};
