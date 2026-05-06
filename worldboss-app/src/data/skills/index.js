'use strict';

const offensive = require('./offensive');
const defensive = require('./defensive');
const support = require('./support');

const SKILLS = {
  ...offensive,
  ...defensive,
  ...support,
};

module.exports = { SKILLS };
