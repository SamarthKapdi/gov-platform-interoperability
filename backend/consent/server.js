const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { initializeDb, createDb } = require('@sih/shared/db');

const consentRoutes = require('./routes/consent');

const app = express();
const PORT = process.env.PORT || 3040;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

async function main() {
    await initializeDb();
    
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'consent.db');
    const db = createDb(dbPath);

    // Create tables
    db.exec(`
        CREATE TABLE IF NOT EXISTS consent_grants (
            id TEXT PRIMARY KEY,
            citizen_id TEXT NOT NULL,
            granting_dept TEXT NOT NULL,
            requesting_dept TEXT NOT NULL,
            data_scope TEXT NOT NULL,
            status TEXT NOT NULL,
            purpose TEXT,
            granted_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            revoked_at TEXT,
            created_by TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS consent_access_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            consent_id TEXT,
            accessing_dept TEXT NOT NULL,
            accessed_data TEXT NOT NULL,
            citizen_id TEXT NOT NULL,
            access_granted INTEGER NOT NULL,
            reason TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (consent_id) REFERENCES consent_grants(id)
        );
    `);

    // Seed data
    
    // Pass db to routes
    app.use((req, res, next) => {
        req.db = db;
        next();
    });

    app.get('/health', (req, res) => res.json({ status: 'ok', service: 'consent-service' }));
    app.use('/', consentRoutes);

    // Error handling middleware
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    app.listen(PORT, () => {
        console.log(`Consent Service listening at http://localhost:${port}`);
    });
}

main().catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
});
