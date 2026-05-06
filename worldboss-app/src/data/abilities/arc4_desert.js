'use strict';

module.exports = {
  shadow_step: {
    name: 'Pas de l\'ombre',
    emoji: '🌑',
    resolve(enemy, player, logs) {
      let dmg;
      if (enemy.spd > player.spd) {
        const base = Math.round(enemy.atk * 1.3);
        const defReduction = Math.floor(player.def * 0.5);
        dmg = Math.max(1, base - defReduction);
        logs.push(`🌑 **${enemy.name}** utilise **Pas de l'ombre** (plus rapide que vous) et inflige **${dmg}** dégâts (ignore 50% DEF).`);
      } else {
        dmg = Math.max(1, Math.round(enemy.atk * 1.3) - player.def);
        logs.push(`🌑 **${enemy.name}** utilise **Pas de l'ombre** et inflige **${dmg}** dégâts.`);
      }
      player.hp -= dmg;
    },
  },

  frenzy_strike: {
    name: 'Frappe frénétique',
    emoji: '🌀',
    resolve(enemy, player, logs) {
      const dmg1 = Math.max(1, enemy.atk - player.def);
      player.hp -= dmg1;
      const dmg2 = Math.max(1, enemy.atk - player.def);
      player.hp -= dmg2;
      logs.push(`🌀 **${enemy.name}** utilise **Frappe frénétique** : 2 attaques de **${dmg1}** + **${dmg2}** dégâts (total : ${dmg1 + dmg2}).`);
    },
  },

  shadow_strike: {
    name: 'Frappe de l\'ombre',
    emoji: '🗡️',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 1.6);
      const defReduction = Math.floor(player.def * 0.6);
      const isCrit = Math.random() < 0.3;
      let dmg = Math.max(1, base - defReduction);
      if (isCrit) dmg = Math.floor(dmg * 1.5);
      player.hp -= dmg;
      logs.push(`🗡️ **${enemy.name}** utilise **Frappe de l'ombre** et inflige **${dmg}** dégâts (ignore 40% DEF${isCrit ? ', CRITIQUE !' : ''}).`);
    },
  },

  curse: {
    name: 'Malédiction',
    emoji: '🔮',
    resolve(enemy, player, logs) {
      const dot = { id: 'curse', label: 'Malédiction', value: 8, turns: 3 };
      const existing = (player.dots ?? []).findIndex((d) => d.id === 'curse');
      if (existing !== -1) {
        player.dots[existing] = dot;
      } else {
        player.dots = [...(player.dots ?? []), dot];
      }
      const debuffVal = 3;
      player.def -= debuffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'def', value: -debuffVal, turns: 3 }];
      logs.push(`🔮 **${enemy.name}** lance une **Malédiction** ! Vous subissez 8 dégâts/tour pendant 3 tours et votre DEF est réduite de ${debuffVal} (DEF : ${player.def}).`);
    },
  },

  poison_sting: {
    name: 'Piqûre empoisonnée',
    emoji: '🐍',
    resolve(enemy, player, logs) {
      const dmg = Math.max(1, enemy.atk - player.def);
      player.hp -= dmg;
      const dot = { id: 'poison', label: 'Poison', value: 6, turns: 4 };
      const existing = (player.dots ?? []).findIndex((d) => d.id === 'poison');
      if (existing !== -1) {
        player.dots[existing] = dot;
      } else {
        player.dots = [...(player.dots ?? []), dot];
      }
      logs.push(`🐍 **${enemy.name}** utilise **Piqûre empoisonnée** : **${dmg}** dégâts + poison (6 dégâts/tour, 4 tours).`);
    },
  },
};
