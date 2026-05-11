'use strict';

// All tunable combat mechanics constants.
// Changing a value here propagates to every engine and service that uses it.
const COMBAT_CONFIG = {
  // Damage formula: ATK × mult × (BASE / (BASE + DEF))
  DEF_MITIGATION_BASE: 100,

  // Critical hit multiplier applied when a crit triggers
  DEFAULT_CRIT_MULT: 1.5,

  // SPD randomness for initiative: final initiative = spd + rand * spd * VARIANCE
  INITIATIVE_RNG_VARIANCE: 0.1,

  // Flee chance: BASE + (playerSpd / (playerSpd + enemySpd)) * MODIFIER
  FLEE_BASE_CHANCE:  0.4,
  FLEE_SPD_MODIFIER: 0.3,

  // Enemy AI: random integer in [0, CHOICES[ — 0=attack, 1=ability, 2=rest
  ENEMY_AI_CHOICES: 3,

  // Fraction of maxHP an enemy recovers when it chooses to rest
  ENEMY_REST_HEAL_PCT: 0.15,

  // Probability an NPC ally chooses to rest instead of attacking
  ALLY_REST_CHANCE: 0.33,

  // Fraction of maxHP an NPC ally recovers when it rests
  ALLY_REST_HEAL_PCT: 0.15,

  // HP recovered between dungeon rooms (fraction of player maxHP)
  ROOM_HEAL_PCT: 0.15,

  // Minimum HP guaranteed by the between-room heal
  MIN_ROOM_HEAL_HP: 5,
};

module.exports = { COMBAT_CONFIG };
