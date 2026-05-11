'use strict';

module.exports = {
  soin: {
    name: 'Soin',
    wiki: { emoji: '💚', healFlat: 20 },
    oncePerCombat: true,
    cooldown: 0,
    resolve(player, _target, logs) {
      const healAmt = 20;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`✨ **Soin** : vous récupérez **${healAmt}** HP.`);
    },
  },

  divine_heal: {
    name: 'Soin divin',
    wiki: { emoji: '✨', healFlat: 50 },
    oncePerCombat: true,
    cooldown: 0,
    resolve(player, _target, logs) {
      const healAmt = 50;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`💚 **Soin divin** : vous récupérez **${healAmt}** HP.`);
    },
  },

  second_wind: {
    name: 'Second souffle',
    wiki: { emoji: '🌬️', healPct: 0.25 },
    oncePerCombat: false,
    cooldown: 5,
    resolve(player, _target, logs) {
      const healAmt = Math.floor(player.maxHp * 0.25);
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`💨 **Second souffle** : vous récupérez **${healAmt}** HP.`);
    },
  },

  iron_skin: {
    name: 'Peau de fer',
    wiki: { emoji: '🛡️', stat: 'DEF', val: 15, turns: 3 },
    oncePerCombat: false,
    cooldown: 4,
    resolve(player, _target, logs) {
      const buffVal = 15;
      player.def += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'def', value: buffVal, turns: 3 }];
      logs.push(`🛡️ **Peau de fer** : DEF +**${buffVal}** pour 3 tours.`);
    },
  },

  barrier: {
    name: 'Barrière',
    wiki: { emoji: '🔰', stat: 'DEF', val: 30, turns: 2 },
    oncePerCombat: false,
    cooldown: 5,
    resolve(player, _target, logs) {
      const buffVal = 30;
      player.def += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'def', value: buffVal, turns: 2 }];
      logs.push(`🔰 **Barrière** : DEF +**${buffVal}** pour 2 tours.`);
    },
  },

  spirit_ward: {
    name: 'Garde de l\'esprit',
    wiki: { emoji: '👻', stat: 'DEF', val: 10, turns: 2 },
    oncePerCombat: false,
    cooldown: 3,
    resolve(player, _target, logs) {
      const buffVal = 10;
      player.def += buffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'def', value: buffVal, turns: 2 }];
      logs.push(`👻 **Garde de l'esprit** : DEF +**${buffVal}** pour 2 tours.`);
    },
  },
};
