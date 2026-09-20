const { spawn, execSync } = require('child_process');
const path = require('path');
const http = require('http');

let spawnedProcesses = [];


function killAllServers() {
    for (const proc of spawnedProcesses) {
        try {
            proc.kill('SIGKILL');
        } catch (e) {}
    }
    spawnedProcesses = [];
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHealthy(url, timeoutMs = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await new Promise((resolve, reject) => {
                http.get(url, (response) => {
                    if (response.statusCode === 200) {
                        resolve(true);
                    } else {
                        reject(new Error('Not 200'));
                    }
                }).on('error', reject);
            });
            if (res) return true;
        } catch (e) {
            // keep waiting
        }
        await delay(500);
    }
    return false;
}

function startProcess(name, args, cwd) {
    const proc = spawn(name, args, { cwd, shell: false }); // Avoid shell: true
    spawnedProcesses.push(proc);
    
    // Optional: pipe stderr for debugging
    // proc.stderr.on('data', data => console.error(`${cwd} stderr: ${data}`));
    
    return proc;
}

async function bootstrapTestEnvironment(resetDB = true) {
    console.log('[BOOTSTRAP] Stopping existing services...');
    killAllServers();
    await delay(1000);

    if (resetDB) {
        console.log('[BOOTSTRAP] Resetting databases...');
        execSync('node scripts/reset-empty.js', { cwd: path.join(__dirname, '..'), stdio: 'ignore' });

        console.log('[BOOTSTRAP] Provisioning admin/official accounts...');
        execSync('node scripts/provision-admin.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    }

    console.log('[BOOTSTRAP] Starting services...');
    const services = [
        ['services/gateway/server.js', 3000],
        ['departments/dept-a/server.js', 3001],
        ['departments/dept-b/server.js', 3002],
        ['departments/dept-c/server.js', 3003],
        ['services/identity/server.js', 3010],
        ['services/mdm/server.js', 3030],
        ['services/consent/server.js', 3040],
        ['services/event-bus/server.js', 3050],
        ['services/workflow/server.js', 3060],
        ['services/audit/server.js', 3070],
    ];

    for (const [file, port] of services) {
        const cwdPath = path.join(__dirname, '..', path.dirname(file));
        const scriptName = path.basename(file);
        startProcess(process.execPath, [scriptName], cwdPath);
    }

    // Wait for Gateway to be healthy (which indicates services are coming up)
    console.log('[BOOTSTRAP] Waiting for services to become healthy...');
    const healthy = await waitForHealthy('http://127.0.0.1:3000/health', 15000);
    if (!healthy) {
        throw new Error('Gateway failed to become healthy');
    }
    await delay(2000); // Give other services a moment to settle

    return {
        baseUrl: 'http://127.0.0.1:3000/api',
        killAll: killAllServers
    };
}

module.exports = {
    bootstrapTestEnvironment,
    killAllServers,
    delay,
    startProcess
};
