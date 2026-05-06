'use strict';

module.exports = {
  precise_shot: {
    name: 'Tir précis',
    emoji: '🏹',
    resolve(enemy, player, logs) {
      const raw = enemy.atk * (100 / (100 + player.def * 0.5));
      const dmg = Math.max(1, Math.round(raw));
      player.hp -= dmg;
      logs.push(`🏹 **${enemy.name}** utilise **Tir précis** et inflige **${dmg}** dégâts (ignore 50% de votre DEF).`);
    },
  },

  fireball: {
    name: 'Boule de feu',
    emoji: '🔥',
    resolve(enemy, player, logs) {
      const base = Math.round(enemy.atk * 1.8);
      const defReduction = Math.floor(player.def * 0.7);
      const dmg = Math.max(1, base - defReduction);
      player.hp -= dmg;
      logs.push(`🔥 **${enemy.name}** lance une **Boule de feu** et inflige **${dmg}** dégâts (ignore 30% DEF).`);
    },
  },

  shield_bash: {
    name: 'Coup de bouclier',
    emoji: '🛡️',
    resolve(enemy, player, logs) {
      const dmg = Math.max(1, enemy.atk - player.def);
      player.hp -= dmg;
      player.stunned = true;
      logs.push(`🛡️ **${enemy.name}** utilise **Coup de bouclier** et inflige **${dmg}** dégâts. Vous êtes étourdi pour 1 tour !`);
    },
  },

  war_cry: {
    name: 'Cri de guerre',
    emoji: '⚔️',
    resolve(enemy, _player, logs) {
      enemy.atk += 6;
      logs.push(`⚔️ **${enemy.name}** pousse un **Cri de guerre** ! Son ATK augmente de 6 (total : ${enemy.atk}).`);
    },
  },

  bone_shield: {
    name: 'Bouclier d\'os',
    emoji: '🦴',
    resolve(enemy, _player, logs) {
      enemy.def += 8;
      logs.push(`🦴 **${enemy.name}** invoque un **Bouclier d'os** ! Sa DEF augmente de 8 (total : ${enemy.def}).`);
    },
  },

  raise_skeletons: {
    name: 'Invoquer des squelettes',
    emoji: '💀',
    resolve(enemy, _player, logs) {
      const heal = 30;
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
      logs.push(`💀 **${enemy.name}** **Invoque des squelettes** ! Il récupère **${heal}** HP (HP : ${enemy.hp}/${enemy.maxHp}).`);
    },
  },
};
