const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');
const { auditMiddleware } = require('@sih/shared/audit');

const PORT = process.env.PORT || 3003;
const DB_PATH = path.join(__dirname, 'data', 'dept-c.db');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

async function main() {
  await initializeDb();
  
  // Initialize database
  const db = createDb(DB_PATH);
  initAuditTable(db);
  initExceptionsTable(db);

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS beneficiaries (
      beneficiary_code TEXT PRIMARY KEY,
      applicant_name TEXT,
      date_of_birth TEXT,
      contact_no TEXT,
      email_id TEXT,
      residential_address TEXT,
      registration_date TEXT
    );

    CREATE TABLE IF NOT EXISTS complaints (
      complaint_id TEXT PRIMARY KEY,
      beneficiary_code TEXT,
      category TEXT,
      subject TEXT,
      description TEXT,
      resolution_status TEXT,
      filed_on TEXT,
      last_updated TEXT,
      assigned_to TEXT,
      FOREIGN KEY(beneficiary_code) REFERENCES beneficiaries(beneficiary_code)
    );
  `);

  

  const app = express();
  app.use(cors());
  app.use(morgan('dev'));
  app.use(express.json());

  // Pass DB to routes
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Audit middleware
  app.use(auditMiddleware(db));

  // Routes
  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'dept-c' }));
  app.use('/beneficiaries', require('./routes/beneficiaries'));
  app.use('/complaints', require('./routes/complaints'));

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, () => {
    console.log(`Dept C service running on port ${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
