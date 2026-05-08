'use strict';

const weapons     = require('./weapons');
const armors      = require('./armors');
const helmets     = require('./helmets');
const boots       = require('./boots');
const accessories = require('./accessories');
const consumables = require('./consumables');

const ITEMS = {
  ...weapons,
  ...armors,
  ...helmets,
  ...boots,
  ...accessories,
  ...consumables,
};

module.exports = { ITEMS };
