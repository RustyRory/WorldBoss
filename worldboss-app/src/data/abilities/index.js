'use strict';

const arc1 = require('./arc1_catacombes');
const arc2 = require('./arc2_chateau');
const arc3 = require('./arc3_bandits');
const arc4 = require('./arc4_desert');
const arc6 = require('./arc6_steampunk');
const arc8 = require('./arc8_enfers');

const ABILITIES = {
  ...arc1,
  ...arc2,
  ...arc3,
  ...arc4,
  ...arc6,
  ...arc8,
};

module.exports = { ABILITIES };
