'use strict';

module.exports = {
  firebolt: {
    name: 'Firebolt',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.8);
      target.hp -= result.damage;
      logs.push(`🔥 **Firebolt** : ${result.log}`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  bone_bolt: {
    name: 'Trait osseux',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.5);
      target.hp -= result.damage;
      const dot = { id: 'bone_chill', label: 'Froid Osseux', value: 3, turns: 2 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bone_chill');
      if (existing !== -1) {
        target.dots[existing] = dot;
      } else {
        target.dots = [...(target.dots ?? []), dot];
      }
      logs.push(`🦴 **Trait osseux** : ${result.log} + Froid Osseux (3 dégâts/tour, 2 tours).`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  shadow_burst: {
    name: 'Explosion d\'ombre',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.2);
      target.hp -= result.damage;
      logs.push(`🌑 **Explosion d'ombre** : ${result.log}`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  ice_lance: {
    name: 'Lance de glace',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.6);
      target.hp -= result.damage;
      target.stunned = true;
      logs.push(`❄️ **Lance de glace** : ${result.log} + **${target.name}** est étourdi !`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  thunder_bolt: {
    name: 'Éclair',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.7);
      target.hp -= result.damage;
      logs.push(`⚡ **Éclair** : ${result.log}`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  soul_rend: {
    name: 'Déchirement d\'âme',
    oncePerCombat: false,
    cooldown: 2,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.5);
      target.hp -= result.damage;
      const dot = { id: 'bleed', label: 'Saignement', value: 5, turns: 3 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bleed');
      if (existing !== -1) {
        target.dots[existing] = dot;
      } else {
        target.dots = [...(target.dots ?? []), dot];
      }
      logs.push(`💔 **Déchirement d'âme** : ${result.log} + Saignement (5 dégâts/tour, 3 tours).`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  power_slash: {
    name: 'Taille puissante',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.0);
      target.hp -= result.damage;
      logs.push(`⚔️ **Taille puissante** : ${result.log}`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  royal_smite: {
    name: 'Frappe royale',
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.2);
      target.hp -= result.damage;
      logs.push(`👑 **Frappe royale** : ${result.log}`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  hellstrike: {
    name: 'Frappe infernale',
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.5);
      target.hp -= result.damage;
      const dot = { id: 'fire_dot', label: 'Brûlure', value: 5, turns: 3 };
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'fire_dot');
      if (existing !== -1) {
        target.dots[existing] = dot;
      } else {
        target.dots = [...(target.dots ?? []), dot];
      }
      logs.push(`😈 **Frappe infernale** : ${result.log} + Brûlure (5 dégâts/tour, 3 tours).`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  inferno_blast: {
    name: 'Souffle infernal',
    oncePerCombat: false,
    cooldown: 5,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 2.0);
      target.hp -= result.damage;
      logs.push(`🌋 **Souffle infernal** : ${result.log}`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  soul_drain: {
    name: 'Drain d\'âme',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.8);
      target.hp -= result.damage;
      const healAmt = Math.floor(result.damage * 0.3);
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`🩸 **Drain d'âme** : ${result.log} + vous récupérez **${healAmt}** HP.`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },

  sand_storm: {
    name: 'Tempête de sable',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, target, logs, { playerAttack }) {
      const result = playerAttack(player, target, 1.4);
      target.hp -= result.damage;
      target.def = Math.max(0, target.def - 5);
      logs.push(`🌪️ **Tempête de sable** : ${result.log} + DEF de **${target.name}** réduite de 5 (DEF : ${target.def}).`);
      if (target.hp <= 0) {
        target.hp = 0;
        logs.push(`☠️ **${target.name}** est vaincu !`);
      }
    },
  },
};
