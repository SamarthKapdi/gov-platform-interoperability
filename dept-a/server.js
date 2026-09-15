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
  const citizenCount = db.prepare('SELECT COUNT(*) as count FROM citizens').get().count;
  if (citizenCount === 0) {
    const insertCitizen = db.prepare(`
      INSERT INTO citizens (citizen_uid, name, dob, mobile, email, address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertApp = db.prepare(`
      INSERT INTO applications (citizen_uid, course_id, course_name, status, applied_at, updated_at, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();

    db.transaction(() => {
      insertCitizen.run('SKB-1001', 'Rajesh Kumar Sharma', '1990-05-15', '9876543210', 'rajesh.sharma@email.com', 'Delhi', now);
      insertApp.run('SKB-1001', 'C-101', 'Advanced Welding', 'approved', now, now, 'Documents verified');
      insertApp.run('SKB-1001', 'C-102', 'CNC Machining', 'under_review', now, now, 'Pending practical test results');

      insertCitizen.run('SKB-1002', 'Priya Deepak Patil', '1995-08-22', '8765432109', 'priya.patil@email.com', 'Mumbai', now);
      insertApp.run('SKB-1002', 'C-103', 'Data Entry Operator', 'submitted', now, now, '');

      insertCitizen.run('SKB-1003', 'Amit Singh', '1988-11-02', '9871234560', 'amit.singh@email.com', 'Lucknow', now);
      insertApp.run('SKB-1003', 'C-104', 'Electrician', 'verified', now, now, 'Theory passed');

      insertCitizen.run('SKB-1004', 'Sneha Rao', '1992-03-14', '9871234561', 'sneha.rao@email.com', 'Bengaluru', now);
      insertApp.run('SKB-1004', 'C-105', 'Plumbing', 'approved', now, now, 'Certified');

      insertCitizen.run('SKB-1005', 'Karthik N', '1996-07-09', '9871234562', 'karthik.n@email.com', 'Chennai', now);
      insertApp.run('SKB-1005', 'C-101', 'Advanced Welding', 'rejected', now, now, 'Incomplete application');

      insertCitizen.run('SKB-1006', 'Meera Reddy', '1991-01-25', '9871234563', 'meera.reddy@email.com', 'Hyderabad', now);
      insertApp.run('SKB-1006', 'C-106', 'Carpentry', 'under_review', now, now, 'Checking documents');

      insertCitizen.run('SKB-1007', 'Vikram Das', '1985-09-30', '9871234564', 'vikram.das@email.com', 'Kolkata', now);
      insertApp.run('SKB-1007', 'C-107', 'Masonry', 'submitted', now, now, '');
      insertApp.run('SKB-1007', 'C-103', 'Data Entry Operator', 'approved', now, now, 'Certified');

      insertCitizen.run('SKB-1008', 'Anjali Gupta', '1994-12-12', '9871234565', 'anjali.gupta@email.com', 'Pune', now);
      insertApp.run('SKB-1008', 'C-108', 'Retail Sales Associate', 'verified', now, now, 'Interview cleared');

      insertCitizen.run('SKB-1009', 'Rahul Desai', '1993-04-18', '9871234566', 'rahul.desai@email.com', 'Ahmedabad', now);
      insertApp.run('SKB-1009', 'C-102', 'CNC Machining', 'approved', now, now, 'Excellent performance');

      insertCitizen.run('SKB-1010', 'Neha Sharma', '1997-06-05', '9871234567', 'neha.sharma@email.com', 'Jaipur', now);
      insertApp.run('SKB-1010', 'C-109', 'Beautician', 'rejected', now, now, 'Age criteria not met');
      insertApp.run('SKB-1010', 'C-103', 'Data Entry Operator', 'submitted', now, now, '');
    })();
    console.log('Database seeded successfully.');
  }

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
