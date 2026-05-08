'use strict';

module.exports = {
  fire_dot: {
    name: 'Brûlure',
    resolve(player, target, logs) {
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'fire_dot');
      const dot = { id: 'fire_dot', label: 'Brûlure', value: 2, turns: 2 };
      if (existing !== -1) {
        target.dots[existing] = dot;
      } else {
        target.dots = [...(target.dots ?? []), dot];
      }
      logs.push(`🔥 **Brûlure** : ${target.name} est enflammé pour **2 tours** (2 dégâts/tour).`);
    },
  },

  poison_dot: {
    name: 'Poison',
    resolve(player, target, logs) {
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'poison_dot');
      const dot = { id: 'poison_dot', label: 'Poison', value: 1, turns: 3 };
      if (existing !== -1) {
        target.dots[existing] = dot;
      } else {
        target.dots = [...(target.dots ?? []), dot];
      }
      logs.push(`🐍 **Poison** : ${target.name} est empoisonné pour **3 tours** (1 dégât/tour).`);
    },
  },

  bleed: {
    name: 'Saignement',
    resolve(player, target, logs) {
      const existing = (target.dots ?? []).findIndex((d) => d.id === 'bleed');
      const dot = { id: 'bleed', label: 'Saignement', value: 3, turns: 3 };
      if (existing !== -1) {
        target.dots[existing] = dot;
      } else {
        target.dots = [...(target.dots ?? []), dot];
      }
      logs.push(`🩸 **Saignement** : ${target.name} saigne pour **3 tours** (3 dégâts/tour).`);
    },
  },

  cursed_strike: {
    name: 'Frappe maudite',
    resolve(player, target, logs) {
      target.def = Math.max(0, target.def - 2);
      logs.push(`🔮 **Frappe maudite** : la DEF de ${target.name} est réduite de 2 (DEF : ${target.def}).`);
    },
  },
};
