const { bootstrapTestEnvironment, killAllServers, delay, startProcess } = require('./test-bootstrap');
const { spawnSync } = require('child_process');
const path = require('path');

async function fetchAPI(url, options = {}) {
    const fetch = globalThis.fetch;
    try {
        const res = await fetch(url, options);
        let data = null;
        try { data = await res.json(); } catch(e) {}
        return { ok: res.ok, status: res.status, data };
    } catch (e) {
        return { ok: false, status: 500, error: e.message };
    }
}

function log(success, message, extra = '') {
    const symbol = success ? '✅' : '❌';
    console.log(`${symbol} ${message} ${extra}`);
    if (!success) {
        allPassed = false;
    }
}

let allPassed = true;
let BASE_URL = '';
let killServers;

async function runTests() {
    console.log('================================');
    console.log('MASTER TEST SUITE');
    console.log('================================');

    const env = await bootstrapTestEnvironment();
    BASE_URL = env.baseUrl;
    killServers = env.killAll;

    console.log('\n--- AUTHENTICATION & PROVISIONING ---');
    // CREATE TEST CITIZEN
    const uniqueSuffix = Math.random().toString(36).substring(2,8);
    const citUser = `citizen_${uniqueSuffix}`;
    const citPass = 'password123';
    let res = await fetchAPI(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: citUser, password: citPass, name: 'Test Citizen', email: `${citUser}@example.com`, mobile: '9999999999', role: 'citizen'
        })
    });
    log(res.ok, 'Test citizen registration', `(userId: ${res.data?.userId})`);

    res = await fetchAPI(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: citUser, password: citPass })
    });
    log(res.ok, '[PASS] Citizen authentication', `(role: ${res.data?.user?.role})`);
    const citizenToken = res.data?.access_token;
    const citizenId = res.data?.user?.sub;

    res = await fetchAPI(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'official_a', password: 'password123' })
    });
    log(res.ok, '[PASS] Official authentication', `(role: ${res.data?.user?.role})`);
    const officialToken = res.data?.access_token;

    // RBAC
    res = await fetchAPI(`${BASE_URL}/audit/logs/stats`, { headers: { 'Authorization': `Bearer ${citizenToken}` } });
    const rbacBlocked = (res.status === 403);
    res = await fetchAPI(`${BASE_URL}/audit/logs/stats`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
    log(rbacBlocked && res.status === 200, '[PASS] RBAC enforcement');

    console.log('\n--- INTEGRATION TESTS ---');
    // MDM
    const matchRes = await fetchAPI(`http://127.0.0.1:3030/match`, { method: 'POST' });
    await delay(1000); // give it time to match
    log(matchRes.ok, 'MDM matching execution');

    // Negative tests
    let badAuth = await fetchAPI(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nobody@gov.in', password: 'wrong' })
    });
    log(badAuth.status === 401, 'Negative Test: Invalid Credentials (401)');

    let missingAuth = await fetchAPI(`${BASE_URL}/workflow/instances`, {
        headers: {}
    });
    log(missingAuth.status === 401, 'Negative Test: Missing Token (401)');

    // Create Application
    const appId = `APP-${uniqueSuffix}`;
    res = await fetchAPI(`${BASE_URL}/workflow/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` },
        body: JSON.stringify({ applicationId: appId, citizenId, serviceName: 'Building Permission', department: 'DEPT_A' })
    });
    const mainWfId = res.data?.id;
    log(res.status === 201, 'Application creation');

    // Create new workflow bound to Dept B
    const appIdDLQ = `APP-DLQ-${uniqueSuffix}`;
    let resDLQ = await fetchAPI(`${BASE_URL}/workflow/instances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` },
        body: JSON.stringify({ applicationId: appIdDLQ, citizenId, serviceName: 'DLQ Service', department: 'DEPT_B' })
    });
    const dlqWfId = resDLQ.data?.id;

    // Grant consent to Dept B
    await fetchAPI(`${BASE_URL}/consent/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${citizenToken}` },
        body: JSON.stringify({ citizenId, grantingDept: 'DEPT_A', requestingDept: 'DEPT_B', dataScope: 'profile', purpose: 'Testing', expiresInDays: 1 })
    });

    // Advance to trigger Dept B Webhook
    let adv1 = await fetchAPI(`${BASE_URL}/workflow/instances/${dlqWfId}/advance`, { method: 'POST', headers: { 'Authorization': `Bearer ${officialToken}` }});
    console.log('Advance 1:', adv1.status);

    // Stop Dept B
    await fetchAPI(`http://127.0.0.1:3002/admin/simulate-outage`, { method: 'POST' });

    let adv2 = await fetchAPI(`${BASE_URL}/workflow/instances/${dlqWfId}/advance`, { method: 'POST', headers: { 'Authorization': `Bearer ${officialToken}` }});
    console.log('Advance 2 (Triggers Webhook):', adv2.status);

    console.log('\n--- DLQ & RECOVERY TESTS ---');
    // Verify Audit
    res = await fetchAPI(`${BASE_URL}/audit/logs`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
    const auditLogs = Array.isArray(res.data) ? res.data : [];
    const hasAudit = auditLogs.some(l => l.action === 'WORKFLOW_TRANSITION' || l.action === 'CONSENT_GRANTED');
    log(hasAudit, 'Event & Audit emission', `(${auditLogs.length} logs found)`);

    console.log('Waiting 8 seconds for DLQ...');
    await delay(8000);

    // 19. Check exception
    res = await fetchAPI(`${BASE_URL}/audit/exceptions`, { headers: { 'Authorization': `Bearer ${officialToken}` } });
    const excs = Array.isArray(res.data) ? res.data : [];
    log(excs.length > 0, 'Exception creation (Dead Letter Queue missing)');

    if (excs.length > 0) {
        const excId = excs[0].id;

        // Restore Dept B
        await fetchAPI(`http://127.0.0.1:3002/admin/restore`, { method: 'POST' });

        // Force Retry
        let retryRes = await fetchAPI(`${BASE_URL}/audit/exceptions/${excId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${officialToken}` },
            body: JSON.stringify({ status: 'RETRY' })
        });
        log(retryRes.ok, 'Webhook manual retry');

        await delay(3000);

        // Check workflow state
        let checkRes = await fetchAPI(`${BASE_URL}/workflow/instances/${dlqWfId}`, { headers: { 'Authorization': `Bearer ${officialToken}` }});
        log(checkRes.data?.current_state === 'GRIEVANCE_CHECK', 'Workflow continuation after recovery');
    }

    console.log('\n--- PERSISTENCE TEST ---');
    console.log('Restarting services to test DB persistence...');
    // We kill servers, then restart them.
    // Wait for in-memory SQLite auto-save (1s interval)
    await delay(2000);
    killServers();
    await delay(3000);
    const env2 = await bootstrapTestEnvironment(false);
    killServers = env2.killAll;

    // Verify citizen still exists
    res = await fetchAPI(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: citUser, password: citPass })
    });
    log(res.ok, 'User persistence after restart');

    // Verify workflow still exists
    res = await fetchAPI(`${BASE_URL}/workflow/instances/${dlqWfId}`, {
        headers: { 'Authorization': `Bearer ${res.data?.access_token}` }
    });
    log(res.ok && res.data?.id === dlqWfId, 'Workflow persistence after restart');

    console.log('\n========================================');
    if (allPassed) {
        console.log('            ALL TESTS PASSED');
    } else {
        console.log('             SOME TESTS FAILED');
    }
    console.log('========================================\n');

    killServers();
    process.exit(allPassed ? 0 : 1);
}

runTests().catch(e => {
    console.error(e);
    if (killServers) killServers();
    process.exit(1);
});