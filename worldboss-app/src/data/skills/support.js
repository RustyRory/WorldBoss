'use strict';

module.exports = {
  battle_cry: {
    name: 'Cri de bataille',
    wiki: { emoji: '📣', stat: 'ATK', val: 10, turns: 3 },
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, _target, logs) {
      const buffVal = 10;
      player.atk += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'atk', value: buffVal, turns: 3 }];
      logs.push(`⚔️ **Cri de bataille** : ATK +**${buffVal}** pour 3 tours.`);
    },
  },

  quicken: {
    name: 'Accélération',
    wiki: { emoji: '💨', stat: 'SPD', val: 8, turns: 3 },
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, _target, logs) {
      const buffVal = 8;
      player.spd += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'spd', value: buffVal, turns: 3 }];
      logs.push(`⚡ **Accélération** : SPD +**${buffVal}** pour 3 tours.`);
    },
  },

  resurrection: {
    name: 'Résurrection',
    wiki: { emoji: '☀️', healPct: 0.3 },
    oncePerCombat: true,
    cooldown: 0,
    resolve(player, _target, logs) {
      const healAmt = Math.floor(player.maxHp * 0.3);
      if (player.hp <= 0) {
        player.hp = healAmt;
        logs.push(`✝️ **Résurrection** : vous revenez à la vie avec **${healAmt}** HP !`);
      } else {
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        logs.push(`✝️ **Résurrection** : vous récupérez **${healAmt}** HP.`);
      }
    },
  },
};
