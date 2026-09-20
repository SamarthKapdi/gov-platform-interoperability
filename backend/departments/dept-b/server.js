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

// Dummy webhook receiver to acknowledge Event Bus / Dead Letter Queue dispatches

app.post('/api/webhook', async (req, res) => {
  const { event, action, workflowId } = req.body;
  if ((action === 'VERIFY_CITIZEN' || event === 'VERIFICATION_REQUIRED') && workflowId) {
    try {
      
      
        const advanceRes = await fetch('http://127.0.0.1:3060/instances/' + workflowId + '/advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (advanceRes.ok) {
          return res.json({ success: true, message: 'Verified and Advanced workflow ' + workflowId });
        }
        const errText = await advanceRes.text();
        console.error('dept-b webhook advance failed:', advanceRes.status, errText);
        return res.status(500).json({ error: 'Failed to advance workflow' });

    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  res.json({ success: true, message: 'Webhook received' });
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
