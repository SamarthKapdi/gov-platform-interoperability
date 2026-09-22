const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');

const app = express();
const PORT = process.env.PORT || 3070;

app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

async function main() {
  await initializeDb();

  // Ensure data directory exists
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize database
  const dbPath = path.join(dataDir, 'audit.db');
  const db = createDb(dbPath);
  initAuditTable(db);
  initExceptionsTable(db);

  // Inject db into req
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'audit-service' });
  });

  app.use('/', require('./routes/audit'));
  app.use('/exceptions', require('./routes/exceptions'));
  app.use('/metrics', require('./routes/metrics'));

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  app.listen(PORT, () => {
    console.log(`Audit Service listening on port `);
  });
}

main().catch(err => { console.error('Failed to start:', err); process.exit(1); });
