'use strict';

module.exports = {
  battle_cry: {
    name: 'Cri de bataille',
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, _target, logs) {
      const buffVal = 10;
      player.atk += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'atk', value: buffVal, turns: 3 }];
      logs.push(`⚔️ **Cri de bataille** : votre ATK augmente de **${buffVal}** pour 3 tours (ATK : ${player.atk}).`);
    },
  },

  quicken: {
    name: 'Accélération',
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, _target, logs) {
      const buffVal = 8;
      player.spd += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'spd', value: buffVal, turns: 3 }];
      logs.push(`⚡ **Accélération** : votre SPD augmente de **${buffVal}** pour 3 tours (SPD : ${player.spd}).`);
    },
  },

  resurrection: {
    name: 'Résurrection',
    oncePerCombat: true,
    cooldown: 0,
    resolve(player, _target, logs) {
      if (player.hp <= 0) {
        const healAmt = Math.floor(player.maxHp * 0.3);
        player.hp = healAmt;
        logs.push(`✝️ **Résurrection** : vous revenez à la vie avec **${healAmt}** HP !`);
      } else {
        const healAmt = Math.floor(player.maxHp * 0.3);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        logs.push(`✝️ **Résurrection** : vous récupérez **${healAmt}** HP (HP : ${player.hp}/${player.maxHp}).`);
      }
    },
  },
};
