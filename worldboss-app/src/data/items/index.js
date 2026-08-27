'use strict';

const weapons     = require('./weapons');
const shields     = require('./shields');
const armors      = require('./armors');
const helmets     = require('./helmets');
const gloves      = require('./gloves');
const boots       = require('./boots');
const belts       = require('./belts');
const amulets     = require('./amulets');
const rings       = require('./rings');
const consumables = require('./consumables');

const ITEMS = {
  ...weapons,
  ...shields,
  ...armors,
  ...helmets,
  ...gloves,
  ...boots,
  ...belts,
  ...amulets,
  ...rings,
  ...consumables,
};

module.exports = { ITEMS };
