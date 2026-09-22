const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function migrate() {
  if (process.env.DB_MODE !== 'postgres') {
    console.log('Skipping migrations: DB_MODE is not postgres');
    return;
  }

  const client = new Client();
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      const { rowCount } = await client.query(
        'SELECT 1 FROM _migrations WHERE filename = $1',
        [file]
      );

      if (rowCount === 0) {
        console.log(`Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO _migrations (filename) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`Successfully applied ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`Error applying ${file}:`, err);
          throw err;
        }
      }
    }
    
    console.log('All migrations applied successfully.');
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = migrate;
