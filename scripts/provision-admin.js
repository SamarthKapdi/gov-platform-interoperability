const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { initializeDb, createDbSync } = require('../shared/db');

async function provision() {
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║  MAHA-SETU — System Provisioning                     ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    await initializeDb();
    
    const dbPath = path.join(__dirname, '../backend/identity/data/identity.db');
    
    // Ensure dir exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = await createDbSync(dbPath);

    // Ensure table exists just in case identity service hasn't started yet
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password_hash TEXT,
        name TEXT,
        email TEXT,
        mobile TEXT,
        aadhaar TEXT,
        dob TEXT,
        gender TEXT,
        address TEXT,
        role TEXT,
        department TEXT,
        is_active INTEGER,
        created_at TEXT
      )
    `);

    const insertUser = db.prepare(`
        INSERT ${process.env.DB_MODE === 'postgres' ? 'ON CONFLICT DO NOTHING' : 'OR IGNORE'} INTO users (id, username, password_hash, name, role, department, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);

    const now = new Date().toISOString();
    let changes = 0;

    await db.transaction(async () => {
        const adminHash = bcrypt.hashSync('admin123', 10);
        const resAdmin = await insertUser.run(uuidv4(), 'admin', adminHash, 'System Administrator', 'admin', null, now);
        changes += resAdmin.changes;
        
        const officialHash = bcrypt.hashSync('password123', 10);
        const resA = await insertUser.run(uuidv4(), 'official_a', officialHash, 'Officer Dept A', 'dept_official', 'DEPT_A', now);
        const resB = await insertUser.run(uuidv4(), 'official_b', officialHash, 'Officer Dept B', 'dept_official', 'DEPT_B', now);
        const resC = await insertUser.run(uuidv4(), 'official_c', officialHash, 'Officer Dept C', 'dept_official', 'DEPT_C', now);
        
        changes += resA.changes + resB.changes + resC.changes;
    })();

    if (changes > 0) {
        console.log(`✓ Provisioned ${changes} administrative/official accounts.`);
    } else {
        console.log('✓ Administrative accounts already exist.');
    }
    console.log('System provisioning complete.\n');
    
    if (db.close) db.close();
}

provision().catch(err => {
    console.error('Provisioning failed:', err);
    process.exit(1);
});
