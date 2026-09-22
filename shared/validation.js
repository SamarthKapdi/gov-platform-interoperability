/**
 * Data validation utility using AJV (JSON Schema validator).
 * Validates incoming data against canonical schemas, routing failures
 * to the exceptions table instead of silently passing bad data.
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, coerceTypes: false, strict: true });
addFormats(ajv);

// Load canonical schemas
const citizenSchema = require('../schemas/citizen.json');
const applicationSchema = require('../schemas/application.json');
const grievanceSchema = require('../schemas/grievance.json');

const validators = {
  citizen: ajv.compile(citizenSchema),
  application: ajv.compile(applicationSchema),
  grievance: ajv.compile(grievanceSchema),
};

/**
 * Validate data against a canonical schema.
 * @param {string} schemaName - 'citizen', 'application', or 'grievance'
 * @param {object} data - Data to validate
 * @returns {{ valid: boolean, errors: string[] | null }}
 */
function validate(schemaName, data) {
  const validator = validators[schemaName];
  if (!validator) {
    return { valid: false, errors: [`Unknown schema: ${schemaName}`] };
  }
  const valid = validator(data);
  if (!valid) {
    const errors = validator.errors.map(e => {
      const path = e.instancePath || '(root)';
      return `${path}: ${e.message}`;
    });
    return { valid: false, errors };
  }
  return { valid: true, errors: null };
}

/**
 * Log a data quality exception to the exceptions table.
 * @param {import('better-sqlite3').Database} db
 * @param {object} exception
 */
function logException(db, exception) {
  const stmt = db.prepare(`
    INSERT INTO exceptions (source, entity_type, entity_id, error_type, error_message, raw_data, status)
    VALUES (?, ?, ?, ?, ?, ?, 'OPEN')
  `);
  stmt.run(
    exception.source,
    exception.entityType,
    exception.entityId || null,
    exception.errorType,
    exception.errorMessage,
    exception.rawData ? JSON.stringify(exception.rawData) : null
  );
}

/**
 * Quick field-level checks commonly needed by adapters.
 */
const checks = {
  isValidMobile: (val) => /^[6-9][0-9]{9}$/.test(val),
  isValidAadhaar: (val) => /^[2-9][0-9]{11}$/.test(val),
  isValidDate: (val) => !isNaN(Date.parse(val)),
  isNonEmpty: (val) => val !== null && val !== undefined && String(val).trim().length > 0,
  normalizeDate: (val) => {
    // Accept multiple date formats and normalize to YYYY-MM-DD
    const d = new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  },
  normalizeName: (val) => {
    if (!val) return null;
    return String(val).trim().replace(/\s+/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
};

module.exports = { validate, logException, checks };
