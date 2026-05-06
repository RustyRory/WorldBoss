'use strict';

module.exports = {
  steam_blast: {
    name: 'Explosion de vapeur',
    emoji: '💨',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 1.4);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      logs.push(`💨 **${enemy.name}** utilise **Explosion de vapeur** et inflige **${dmg}** dégâts.`);
    },
  },

  oil_slick: {
    name: 'Nappe d\'huile',
    emoji: '🛢️',
    resolve(enemy, player, logs) {
      const debuffVal = 5;
      player.spd -= debuffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'spd', value: -debuffVal, turns: 3 }];
      logs.push(`🛢️ **${enemy.name}** déverse une **Nappe d'huile** ! Votre SPD est réduite de ${debuffVal} pour 3 tours (SPD : ${player.spd}).`);
    },
  },

  overheat: {
    name: 'Surchauffe',
    emoji: '🌡️',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 2.0);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      const selfDmg = Math.floor(enemy.maxHp * 0.1);
      enemy.hp -= selfDmg;
      logs.push(`🌡️ **${enemy.name}** utilise **Surchauffe** ! Inflige **${dmg}** dégâts mais se blesse pour **${selfDmg}** HP (HP : ${enemy.hp}/${enemy.maxHp}).`);
    },
  },

  steam_shield: {
    name: 'Bouclier de vapeur',
    emoji: '🛡️',
    resolve(enemy, _player, logs) {
      enemy.def += 12;
      logs.push(`🛡️ **${enemy.name}** active son **Bouclier de vapeur** ! Sa DEF augmente de 12 (total : ${enemy.def}).`);
    },
  },

  shield_wall: {
    name: 'Mur de boucliers',
    emoji: '🏰',
    resolve(enemy, _player, logs) {
      enemy.def += 10;
      logs.push(`🏰 **${enemy.name}** forme un **Mur de boucliers** ! Sa DEF augmente de 10 (total : ${enemy.def}).`);
    },
  },

  royal_command: {
    name: 'Commandement royal',
    emoji: '👑',
    resolve(enemy, _player, logs) {
      enemy.atk += 8;
      logs.push(`👑 **${enemy.name}** lance un **Commandement royal** ! Son ATK augmente de 8 (total : ${enemy.atk}).`);
    },
  },

  hellfire: {
    name: 'Feu infernal',
    emoji: '🔥',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 2.0);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      const dot = { id: 'hellfire', label: 'Feu Infernal', value: 15, turns: 3 };
      const existing = (player.dots ?? []).findIndex((d) => d.id === 'hellfire');
      if (existing !== -1) {
        player.dots[existing] = dot;
      } else {
        player.dots = [...(player.dots ?? []), dot];
      }
      logs.push(`🔥 **${enemy.name}** déchaîne le **Feu Infernal** ! **${dmg}** dégâts + 15 dégâts/tour pendant 3 tours.`);
    },
  },
};
