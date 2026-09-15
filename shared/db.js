/**
 * SQLite compatibility wrapper using sql.js (pure JavaScript, no native build required).
 * 
 * This module provides a better-sqlite3-compatible API on top of sql.js,
 * so all existing service code works without changes.
 * 
 * Why sql.js over better-sqlite3:
 * - No native compilation required (no Visual Studio C++ build tools)
 * - Works on any Node.js version without prebuild binaries
 * - Same SQLite engine (compiled to WebAssembly)
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let SQL = null;

/**
 * Wrapper that provides a better-sqlite3-compatible synchronous API over sql.js.
 */
class DatabaseWrapper {
  constructor(dbPath) {
    this._dbPath = dbPath;
    this._db = null;
    this._dirty = false;

    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      this._db = new SQL.Database(buffer);
    } else {
      this._db = new SQL.Database();
    }

    // Save on clean exit
    process.on('exit', () => this._save());
    process.on('SIGINT', () => { this._save(); process.exit(); });
  }

  _save() {
    if (!this._db || this._inTransaction) return;
    try {
      const dir = path.dirname(this._dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = this._db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this._dbPath, buffer);
    } catch (err) {
      console.error('Database save error:', err.message);
    }
  }

  /**
   * Execute SQL statements (CREATE TABLE, INSERT, etc.)
   */
  exec(sql) {
    this._db.run(sql);
    this._save();
    return this;
  }

  /**
   * Set pragma values (compatibility with better-sqlite3).
   */
  pragma(pragmaStr) {
    try {
      this._db.run(`PRAGMA ${pragmaStr}`);
    } catch (e) {
      // Some pragmas (like journal_mode=WAL) are not supported in sql.js - ignore
    }
    return this;
  }

  /**
   * Prepare a SQL statement — returns a StatementWrapper.
   */
  prepare(sql) {
    return new StatementWrapper(this, sql);
  }

  /**
   * Create a transaction function (compatible with better-sqlite3's transaction API).
   */
  transaction(fn) {
    const self = this;
    return function (...args) {
      let startedTransaction = false;
      try {
        self._db.run('BEGIN TRANSACTION');
        startedTransaction = true;
        self._inTransaction = true;
      } catch (e) {
        // Already in transaction, just proceed
      }
      try {
        const result = fn(...args);
        if (startedTransaction) {
          self._inTransaction = false;
          self._db.run('COMMIT');
          self._save();
        }
        return result;
      } catch (err) {
        if (startedTransaction) {
          self._inTransaction = false;
          try { self._db.run('ROLLBACK'); } catch(e){}
        }
        throw err;
      }
    };
  }

  close() {
    this._save();
    if (this._db) {
      this._db.close();
      this._db = null;
    }
  }
}

/**
 * Statement wrapper providing better-sqlite3-compatible .run(), .get(), .all() methods.
 */
class StatementWrapper {
  constructor(dbWrapper, sql) {
    this._dbWrapper = dbWrapper;
    this._sql = sql;
  }

  /**
   * Execute the statement with parameters, returning { changes, lastInsertRowid }.
   */
  run(...params) {
    const flatParams = this._flattenParams(params);
    const stmt = this._dbWrapper._db.prepare(this._sql);
    let changes = 0;
    let lastInsertRowid = 0;
    try {
      stmt.bind(flatParams);
      stmt.step();
      changes = this._dbWrapper._db.getRowsModified();
      
      const res = this._dbWrapper._db.exec('SELECT last_insert_rowid()');
      if (res.length > 0 && res[0].values.length > 0) {
        lastInsertRowid = res[0].values[0][0];
      }
    } catch(e) {
      console.error('[DB] Error in run:', e.message);
    } finally {
      stmt.free();
    }
    
    this._dbWrapper._save();
    console.log(`[DB] run: ${this._sql}`);
    console.log(`[DB] params: ${JSON.stringify(flatParams)}`);
    console.log(`[DB] changes: ${changes}`);

    return { changes, lastInsertRowid };
  }

  /**
   * Execute the statement and return the first row as an object, or undefined.
   */
  get(...params) {
    const flatParams = this._flattenParams(params);
    const stmt = this._dbWrapper._db.prepare(this._sql);
    stmt.bind(flatParams);

    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      stmt.free();
      const row = {};
      columns.forEach((col, i) => { row[col] = values[i]; });
      return row;
    }
    stmt.free();
    return undefined;
  }

  /**
   * Execute the statement and return all rows as an array of objects.
   */
  all(...params) {
    const flatParams = this._flattenParams(params);
    const results = [];

    const stmt = this._dbWrapper._db.prepare(this._sql);
    stmt.bind(flatParams);

    while (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      const row = {};
      columns.forEach((col, i) => { row[col] = values[i]; });
      results.push(row);
    }
    stmt.free();
    return results;
  }

  _flattenParams(params) {
    if (params.length === 0) return [];
    let p = params;
    if (params.length === 1 && Array.isArray(params[0])) {
      p = params[0];
    }
    return p.map(val => val === undefined ? null : val);
  }
}

/**
 * Create or open a SQLite database (synchronous, compatible with better-sqlite3 API).
 * @param {string} dbPath - Path to the .db file
 * @returns {DatabaseWrapper}
 */
function createDb(dbPath) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!SQL) {
    throw new Error('sql.js not initialized. Call initializeDb() first.');
  }

  return new DatabaseWrapper(dbPath);
}

/**
 * Initialize sql.js WASM module. Must be called once before createDb().
 * Returns a promise.
 */
async function initializeDb() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

/**
 * Synchronous createDb — requires initializeDb() to have been called first.
 */
function createDbSync(dbPath) {
  if (!SQL) {
    throw new Error('sql.js not initialized. Call await initializeDb() before createDbSync().');
  }
  return createDb(dbPath);
}

/**
 * Initialize the shared audit_log table in a given database.
 */
function initAuditTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor TEXT NOT NULL,
      actor_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      department TEXT,
      before_state TEXT,
      after_state TEXT,
      metadata TEXT,
      ip_address TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  return db;
}

/**
 * Initialize the exceptions table for data-quality failures.
 */
function initExceptionsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      raw_data TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      retry_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      resolved_at TEXT
    )
  `);
  return db;
}

module.exports = { createDb, createDbSync, initializeDb, initAuditTable, initExceptionsTable };
