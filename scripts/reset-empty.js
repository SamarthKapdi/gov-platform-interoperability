const fs = require('fs');
const path = require('path');

const DB_FILES = [
  'backend/departments/dept-a/data/dept-a.db',
  'backend/departments/dept-b/data/dept-b.db',
  'backend/departments/dept-c/data/dept-c.db',
  'backend/identity/data/identity.db',
  'backend/mdm/data/mdm.db',
  'backend/consent/data/consent.db',
  'backend/event-bus/data/events.db',
  'backend/workflow/data/workflow.db',
  'backend/audit/data/audit.db',
];

const ROOT = path.resolve(__dirname, '..');

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║  MAHA-SETU — Empty DB Initialization                 ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log();

// Step 1: Delete existing database files
console.log('Step 1: Clearing all existing databases...');
for (const dbFile of DB_FILES) {
  const fullPath = path.join(ROOT, dbFile);
  for (const suffix of ['', '-wal', '-shm']) {
    const p = fullPath + suffix;
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      console.log(`  ✓ Deleted: ${dbFile}${suffix}`);
    }
  }
}
console.log();

console.log('Databases cleared. The services will create fresh empty schemas on startup.');
console.log('Run `npm run start:all` to boot the application with a blank state.');
