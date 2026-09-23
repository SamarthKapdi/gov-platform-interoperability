const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');
const workflowRoutes = require('./routes/workflow');

const app = express();
const PORT = process.env.PORT || 3060;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

async function main() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await initializeDb();
  const dbPath = path.join(dataDir, 'workflow.db');
  const db = createDb(dbPath);
  initAuditTable(db);
  initExceptionsTable(db);

  db.exec(`
    
  CREATE TABLE IF NOT EXISTS service_outputs (
    id TEXT PRIMARY KEY,
    application_id TEXT,
    service_id TEXT,
    issued_at TEXT,
    issued_by TEXT,
    verification_code TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS workflow_instances (
      id TEXT PRIMARY KEY,
      application_id TEXT,
      citizen_id TEXT,
      current_state TEXT,
      previous_state TEXT,
      owner TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `);

  

  app.locals.db = db;

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'workflow-orchestration' }));

  const { authMiddleware } = require('@sih/shared/auth');
  app.use('/', authMiddleware({ optional: true }), workflowRoutes);

  app.listen(PORT, () => {
    console.log(`Workflow Orchestration Service running on port ${PORT}`);
  });
}

main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
