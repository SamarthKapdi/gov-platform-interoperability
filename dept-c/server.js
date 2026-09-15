const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');
const { auditMiddleware } = require('@sih/shared/audit');

const PORT = 3003;
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

  // Seed data
  const count = db.prepare('SELECT COUNT(*) as c FROM beneficiaries').get().c;
  if (count === 0) {
    const insertBeneficiary = db.prepare(`
      INSERT INTO beneficiaries (beneficiary_code, applicant_name, date_of_birth, contact_no, email_id, residential_address, registration_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertComplaint = db.prepare(`
      INSERT INTO complaints (complaint_id, beneficiary_code, category, subject, description, resolution_status, filed_on, last_updated, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const beneficiaries = [
      ['GRV-3001', 'Rajesh Kumar Sharma', '1990-05-15', '9876543210', 'rajesh@example.com', '123 Main St, Mumbai', '2023-01-10'],
      ['GRV-3002', 'Priya Deepak Patil', '1995-08-22', '8765432109', 'priya@example.com', '456 MG Road, Pune', '2023-02-15'],
      ['GRV-3003', 'Amit Singh', '1988-11-30', '7654321098', 'amit@example.com', '789 Park St, Delhi', '2023-03-20'],
      ['GRV-3004', 'Sneha Desai', '1992-04-12', '6543210987', 'sneha@example.com', '101 Ring Road, Ahmedabad', '2023-04-05'],
      ['GRV-3005', 'Vikram Malhotra', '1985-07-18', '5432109876', 'vikram@example.com', '202 South Ext, Chennai', '2023-05-12'],
      ['GRV-3006', 'Neha Gupta', '1998-09-25', '4321098765', 'neha@example.com', '303 East Colony, Kolkata', '2023-06-18'],
      ['GRV-3007', 'Ravi Verma', '1982-12-05', '3210987654', 'ravi@example.com', '404 West Avenue, Hyderabad', '2023-07-22'],
      ['GRV-3008', 'Kavita Joshi', '1994-03-08', '2109876543', 'kavita@example.com', '505 North Block, Bangalore', '2023-08-11'],
      ['GRV-3009', 'Sanjay Kumar', '1989-10-14', '1098765432', 'sanjay@example.com', '606 Center Point, Lucknow', '2023-09-09'],
      ['GRV-3010', 'Pooja Reddy', '1996-01-28', '9988776655', 'pooja@example.com', '707 Hill View, Jaipur', '2023-10-30']
    ];

    const complaints = [
      ['CMP-3001', 'GRV-3001', 'service_delay', 'Delayed skill certificate issuance', 'I have been waiting for my certificate for 3 months', 'filed', '2023-11-01', '2023-11-01', null],
      ['CMP-3002', 'GRV-3002', 'document_issue', 'Employment registration document not received', 'Missing registration document', 'resolved', '2023-11-05', '2023-11-20', 'Officer A'],
      ['CMP-3003', 'GRV-3003', 'payment_issue', 'Subsidy not credited', 'Did not receive the monthly subsidy', 'under_review', '2023-11-10', '2023-11-12', 'Officer B'],
      ['CMP-3004', 'GRV-3004', 'staff_conduct', 'Rude behavior by staff', 'Staff at desk 4 was very rude', 'in_progress', '2023-11-15', '2023-11-16', 'Officer C'],
      ['CMP-3005', 'GRV-3005', 'other', 'Portal not working', 'Cannot access the beneficiary portal', 'closed', '2023-11-18', '2023-11-19', 'IT Dept'],
      ['CMP-3006', 'GRV-3006', 'service_delay', 'Application pending for long time', 'My application is pending since January', 'reopened', '2023-11-20', '2023-11-25', 'Officer A'],
      ['CMP-3007', 'GRV-3007', 'document_issue', 'Incorrect name in document', 'My name is misspelled in the issued document', 'filed', '2023-11-22', '2023-11-22', null],
      ['CMP-3008', 'GRV-3008', 'payment_issue', 'Wrong amount credited', 'Received less amount than expected', 'under_review', '2023-11-25', '2023-11-26', 'Officer B'],
      ['CMP-3009', 'GRV-3009', 'staff_conduct', 'No response from officer', 'Officer is not responding to calls', 'in_progress', '2023-11-28', '2023-11-29', 'Officer C'],
      ['CMP-3010', 'GRV-3010', 'service_delay', 'Delayed processing', 'Processing is taking too long', 'resolved', '2023-12-01', '2023-12-10', 'Officer A'],
      ['CMP-3011', 'GRV-3001', 'other', 'Address update failed', 'Cannot update my address online', 'filed', '2023-12-05', '2023-12-05', null],
      ['CMP-3012', 'GRV-3002', 'service_delay', 'No update on grievance', 'No update on my previous grievance', 'under_review', '2023-12-10', '2023-12-11', 'Officer B']
    ];

    db.transaction(() => {
      beneficiaries.forEach(b => insertBeneficiary.run(...b));
      complaints.forEach(c => insertComplaint.run(...c));
    })();
    console.log('Seed data inserted');
  }

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
