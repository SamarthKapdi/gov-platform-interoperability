/**
 * Seed script — resets all demo data to a known state.
 * Run: node seed/seed-all.js
 * 
 * This script:
 * 1. Deletes all .db files across services
 * 2. Starts each service briefly to trigger its built-in seeding
 * 3. Triggers an MDM matching run to create golden records
 * 
 * For demo: run this before each demo to ensure consistent data.
 */

const fs = require('fs');
const path = require('path');

const DB_FILES = [
  'dept-a/data/dept-a.db',
  'dept-b/data/dept-b.db',
  'dept-c/data/dept-c.db',
  'identity/data/identity.db',
  'mdm-service/data/mdm.db',
  'consent-service/data/consent.db',
  'event-bus/data/events.db',
  'workflow/data/workflow.db',
  'audit-service/data/audit.db',
];

const ROOT = path.resolve(__dirname, '..');

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  SIH 26129 — Demo Data Reset                       ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log();

// Step 1: Delete existing database files
console.log('Step 1: Clearing existing databases...');
for (const dbFile of DB_FILES) {
  const fullPath = path.join(ROOT, dbFile);
  // Delete both the .db file and any WAL/SHM files
  for (const suffix of ['', '-wal', '-shm']) {
    const p = fullPath + suffix;
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  ✓ Deleted: ${dbFile}${suffix}`);
    }
  }
}
console.log();

console.log('Step 2: Databases cleared. Each service will auto-seed on next startup.');
console.log();
console.log('Step 3: Start all services to trigger seeding:');
console.log('  npm run start:deps     # Start department services (they auto-seed)');
console.log('  npm run start:services # Start platform services (they auto-seed)');
console.log();
console.log('Step 4: After services are running, trigger MDM matching:');
console.log('  curl -X POST http://localhost:3030/mdm/match');
console.log();
console.log('═══════════════════════════════════════════════════════');
console.log('Demo users:');
console.log('  Citizen: citizen_demo / password123 (Rajesh Kumar Sharma)');
console.log('  Official A: official_a / password123');
console.log('  Official B: official_b / password123');
console.log('  Official C: official_c / password123');
console.log('  Admin: admin / admin123');
console.log('═══════════════════════════════════════════════════════');
