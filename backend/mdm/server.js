const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { initializeDb, createDb } = require('@sih/shared/db');
const { v4: uuidv4 } = require('uuid');

const mdmRoutes = require('./routes/mdm');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

async function main() {
  await initializeDb();
  
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = createDb(path.join(dataDir, 'mdm.db'));

  // Init schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS golden_citizens (
      canonical_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT,
      address TEXT,
      confidence_score REAL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS department_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canonical_id TEXT,
      department TEXT NOT NULL,
      department_id TEXT NOT NULL,
      department_id_field TEXT NOT NULL,
      linked_at TEXT,
      FOREIGN KEY(canonical_id) REFERENCES golden_citizens(canonical_id),
      UNIQUE(department, department_id)
    );
  `);

  // Seed data
  
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'mdm-service' }));
  app.use('/', mdmRoutes);

  app.listen(PORT, () => {
    console.log(`MDM Service running on http://localhost:${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
