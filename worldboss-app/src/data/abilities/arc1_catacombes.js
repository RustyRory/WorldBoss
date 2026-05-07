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
    resolve(enemy, _player, logs, ctx) {
      const MAX_ENEMIES = 4;
      const enemies     = ctx?.enemies ?? [];
      const aliveCount  = enemies.filter((e) => e.hp > 0).length;
      const slots       = Math.max(0, MAX_ENEMIES - aliveCount);

      if (slots === 0) {
        const heal = 20;
        enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
        logs.push(`💀 **${enemy.name}** tente d'**Invoquer des squelettes** mais le champ est plein ! Il récupère **${heal}** HP.`);
        return;
      }

      const { ENEMIES } = require('../enemies');
      const tpl = ENEMIES['skeleton'];
      for (let i = 0; i < slots; i++) {
        enemies.push({ ...tpl, hp: tpl.hp, maxHp: tpl.maxHp ?? tpl.hp, stunned: false, dots: [] });
      }
      logs.push(`💀 **${enemy.name}** **Invoque ${slots} squelette${slots > 1 ? 's' : ''}** ! ${slots} ennemi${slots > 1 ? 's entrent' : ' entre'} sur le champ de bataille.`);
    },
  },

  dark_ritual: {
    name: 'Rituel des ténèbres',
    emoji: '🩸',
    resolve(enemy, _player, logs, ctx) {
      const enemies    = ctx?.enemies ?? [];
      const allyCount  = enemies.filter((e) => e !== enemy && e.hp > 0).length;
      const healTable  = [0, 5, 10, 20]; // 0 / 1 / 2 / 3+ alliés
      const heal       = healTable[Math.min(allyCount, 3)];

      if (heal === 0) {
        logs.push(`🩸 **${enemy.name}** tente un **Rituel des ténèbres** mais est seul… aucun effet.`);
        return;
      }
      enemy.hp = Math.min(enemy.maxHp, enemy.hp + heal);
      logs.push(`🩸 **${enemy.name}** effectue un **Rituel des ténèbres** et récupère **${heal}** HP (${allyCount} allié${allyCount > 1 ? 's' : ''} sur le champ).`);
    },
  },

  necromancer_power: {
    name: 'Pouvoir nécromantique',
    emoji: '💀',
    resolve(enemy, player, logs, ctx) {
      if (Math.random() < 0.5) {
        module.exports.raise_skeletons.resolve(enemy, player, logs, ctx);
      } else {
        module.exports.dark_ritual.resolve(enemy, player, logs, ctx);
      }
    },
  },
};
