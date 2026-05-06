'use strict';

module.exports = {
  life_drain: {
    name: 'Drain de vie',
    emoji: '🩸',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 1.2);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      const healAmt = Math.floor(dmg * 0.5);
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + healAmt);
      logs.push(`🩸 **${enemy.name}** utilise **Drain de vie** ! Inflige **${dmg}** dégâts et se soigne de **${healAmt}** HP (HP : ${enemy.hp}/${enemy.maxHp}).`);
    },
  },

  wail: {
    name: 'Hurlement',
    emoji: '😱',
    resolve(enemy, player, logs) {
      const debuffVal = 8;
      player.atk -= debuffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'atk', value: -debuffVal, turns: 3 }];
      logs.push(`😱 **${enemy.name}** pousse un **Hurlement** ! Votre ATK est réduite de ${debuffVal} pour 3 tours (ATK : ${player.atk}).`);
    },
  },

  fire_breath: {
    name: 'Souffle de feu',
    emoji: '🐉',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 1.7);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      const dot = { id: 'fire_breath', label: 'Brûlure Draconique', value: 10, turns: 2 };
      const existing = (player.dots ?? []).findIndex((d) => d.id === 'fire_breath');
      if (existing !== -1) {
        player.dots[existing] = dot;
      } else {
        player.dots = [...(player.dots ?? []), dot];
      }
      logs.push(`🐉 **${enemy.name}** crache un **Souffle de feu** ! **${dmg}** dégâts + Brûlure Draconique (10 dégâts/tour, 2 tours).`);
    },
  },

  charm: {
    name: 'Charme',
    emoji: '💕',
    resolve(enemy, player, logs) {
      const debuffVal = -100;
      player.spd += debuffVal;
      player.buffs = [...(player.buffs ?? []), { stat: 'spd', value: debuffVal, turns: 1 }];
      logs.push(`💕 **${enemy.name}** vous **Charme** ! Vous êtes subjugué et ne pouvez pas agir ce tour (SPD temporairement réduite).`);
    },
  },

  hell_cry: {
    name: 'Cri infernal',
    emoji: '😈',
    resolve(enemy, _player, logs) {
      enemy.atk += 15;
      logs.push(`😈 **${enemy.name}** pousse un **Cri infernal** ! Son ATK augmente de 15 (total : ${enemy.atk}).`);
    },
  },

  inferno: {
    name: 'Inferno',
    emoji: '🌋',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 2.5);
      const dmg = Math.max(1, base - player.def);
      player.hp -= dmg;
      const dot = { id: 'inferno', label: 'Inferno', value: 20, turns: 3 };
      const existing = (player.dots ?? []).findIndex((d) => d.id === 'inferno');
      if (existing !== -1) {
        player.dots[existing] = dot;
      } else {
        player.dots = [...(player.dots ?? []), dot];
      }
      logs.push(`🌋 **${enemy.name}** déchaîne l'**Inferno** ! **${dmg}** dégâts + Inferno (20 dégâts/tour, 3 tours).`);
    },
  },
};
