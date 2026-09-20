const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { initializeDb, createDb, initAuditTable, initExceptionsTable } = require('@sih/shared/db');
const { handleEvents } = require('./services/notification-handler');
const eventsRouter = require('./routes/events');
const notificationsRouter = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3050;

// Setup directories
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

async function main() {
  await initializeDb();
  
  // Setup DB
  const db = createDb(path.join(dataDir, 'events.db'));
  initAuditTable(db);
  initExceptionsTable(db);

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      citizen_id TEXT,
      channel TEXT,
      recipient TEXT,
      message TEXT,
      event_type TEXT,
      sent_at TEXT,
      status TEXT
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT,
      payload TEXT,
      source TEXT,
      created_at TEXT
    );
  `);

  // Setup background notification handler
  handleEvents(db);

  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'event-bus' });
  });

  app.use('/events', eventsRouter(db));
  app.use('/notifications', notificationsRouter(db));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  app.listen(PORT, () => {
    console.log(`Event Bus & Notification Service running on port ${PORT}`);
  });
}

main().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
