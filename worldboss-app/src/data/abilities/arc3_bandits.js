'use strict';

module.exports = {
  quick_strike: {
    name: 'Frappe rapide',
    emoji: '⚡',
    resolve(enemy, player, logs) {
      const dmg = Math.max(1, enemy.atk);
      player.hp -= dmg;
      logs.push(`⚡ **${enemy.name}** utilise **Frappe rapide** et inflige **${dmg}** dégâts (ignore toute la DEF).`);
    },
  },

  steal: {
    name: 'Vol',
    emoji: '👜',
    resolve(enemy, player, logs) {
      const dmg = Math.max(1, enemy.atk - player.def);
      player.hp -= dmg;
      logs.push(`👜 **${enemy.name}** tente de **Voler** et inflige **${dmg}** dégâts dans la mêlée.`);
    },
  },

  smash: {
    name: 'Écrasement',
    emoji: '🔨',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 1.4);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      const debuffVal = 4;
      player.def -= debuffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'def', value: -debuffVal, turns: 2 }];
      logs.push(`🔨 **${enemy.name}** utilise **Écrasement** ! Inflige **${dmg}** dégâts et réduit votre DEF de ${debuffVal} pour 2 tours (DEF : ${player.def}).`);
    },
  },

  intimidate: {
    name: 'Intimidation',
    emoji: '😤',
    resolve(enemy, player, logs) {
      const debuffVal = 5;
      player.atk -= debuffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'atk', value: -debuffVal, turns: 2 }];
      logs.push(`😤 **${enemy.name}** vous **Intimide** ! Votre ATK est réduite de ${debuffVal} pour 2 tours (ATK : ${player.atk}).`);
    },
  },
};
