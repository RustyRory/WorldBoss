'use strict';

module.exports = {
  power_strike: {
    name: 'Frappe puissante',
    emoji: '💥',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 1.5);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      logs.push(`💥 **${enemy.name}** utilise **Frappe puissante** et inflige **${dmg}** dégâts.`);
    },
  },

  heal: {
    name: 'Soin',
    emoji: '💚',
    resolve(enemy, _player, logs) {
      const healAmt = Math.floor(enemy.maxHp * 0.25);
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmt);
      logs.push(`💚 **${enemy.name}** se soigne de **${healAmt}** HP (HP : ${enemy.hp}/${enemy.maxHp}).`);
    },
  },

  rally: {
    name: 'Ralliement',
    emoji: '🚩',
    resolve(enemy, _player, logs) {
      enemy.atk += 5;
      enemy.def += 3;
      logs.push(`🚩 **${enemy.name}** se **Rallie** ! ATK +5 (${enemy.atk}), DEF +3 (${enemy.def}).`);
    },
  },
};
