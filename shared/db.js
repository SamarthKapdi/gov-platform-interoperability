/**
 * Database wrapper supporting both sql.js (SQLite) and pg (PostgreSQL).
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let SQL = null;
let pgPool = null;

class DatabaseWrapper {
  constructor(dbPath) {
    this._dbPath = dbPath;
    this._db = null;
    this._dirty = false;

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      this._db = new SQL.Database(buffer);
    } else {
      this._db = new SQL.Database();
    }

    process.on('exit', () => this._save());
    process.on('SIGINT', () => { this._save(); process.exit(); });
    setInterval(() => this._save(), 1000).unref();
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

  exec(sql) {
    this._db.run(sql);
    this._save();
    return this;
  }

  pragma(pragmaStr) {
    try { this._db.run(`PRAGMA ${pragmaStr}`); } catch (e) {}
    return this;
  }

  prepare(sql) {
    return new StatementWrapper(this, sql);
  }

  transaction(fn) {
    const self = this;
    return function (...args) {
      let startedTransaction = false;
      try {
        self._db.run('BEGIN TRANSACTION');
        startedTransaction = true;
        self._inTransaction = true;
      } catch (e) {}
      
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.then(res => {
            if (startedTransaction) {
              self._inTransaction = false;
              self._db.run('COMMIT');
              self._save();
            }
            return res;
          }).catch(err => {
            if (startedTransaction) {
              self._inTransaction = false;
              try { self._db.run('ROLLBACK'); } catch(e){}
            }
            throw err;
          });
        }
        
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

class StatementWrapper {
  constructor(dbWrapper, sql) {
    this._dbWrapper = dbWrapper;
    this._sql = sql;
  }

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
      throw e;
    } finally {
      stmt.free();
    }
    
    this._dbWrapper._save();
    return { changes, lastInsertRowid };
  }

  get(...params) {
    const flatParams = this._flattenParams(params);
    const stmt = this._dbWrapper._db.prepare(this._sql);
    stmt.bind(flatParams);
    let row = undefined;
    if (stmt.step()) {
      const columns = stmt.getColumnNames();
      const values = stmt.get();
      row = {};
      columns.forEach((col, i) => { row[col] = values[i]; });
    }
    stmt.free();
    return row;
  }

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

// PostgreSQL Wrapper
class PgDatabaseWrapper {
  constructor(dbName) {
    this._dbName = dbName;
    if (!pgPool) {
      const { Pool } = require('pg');
      pgPool = new Pool();
    }
  }

  async exec(sql) {
    await pgPool.query(sql);
    return this;
  }

  pragma(pragmaStr) {
    return this; // Ignore pragmas for Postgres
  }

  prepare(sql) {
    return new PgStatementWrapper(sql);
  }

  transaction(fn) {
    return async function (...args) {
      const client = await pgPool.connect();
      try {
        await client.query('BEGIN');
        
        // Pass the client context so statements use this transaction?
        // Wait, PgStatementWrapper uses the global pool.
        // For a proper transaction, they should use the same client.
        // But the API doesn't pass the db instance to the queries explicitly, they use the wrapper.
        // To keep it simple and match the requirement, we'll store the client globally or thread-local.
        // Let's use a quick hack: set it on the PgStatementWrapper via a static property or just pool if concurrent is not an issue for provisioning scripts.
        // Since node is single-threaded, if we only run one transaction at a time, we can temporarily override pgPool.query.
        
        const originalQuery = pgPool.query;
        pgPool.query = client.query.bind(client);
        
        let result;
        try {
          result = await fn(...args);
        } catch(e) {
          await client.query('ROLLBACK');
          pgPool.query = originalQuery;
          client.release();
          throw e;
        }
        
        await client.query('COMMIT');
        pgPool.query = originalQuery;
        client.release();
        return result;
      } catch (err) {
        throw err;
      }
    };
  }

  close() {
    // No-op or pgPool.end()
  }
}

class PgStatementWrapper {
  constructor(sql) {
    this._sql = sql;
  }

  _convertSql(sql) {
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  }

  async run(...params) {
    const flatParams = this._flattenParams(params);
    const pgSql = this._convertSql(this._sql);
    
    // Convert generic AUTOINCREMENT or last_insert_rowid queries if needed?
    // Not usually needed for standard inserts if returning is not used, but let's support changes.
    const res = await pgPool.query(pgSql, flatParams);
    
    // For lastInsertRowid, postgres usually needs RETURNING id.
    // If not provided, we just return 0.
    return { changes: res.rowCount || 0, lastInsertRowid: 0 };
  }

  async get(...params) {
    const flatParams = this._flattenParams(params);
    const pgSql = this._convertSql(this._sql);
    const res = await pgPool.query(pgSql, flatParams);
    return res.rows[0];
  }

  async all(...params) {
    const flatParams = this._flattenParams(params);
    const pgSql = this._convertSql(this._sql);
    const res = await pgPool.query(pgSql, flatParams);
    return res.rows;
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

function createDb(dbPath) {
  if (process.env.DB_MODE === 'postgres') {
    // Extract db name from path, e.g., 'identity.db' -> 'identity'
    const dbName = path.basename(dbPath, '.db');
    return new PgDatabaseWrapper(dbName);
  }

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!SQL) {
    throw new Error('sql.js not initialized. Call initializeDb() first.');
  }

  return new DatabaseWrapper(dbPath);
}

async function initializeDb() {
  if (process.env.DB_MODE === 'postgres') {
    return; // pg doesn't need wasm init
  }
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

function createDbSync(dbPath) {
  if (process.env.DB_MODE === 'postgres') {
    return createDb(dbPath);
  }
  if (!SQL) {
    throw new Error('sql.js not initialized. Call await initializeDb() before createDbSync().');
  }
  return createDb(dbPath);
}

function initAuditTable(db) {
  const isPg = process.env.DB_MODE === 'postgres';
  const sql = isPg ? `
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
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
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  ` : `
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
  `;
  
  if (isPg) {
    return db.exec(sql); // returns promise
  }
  db.exec(sql);
  return db;
}

function initExceptionsTable(db) {
  const isPg = process.env.DB_MODE === 'postgres';
  const sql = isPg ? `
    CREATE TABLE IF NOT EXISTS exceptions (
      id SERIAL PRIMARY KEY,
      source TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      raw_data TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN',
      retry_count INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      resolved_at TIMESTAMPTZ
    )
  ` : `
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
  `;

  if (isPg) {
    return db.exec(sql);
  }
  db.exec(sql);
  return db;
}

module.exports = { createDb, createDbSync, initializeDb, initAuditTable, initExceptionsTable };
