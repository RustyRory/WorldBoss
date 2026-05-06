'use strict';

const arc1 = require('./arc1_catacombes');
const arc2 = require('./arc2_chateau');
const arc3 = require('./arc3_bandits');
const arc4 = require('./arc4_desert_assassins');
const arc5 = require('./arc5_desert_monstres');
const arc6 = require('./arc6_desert_steampunk');
const arc7 = require('./arc7_desert_palais');
const arc8 = require('./arc8_enfers');

const ENEMIES = {
  ...arc1,
  ...arc2,
  ...arc3,
  ...arc4,
  ...arc5,
  ...arc6,
  ...arc7,
  ...arc8,
};

module.exports = { ENEMIES };
