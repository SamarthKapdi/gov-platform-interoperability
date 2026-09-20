const fs = require('fs');
const path = require('path');

const DB_FILES = [
  'departments/dept-a/data/dept-a.db',
  'departments/dept-b/data/dept-b.db',
  'departments/dept-c/data/dept-c.db',
  'services/identity/data/identity.db',
  'services/mdm/data/mdm.db',
  'services/consent/data/consent.db',
  'services/event-bus/data/events.db',
  'services/workflow/data/workflow.db',
  'services/audit/data/audit.db',
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
