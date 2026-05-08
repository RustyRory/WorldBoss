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
};
