'use strict';

module.exports = {
  regeneration: {
    name: 'Régénération',
    resolve(player, _target, logs) {
      const healAmt = 3;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`💚 **Régénération** : vous récupérez **${healAmt}** HP (HP : ${player.hp}/${player.maxHp}).`);
    },
  },

  life_steal: {
    name: 'Vol de vie',
    resolve(player, _target, logs) {
      const healAmt = 5;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      logs.push(`🩸 **Vol de vie** : vous volez **${healAmt}** HP (HP : ${player.hp}/${player.maxHp}).`);
    },
  },

  frost_shield: {
    name: 'Bouclier de givre',
    resolve(player, _target, logs) {
      if (!(player.buffs ?? []).some((b) => b.id === 'frost_shield')) {
        player.def += 3;
        player.buffs = [...(player.buffs ?? []), { id: 'frost_shield', stat: 'def', value: 3, turns: 2 }];
        logs.push(`❄️ **Bouclier de givre** : votre DEF augmente de **3** pour 2 tours (DEF : ${player.def}).`);
      }
    },
  },
};
