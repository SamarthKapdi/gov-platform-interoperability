const { spawn } = require('child_process');

console.log('Initializing cloud database...');

const migrate = spawn('node', ['shared/migrate.js'], { stdio: 'inherit' });

migrate.on('close', code => {
  if (code === 0) {
    console.log('Cloud database initialized successfully.');
    process.exit(0);
  } else {
    console.error('Database initialization failed.');
    process.exit(code);
  }
});
