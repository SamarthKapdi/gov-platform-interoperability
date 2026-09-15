/**
 * Shared module index — re-exports all shared utilities.
 */

const db = require('./db');
const audit = require('./audit');
const auth = require('./auth');
const validation = require('./validation');

module.exports = {
  ...db,
  ...audit,
  ...auth,
  ...validation,
};
