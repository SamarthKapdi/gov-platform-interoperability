const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');

const PORT = 3001;

async function main() {
  await initializeDb();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  const db = createDb(path.join(__dirname, 'data', 'dept-a.db'));

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS citizens (
      citizen_uid TEXT PRIMARY KEY,
      name TEXT,
      dob TEXT,
      mobile TEXT,
      email TEXT,
      address TEXT,
      created_at TEXT
    )
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      citizen_uid TEXT,
      course_id TEXT,
      course_name TEXT,
      status TEXT,
      applied_at TEXT,
      updated_at TEXT,
      remarks TEXT,
      FOREIGN KEY(citizen_uid) REFERENCES citizens(citizen_uid)
    )
  `);

  // Seed data
  

  // Attach DB to request object
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'dept-a' });
  });

  // Routes
  app.use('/citizens', require('./routes/citizens'));
  app.use('/applications', require('./routes/applications'));

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  app.listen(PORT, () => {
    console.log(`Dept A service running on port ${PORT}`);
  });
}

main().catch(err => { console.error('Failed to start:', err); process.exit(1); });

