const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { initializeDb, createDb } = require('@sih/shared/db');

const consentRoutes = require('./routes/consent');

const app = express();
const port = 3040;

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
    const count = db.prepare('SELECT COUNT(*) as count FROM consent_grants').get().count;
    if (count === 0) {
        console.log('Seeding initial consent data...');
        const insertStmt = db.prepare(`
            INSERT INTO consent_grants 
            (id, citizen_id, granting_dept, requesting_dept, data_scope, status, purpose, granted_at, expires_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const now = new Date();
        const expires = new Date();
        expires.setFullYear(expires.getFullYear() + 1);

        insertStmt.run(
            'c-demo-1',
            'CAN-0001',
            'DEPT_A',
            'DEPT_C',
            'applications',
            'ACTIVE',
            'Demo purpose 1: Rajesh grants DEPT_C to read data from DEPT_A',
            now.toISOString(),
            expires.toISOString(),
            'SYSTEM'
        );
        insertStmt.run(
            'c-demo-2',
            'CAN-0002',
            'DEPT_C',
            'DEPT_A',
            'profile',
            'ACTIVE',
            'Demo purpose 2: Priya grants DEPT_A to read from DEPT_C',
            now.toISOString(),
            expires.toISOString(),
            'SYSTEM'
        );
    }

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

    app.listen(port, () => {
        console.log(`Consent Service listening at http://localhost:${port}`);
    });
}

main().catch(err => {
    console.error('Failed to start:', err);
    process.exit(1);
});
