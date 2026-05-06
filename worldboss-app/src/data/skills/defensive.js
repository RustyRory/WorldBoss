'use strict';

module.exports = {
  soin: {
    name: 'Soin',
    oncePerCombat: true,
    cooldown: 0,
    resolve(player, _target, logs) {
      const healAmt = 20;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`✨ **Soin** : vous récupérez **${healAmt}** HP (HP : ${player.hp}/${player.maxHp}).`);
    },
  },

  divine_heal: {
    name: 'Soin divin',
    oncePerCombat: true,
    cooldown: 0,
    resolve(player, _target, logs) {
      const healAmt = 50;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`💚 **Soin divin** : vous récupérez **${healAmt}** HP (HP : ${player.hp}/${player.maxHp}).`);
    },
  },

  second_wind: {
    name: 'Second souffle',
    oncePerCombat: false,
    cooldown: 5,
    resolve(player, _target, logs) {
      const healAmt = Math.floor(player.maxHp * 0.25);
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`💨 **Second souffle** : vous récupérez **${healAmt}** HP (HP : ${player.hp}/${player.maxHp}).`);
    },
  },

  iron_skin: {
    name: 'Peau de fer',
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, _target, logs) {
      const buffVal = 15;
      player.def += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'def', value: buffVal, turns: 3 }];
      logs.push(`🛡️ **Peau de fer** : votre DEF augmente de **${buffVal}** pour 3 tours (DEF : ${player.def}).`);
    },
  },

  barrier: {
    name: 'Barrière',
    oncePerCombat: false,
    cooldown: 5,
    resolve(player, _target, logs) {
      const buffVal = 30;
      player.def += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'def', value: buffVal, turns: 2 }];
      logs.push(`🔰 **Barrière** : votre DEF augmente de **${buffVal}** pour 2 tours (DEF : ${player.def}).`);
    },
  },
};
