const { spawn } = require('child_process');
const path = require('path');


async function checkRedis() {
  const { createClient } = require('redis');
  if (!process.env.REDIS_URL) {
    console.error('ERROR: REDIS_URL environment variable is missing.');
    process.exit(1);
  }
  const client = createClient({ url: process.env.REDIS_URL });
  try {
    await client.connect();
    console.log('[REDIS] Connected successfully to ' + process.env.REDIS_URL.split('@').pop());
    await client.quit();
  } catch (err) {
    console.error('[REDIS] Failed to connect:', err.message);
    process.exit(1);
  }
}

async function runProvisioning() {
  console.log('[PROVISION] Running admin provisioning...');
  return new Promise((resolve, reject) => {
    const prov = spawn('node', ['scripts/provision-admin.js'], { stdio: 'inherit' });
    prov.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error('Provisioning failed with code ' + code));
    });
  });
}

async function runDBInit() {
  console.log('[DB-INIT] Initializing cloud database schemas...');
  return new Promise((resolve, reject) => {
    const init = spawn('node', ['scripts/cloud-db-init.js'], { stdio: 'inherit' });
    init.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error('Database initialization failed with code ' + code));
    });
  });
}

function startService(name, scriptPath, customEnv = {}) {
  console.log(`[ORCHESTRATOR] Starting ${name}...`);
  const env = { ...process.env, ...customEnv };
  
  const child = spawn('node', [scriptPath], {
    env,
    stdio: 'pipe'
  });

  child.stdout.on('data', data => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on('data', data => {
    process.stderr.write(`[${name}] ERROR: ${data}`);
  });

  child.on('close', code => {
    console.log(`[ORCHESTRATOR] ${name} exited with code ${code}`);
  });

  return child;
}

const processes = [];

async function bootstrap() {
  try {
    if (process.env.DB_MODE !== 'postgres' || !process.env.DATABASE_URL) {
      console.error('ERROR: DB_MODE=postgres and DATABASE_URL are required for cloud deployment.');
      process.exit(1);
    }
    
    await checkRedis();
    await runDBInit();
    await runProvisioning();

    // Map internal ports explicitly for the cloud environment
    const p = {
      DEPT_A: process.env.DEPT_A_PORT || 3001,
      DEPT_B: process.env.DEPT_B_PORT || 3002,
      DEPT_C: process.env.DEPT_C_PORT || 3003,
      RAW_A: process.env.RAW_DEPT_A_PORT || 3011,
      RAW_B: process.env.RAW_DEPT_B_PORT || 3012,
      RAW_C: process.env.RAW_DEPT_C_PORT || 3013,
      IDENTITY: process.env.IDENTITY_PORT || 3020,
      MDM: process.env.MDM_PORT || 3030,
      CONSENT: process.env.CONSENT_PORT || 3040,
      EVENT_BUS: process.env.EVENT_BUS_PORT || 3050,
      WORKFLOW: process.env.WORKFLOW_PORT || 3060,
      AUDIT: process.env.AUDIT_PORT || 3070,
    };

    processes.push(startService('DEPT_A', 'backend/departments/dept-a/server.js', { PORT: p.DEPT_A }));
    processes.push(startService('DEPT_B', 'backend/departments/dept-b/server.js', { PORT: p.DEPT_B }));
    processes.push(startService('DEPT_C', 'backend/departments/dept-c/server.js', { PORT: p.DEPT_C }));

    processes.push(startService('ADAPTER_A', 'backend/adapters/dept-a/server.js', { PORT: p.RAW_A, DEPT_A_URL: `http://127.0.0.1:${p.DEPT_A}` }));
    processes.push(startService('ADAPTER_B', 'backend/adapters/dept-b/server.js', { PORT: p.RAW_B, DEPT_B_URL: `http://127.0.0.1:${p.DEPT_B}` }));
    processes.push(startService('ADAPTER_C', 'backend/adapters/dept-c/server.js', { PORT: p.RAW_C, DEPT_C_URL: `http://127.0.0.1:${p.DEPT_C}` }));

    processes.push(startService('IDENTITY', 'backend/identity/server.js', { PORT: p.IDENTITY }));
    processes.push(startService('MDM', 'backend/mdm/server.js', { PORT: p.MDM }));
    processes.push(startService('CONSENT', 'backend/consent/server.js', { PORT: p.CONSENT }));
    processes.push(startService('WORKFLOW', 'backend/workflow/server.js', { PORT: p.WORKFLOW }));
    processes.push(startService('EVENT_BUS', 'backend/event-bus/server.js', { PORT: p.EVENT_BUS }));
    processes.push(startService('AUDIT', 'backend/audit/server.js', { PORT: p.AUDIT }));

    // Start Gateway last to ensure it binds to the exact PORT Render gives us
    // We pass internal URLs for all services so the Gateway knows where to route
    const gatewayEnv = {
      PORT: process.env.PORT || 3000,
      IDENTITY_URL: `http://127.0.0.1:${p.IDENTITY}`,
      MDM_URL: `http://127.0.0.1:${p.MDM}`,
      CONSENT_URL: `http://127.0.0.1:${p.CONSENT}`,
      WORKFLOW_URL: `http://127.0.0.1:${p.WORKFLOW}`,
      EVENT_BUS_URL: `http://127.0.0.1:${p.EVENT_BUS}`,
      AUDIT_URL: `http://127.0.0.1:${p.AUDIT}`,
      DEPT_A_URL: `http://127.0.0.1:${p.DEPT_A}`,
      DEPT_B_URL: `http://127.0.0.1:${p.DEPT_B}`,
      DEPT_C_URL: `http://127.0.0.1:${p.DEPT_C}`,
      RAW_DEPT_A_URL: `http://127.0.0.1:${p.RAW_A}`,
      RAW_DEPT_B_URL: `http://127.0.0.1:${p.RAW_B}`,
      RAW_DEPT_C_URL: `http://127.0.0.1:${p.RAW_C}`
    };

    // Add a slight delay to let microservices bind
    setTimeout(() => {
      processes.push(startService('GATEWAY', 'backend/gateway/server.js', gatewayEnv));
      console.log(`\n[ORCHESTRATOR] All services started. Gateway listening on port ${gatewayEnv.PORT}\n`);
    }, 3000);

  } catch (err) {
    console.error('[ORCHESTRATOR] Fatal Error during bootstrap:', err);
    process.exit(1);
  }
}

// Graceful shutdown
function shutdown() {
  console.log('\n[ORCHESTRATOR] Shutting down all services...');
  for (const p of processes) {
    p.kill('SIGTERM');
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

bootstrap();
