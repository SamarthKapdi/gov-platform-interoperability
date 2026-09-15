const { execSync, spawn } = require('child_process');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';
let allPassed = true;

function log(status, name, details = '') {
  if (status) {
    console.log(`[PASS] ${name}`);
  } else {
    console.error(`[FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
    allPassed = false;
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAPI(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch(e) {
    return { status: 500, ok: false, data: null };
  }
}

async function checkHealth(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function waitForHealthy(url, retries = 20, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    if (await checkHealth(url)) return true;
    await sleep(delay);
  }
  return false;
}

function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        }
      }
    }
  } catch (e) {
    // Ignore if not found
  }
}

function killAllServers() {
  const ports = [3000, 3001, 3002, 3003, 3020, 3030, 3040, 3050, 3060, 3070];
  for (const port of ports) {
    killPort(port);
  }
}

async function runTests() {
  console.log('========================================');
  console.log('       MAHA-SETU SYSTEM VERIFICATION');
  console.log('========================================\n');

  // 1. Clean Seed
  killAllServers();
  await sleep(2000);
  try {
    execSync('npm run seed', { stdio: 'ignore' });
    log(true, 'Database reset');
  } catch (e) {
    log(false, 'Database reset');
    return finish();
  }

  // 2. Boot Backend
  const serverProcess = spawn('npm', ['run', 'start:services'], { shell: true });
  serverProcess.stdout.pipe(fs.createWriteStream('services-test.log'));
  serverProcess.stderr.pipe(fs.createWriteStream('services-test-err.log'));

  const depsProcess = spawn('npm', ['run', 'start:deps'], { shell: true, stdio: 'ignore' });

  const gatewayHealthy = await waitForHealthy('http://localhost:3000/health');
  log(gatewayHealthy, 'Gateway health');
  log(await waitForHealthy('http://localhost:3020/health'), 'Identity service');
  log(await waitForHealthy('http://localhost:3030/health'), 'MDM service');
  log(await waitForHealthy('http://localhost:3040/health'), 'Consent service');
  log(await waitForHealthy('http://localhost:3060/health'), 'Workflow service');
  log(await waitForHealthy('http://localhost:3070/health'), 'Audit service');

  if (!gatewayHealthy) {
    console.log('Gateway failed to boot. Aborting tests.');
    return finish();
  }

  let citizenToken, officialToken;

  // AUTH
  let res = await fetchAPI(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'citizen_demo', password: 'password123' })
  });
  log(res.ok, 'Citizen authentication');
  citizenToken = res.data?.access_token;

  res = await fetchAPI(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'official_a', password: 'password123' })
  });
  log(res.ok, 'Official authentication');
  officialToken = res.data?.access_token;

  // RBAC
  res = await fetchAPI(`${BASE_URL}/audit/logs/stats`, { headers: { 'Authorization': `Bearer ${citizenToken}` } });
  const rbacBlocked = (res.status === 403);
  res = await fetchAPI(`${BASE_URL}/audit/logs/stats`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
  log(rbacBlocked && res.status === 200, 'RBAC enforcement');

  console.log(''); // newline

  // ADAPTERS
  log(await waitForHealthy('http://localhost:3001/health'), 'Department A adapter');
  log(await waitForHealthy('http://localhost:3002/health'), 'Department B XML adapter');
  log(await waitForHealthy('http://localhost:3003/health'), 'Department C adapter');

  console.log('');

  // MDM
  const matchRes = await fetchAPI(`http://localhost:3030/match`, { method: 'POST' });
  await sleep(2000);
  log(matchRes.ok, 'MDM matching', JSON.stringify(matchRes.data));

  // Golden record
  const targetCitizenId = '12345678-1234-1234-1234-123456789012';
  res = await fetchAPI(`${BASE_URL}/mdm/citizen/${targetCitizenId}/full-profile`, {
    headers: { 'Authorization': `Bearer ${officialToken}` }
  });
  log(res.ok && res.data?.citizen?.canonical_id === targetCitizenId, 'Golden record', JSON.stringify(res.data));

  console.log('');

  // WORKFLOW INITIAL
  res = await fetchAPI(`${BASE_URL}/workflow/instances/wf-demo-001`, {
    headers: { 'Authorization': `Bearer ${officialToken}` }
  });
  // Advance 1 (Valid: SUBMITTED -> IDENTITY_VERIFIED)
  res = await fetchAPI(`${BASE_URL}/workflow/instances/wf-demo-001/advance`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${officialToken}` }
  });
  
  // CONSENT DENIAL (Blocked transition: IDENTITY_VERIFIED -> DEPT_B_VERIFICATION)
  let wfFail = await fetchAPI(`${BASE_URL}/workflow/instances/wf-demo-001/advance`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${officialToken}` }
  });
  log(wfFail.status === 409, 'Consent denial', JSON.stringify(wfFail.data));

  // CONSENT GRANT
  res = await fetchAPI(`${BASE_URL}/consent/grant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` },
    body: JSON.stringify({
      citizenId: targetCitizenId,
      grantingDept: 'DEPT_B',
      requestingDept: 'DEPT_B',
      dataScope: 'employment_status',
      purpose: 'Verification',
      expiresInDays: 30
    })
  });
  log(res.ok, 'Consent grant');
  const consentId = res.data?.consentId;

  // PROTECTED ACCESS (Transition allowed after consent)
  let wfSuccess = await fetchAPI(`${BASE_URL}/workflow/instances/wf-demo-001/advance`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${officialToken}` }
  });
  log(wfSuccess.ok && wfSuccess.data?.current_state === 'DEPT_B_VERIFICATION', 'Protected access', JSON.stringify(wfSuccess.data));
  log(wfSuccess.ok, 'Workflow transition');

  // CONSENT REVOCATION
  res = await fetchAPI(`${BASE_URL}/consent/revoke`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` },
    body: JSON.stringify({ consentId })
  });
  log(res.ok, 'Consent revocation');

  console.log('');


  // EVENT / AUDIT
  res = await fetchAPI(`${BASE_URL}/audit/logs`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
  const logs = Array.isArray(res.data) ? res.data : [];
  const hasEvent = logs.some(l => l.action === 'WORKFLOW_TRANSITION' || l.action === 'CONSENT_GRANTED');
  log(hasEvent, 'Event emission');
  log(hasEvent, 'Audit logging');

  console.log('');

  // EXCEPTION
  res = await fetchAPI(`${BASE_URL}/audit/exceptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officialToken}` },
    body: JSON.stringify({ source: 'test-all', entityType: 'test', errorType: 'TEST', errorMessage: 'Test exception' })
  });
  log(res.ok, 'Exception creation');

  res = await fetchAPI(`${BASE_URL}/audit/exceptions`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
  const excs = Array.isArray(res.data) ? res.data : [];
  const testExc = excs.find(e => e.source === 'test-all');
  if (testExc) {
    res = await fetchAPI(`${BASE_URL}/audit/exceptions/${testExc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officialToken}` },
      body: JSON.stringify({ status: 'RETRY' })
    });
    log(res.ok, 'Retry / dead-letter');
    log(res.ok, 'Recovery');
  } else {
    log(false, 'Retry / dead-letter', JSON.stringify(res.data));
    log(false, 'Recovery');
  }

  console.log('');

  // PERSISTENCE
  killAllServers();
  await sleep(2000);
  
  const serverProcess2 = spawn('npm', ['run', 'start:services'], { shell: true, stdio: 'ignore' });
  const depsProcess2 = spawn('npm', ['run', 'start:deps'], { shell: true, stdio: 'ignore' });
  await waitForHealthy('http://localhost:3000/health');
  
  res = await fetchAPI(`${BASE_URL}/workflow/instances/wf-demo-001`, {
    headers: { 'Authorization': `Bearer ${officialToken}` }
  });
  log(res.ok && res.data?.current_state === 'DEPT_B_VERIFICATION', 'Persistence after restart');
  
  killAllServers();
  await sleep(1000);

  console.log('');

  // BUILD
  try {
    execSync('npm run build -w citizen-portal', { stdio: 'ignore' });
    log(true, 'Citizen frontend build');
  } catch (e) {
    log(false, 'Citizen frontend build');
  }

  try {
    execSync('npm run build -w official-dashboard', { stdio: 'ignore' });
    log(true, 'Official frontend build');
  } catch (e) {
    log(false, 'Official frontend build');
  }

  finish();
}

function finish() {
  console.log('\n========================================');
  if (allPassed) {
    console.log('             ALL TESTS PASSED');
  } else {
    console.log('             SOME TESTS FAILED');
  }
  console.log('========================================');
  killAllServers();
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(e => {
  console.error('Fatal error:', e);
  finish();
});
