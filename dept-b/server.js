const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

let isOutageSimulated = false;

app.post('/admin/simulate-outage', (req, res) => {
  isOutageSimulated = true;
  res.json({ success: true });
});

app.post('/admin/restore', (req, res) => {
  isOutageSimulated = false;
  res.json({ success: true });
});

app.use((req, res, next) => {
  if (isOutageSimulated && !req.path.startsWith('/admin')) {
    return res.status(503).json({ error: 'Service Unavailable' });
  }
  next();
});

async function main() {
  await initializeDb();

  // Ensure data directory exists
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'dept-b.db');
  const db = createDb(dbPath);

  // Initialize shared tables
  initAuditTable(db);
  initExceptionsTable(db);

  // Initialize service tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS applicants (
      applicant_id TEXT PRIMARY KEY,
      full_name TEXT,
      dob TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      registered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id TEXT,
      job_ref_no TEXT,
      job_title TEXT,
      employer TEXT,
      current_status TEXT,
      applied_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id)
    );
  `);

  // Seed data
  const seedData = () => {
    const count = db.prepare('SELECT COUNT(*) as count FROM applicants').get().count;
    if (count === 0) {
      const insertApplicant = db.prepare(`
        INSERT INTO applicants (applicant_id, full_name, dob, phone, email, address, registered_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const applicants = [
        ['EMP-2001', 'Rajesh Kumar Sharma', '1990-05-15', '9876543210', 'rajesh.sharma@example.com', 'Mumbai, MH', '2023-01-10T10:00:00Z'],
        ['EMP-2002', 'Priya Deepak Patil', '1995-08-22', '8765432109', 'priya.patil@example.com', 'Pune, MH', '2023-02-15T11:30:00Z'],
        ['EMP-2003', 'Amit Verma', '1988-11-05', '7654321098', 'amit.v@example.com', 'Nagpur, MH', '2023-03-20T09:15:00Z'],
        ['EMP-2004', 'Neha Gupta', '1992-04-12', '6543210987', 'neha.g@example.com', 'Nashik, MH', '2023-04-10T14:45:00Z'],
        ['EMP-2005', 'Vikram Singh', '1985-09-30', '5432109876', 'vikram.s@example.com', 'Aurangabad, MH', '2023-05-05T16:20:00Z'],
        ['EMP-2006', 'Sneha Desai', '1994-12-18', '4321098765', 'sneha.d@example.com', 'Kolhapur, MH', '2023-06-12T08:10:00Z'],
        ['EMP-2007', 'Rahul Joshi', '1991-07-25', '3210987654', 'rahul.j@example.com', 'Amravati, MH', '2023-07-22T13:55:00Z'],
        ['EMP-2008', 'Pooja Kadam', '1996-03-08', '2109876543', 'pooja.k@example.com', 'Solapur, MH', '2023-08-14T10:30:00Z'],
        ['EMP-2009', 'Suresh Mane', '1989-10-02', '1098765432', 'suresh.m@example.com', 'Jalgaon, MH', '2023-09-01T11:40:00Z'],
        ['EMP-2010', 'Kavita Jadhav', '1993-01-20', '0987654321', 'kavita.j@example.com', 'Latur, MH', '2023-10-18T15:25:00Z']
      ];

      applicants.forEach(app => insertApplicant.run(...app));

      const insertJob = db.prepare(`
        INSERT INTO job_applications (applicant_id, job_ref_no, job_title, employer, current_status, applied_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const jobs = [
        ['EMP-2001', 'JOB-MH-2026-0451', 'CNC Machine Operator', 'Tata Advanced Systems', 'shortlisted', '2023-02-01T10:00:00Z', '2023-02-15T10:00:00Z'],
        ['EMP-2002', 'JOB-MH-2026-0523', 'Data Entry Clerk', 'Maharashtra IT Corp', 'registered', '2023-03-01T11:00:00Z', '2023-03-01T11:00:00Z'],
        ['EMP-2003', 'JOB-MH-2026-0601', 'Software Engineer', 'Tech Mahindra', 'interviewed', '2023-04-05T09:30:00Z', '2023-04-20T14:15:00Z'],
        ['EMP-2004', 'JOB-MH-2026-0612', 'Accountant', 'Bajaj Finserv', 'placed', '2023-05-10T10:45:00Z', '2023-06-01T09:00:00Z'],
        ['EMP-2005', 'JOB-MH-2026-0705', 'Marketing Executive', 'Reliance Retail', 'rejected', '2023-06-15T14:20:00Z', '2023-07-05T16:30:00Z'],
        ['EMP-2006', 'JOB-MH-2026-0810', 'HR Manager', 'L&T', 'shortlisted', '2023-07-20T11:10:00Z', '2023-08-05T10:25:00Z'],
        ['EMP-2007', 'JOB-MH-2026-0922', 'Mechanical Engineer', 'Bharat Forge', 'interviewed', '2023-08-25T13:40:00Z', '2023-09-10T15:15:00Z'],
        ['EMP-2008', 'JOB-MH-2026-1033', 'Customer Support', 'Wipro', 'registered', '2023-09-15T09:50:00Z', '2023-09-15T09:50:00Z'],
        ['EMP-2009', 'JOB-MH-2026-1144', 'Electrician', 'MSEB', 'placed', '2023-10-05T10:30:00Z', '2023-11-01T11:20:00Z'],
        ['EMP-2010', 'JOB-MH-2026-1255', 'Nurse', 'Apollo Hospitals', 'shortlisted', '2023-11-10T14:15:00Z', '2023-11-25T16:00:00Z'],
        ['EMP-2001', 'JOB-MH-2026-0460', 'Welder', 'Godrej', 'registered', '2023-03-10T09:00:00Z', '2023-03-10T09:00:00Z'],
        ['EMP-2002', 'JOB-MH-2026-0540', 'Receptionist', 'Infosys', 'rejected', '2023-04-12T11:30:00Z', '2023-05-02T10:15:00Z']
      ];

      jobs.forEach(job => insertJob.run(...job));
      console.log('Seeded applicants and job applications data');
    }
  };

  seedData();

  // Routes
  const applicantsRouter = require('./routes/applicants')(db);
  const jobsRouter = require('./routes/jobs')(db);

  app.use('/registry/applicants', applicantsRouter);
  app.use('/registry/jobs', jobsRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'dept-b-employment-registry' });
  });

  app.listen(port, () => {
    console.log(`Dept B Employment Registry running on port ${port}`);
  });
}

main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
