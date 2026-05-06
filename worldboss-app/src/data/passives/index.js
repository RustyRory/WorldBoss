'use strict';

const offensive = require('./offensive');
const defensive = require('./defensive');

const PASSIVES = {
  ...offensive,
  ...defensive,
};

module.exports = { PASSIVES };
