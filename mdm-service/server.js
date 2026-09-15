const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { initializeDb, createDb } = require('@sih/shared/db');
const { v4: uuidv4 } = require('uuid');

const mdmRoutes = require('./routes/mdm');

const app = express();
const PORT = 3030;

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
  const seedData = () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM golden_citizens').get().count;
    if (count === 0) {
      const insertCitizen = db.prepare(`
        INSERT INTO golden_citizens (canonical_id, name, date_of_birth, mobile, confidence_score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      
      const insertLink = db.prepare(`
        INSERT INTO department_links (canonical_id, department, department_id, department_id_field, linked_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);

      db.transaction(() => {
        // Citizen 1
        const id1 = '12345678-1234-1234-1234-123456789012';
        insertCitizen.run(id1, 'Rajesh Kumar Sharma', '1990-05-15', '9876543210', 1.0);
        insertLink.run(id1, 'DEPT_A', 'SKB-1001', 'citizen_uid');
        insertLink.run(id1, 'DEPT_B', 'EMP-2001', 'applicant_id');
        insertLink.run(id1, 'DEPT_C', 'GRV-3001', 'beneficiary_code');

        // Citizen 2
        const id2 = uuidv4();
        insertCitizen.run(id2, 'Priya Deepak Patil', '1995-08-22', '8765432109', 1.0);
        insertLink.run(id2, 'DEPT_A', 'SKB-1002', 'citizen_uid');
        insertLink.run(id2, 'DEPT_B', 'EMP-2002', 'applicant_id');
        insertLink.run(id2, 'DEPT_C', 'GRV-3002', 'beneficiary_code');
      })();
      console.log('Seed data inserted');
    }
  };

  seedData();

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
