const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { initializeDb, createDb } = require('@sih/shared/db');
const { createAuthRoutes } = require('./routes/auth');
const { JWT_ISSUER } = require('@sih/shared/auth');

const PORT = 3020;
const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

async function main() {
  await initializeDb();
  
  const dbPath = path.join(dataDir, 'identity.db');
  const db = createDb(dbPath);

  // Initialize DB schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      email TEXT,
      mobile TEXT,
      role TEXT,
      department TEXT,
      is_active INTEGER,
      created_at TEXT
    )
  `);

  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'UP', service: 'identity-service' });
  });

  // OIDC discovery document
  app.get('/.well-known/openid-configuration', (req, res) => {
    res.json({
      issuer: JWT_ISSUER || 'sih-26129-identity-service',
      authorization_endpoint: `http://localhost:${PORT}/auth/login`,
      token_endpoint: `http://localhost:${PORT}/auth/login`,
      userinfo_endpoint: `http://localhost:${PORT}/auth/userinfo`,
      jwks_uri: `http://localhost:${PORT}/.well-known/jwks.json`,
      response_types_supported: ['code', 'token', 'id_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['HS256']
    });
  });

  // Internal users API (for MDM matching)
  app.get('/users', (req, res) => {
    try {
      const { name } = req.query;
      if (name) {
        const users = db.prepare('SELECT id, username, name, email, role, department FROM users WHERE name = ?').all(name);
        res.json(users);
      } else {
        const users = db.prepare('SELECT id, username, name, email, role, department FROM users').all();
        res.json(users);
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Auth routes
  app.use('/', createAuthRoutes(db));

  app.listen(PORT, () => {
    console.log(`Identity service running on port ${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
