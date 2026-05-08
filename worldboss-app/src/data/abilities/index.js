'use strict';

const arc1 = require('./arc1_catacombes');
const arc2 = require('./arc2_chateau');

const ABILITIES = {
  ...arc1,
  ...arc2,
};

module.exports = { ABILITIES };
