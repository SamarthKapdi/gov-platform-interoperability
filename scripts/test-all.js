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

  // SIMULATE OUTAGE BEFORE ADVANCE (For Dead-Letter Queue Test later)
  await fetchAPI(`http://localhost:3002/admin/simulate-outage`, { method: 'POST' });

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

  // NEGATIVE TESTS (Authentication & Authorization)
  let badAuth = await fetchAPI(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'citizen_demo', password: 'wrongpassword' })
  });
  log(badAuth.status === 401, 'Negative Test: Invalid Credentials (401)');

  let missingAuth = await fetchAPI(`${BASE_URL}/workflow/instances`, {
    headers: {}
  });
  log(missingAuth.status === 401, 'Negative Test: Missing Token (401)');

  // IDEMPOTENCY TEST (MDM Matching)
  const matchRes2 = await fetchAPI(`http://localhost:3030/match`, { method: 'POST' });
  const matchRes3 = await fetchAPI(`http://localhost:3030/match`, { method: 'POST' });
  log(matchRes2.ok && matchRes3.ok, 'Idempotency Test: Repeated MDM Matches');

  console.log('');

  // EXCEPTION & DEAD LETTER QUEUE (E2E Test)
  // 1. The workflow was just advanced to DEPT_B_VERIFICATION earlier in the test script (while Dept B was offline).
  // The event bus is currently trying to deliver the webhook to Dept B. It will fail 3 times and then Dead Letter it.
  console.log('Waiting 7 seconds for Event Bus webhook retries to fail and dead-letter...');
  await sleep(7000);

  // 3. Verify Dead Letter Exception was created
  res = await fetchAPI(`${BASE_URL}/audit/exceptions`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
  const excs = Array.isArray(res.data) ? res.data : [];
  const webhookExc = excs.find(e => e.entity_type === 'webhook' && e.status === 'PENDING');
  
  if (webhookExc) {
    log(true, 'Exception creation (Dead Letter Queue)');

    // 4. Restore Dept B
    await fetchAPI(`http://localhost:3002/admin/restore`, { method: 'POST' });

    // 5. Force Retry via Exception Center
    const retryRes = await fetchAPI(`${BASE_URL}/audit/exceptions/${webhookExc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officialToken}` },
      body: JSON.stringify({ status: 'RETRY' })
    });

    log(retryRes.ok && retryRes.data?.success, 'Retry / dead-letter');
    
    // 6. Verify Recovery (Status = RESOLVED)
    const verifyRes = await fetchAPI(`${BASE_URL}/audit/exceptions`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
    const verifyExcs = Array.isArray(verifyRes.data) ? verifyRes.data : [];
    const resolvedExc = verifyExcs.find(e => e.id === webhookExc.id && e.status === 'RESOLVED');
    
    log(!!resolvedExc, 'Recovery (Webhook Delivered)');
  } else {
    log(false, 'Exception creation (Dead Letter Queue missing)');
    log(false, 'Retry / dead-letter');
    log(false, 'Recovery (Webhook Delivered)');
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
