const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');
const workflowRoutes = require('./routes/workflow');

const app = express();
const port = 3060;

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

  const seedWorkflow = () => {
    const existing = db.prepare('SELECT id FROM workflow_instances LIMIT 1').get();
    if (!existing) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO workflow_instances (id, application_id, citizen_id, current_state, previous_state, owner, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run('wf-demo-001', 'MS-2026-001842', '12345678-1234-1234-1234-123456789012', 'SUBMITTED', null, 'citizen_demo', now, now);

      const states = ['IN_PROGRESS', 'PENDING_DOCUMENT', 'APPROVED', 'SERVICE_ISSUED'];
      states.forEach((state, idx) => {
        db.prepare(`
          INSERT INTO workflow_instances (id, application_id, citizen_id, current_state, previous_state, owner, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(`wf-demo-00${idx + 2}`, `MS-2026-00184${idx + 3}`, '12345678-1234-1234-1234-123456789012', state, 'SUBMITTED', 'citizen_demo', now, now);
      });
      
    }
  };

  seedWorkflow();

  app.locals.db = db;

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'workflow-orchestration' }));

  const { authMiddleware } = require('@sih/shared/auth');
  app.use('/', authMiddleware(), workflowRoutes);

  app.listen(port, () => {
    console.log(`Workflow Orchestration Service running on port ${port}`);
  });
}

main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
