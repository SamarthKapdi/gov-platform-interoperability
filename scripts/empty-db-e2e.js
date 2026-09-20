
const API = 'http://localhost:3000/api';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
    console.log("=== STARTING E2E EMPTY DB TEST ===");
    
    // 1. Register a new user
    console.log("1. Registering new citizen...");
    let res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'test_citizen',
            password: 'password123',
            name: 'Test Citizen',
            email: 'test@example.com',
            mobile: '1234567890',
            role: 'citizen'
        })
    });
    
    if (!res.ok) {
        // Might already exist if ran before, that's fine for testing
        const text = await res.text();
        console.log("Register response:", res.status, text);
    }
    
    // 2. Login
    console.log("2. Logging in...");
    res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'test_citizen',
            password: 'password123'
        })
    });
    const authData = await res.json();
    const token = authData.access_token;
    const citizenId = authData.user.sub;
    console.log("Logged in, token:", token.substring(0, 15) + "..., citizenId:", citizenId);
    
    // 3. Create Application
    console.log("3. Creating Application...");
    res = await fetch(`${API}/workflow/instances`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            applicationId: 'TEST-APP-001',
            citizenId: citizenId,
            workflowType: 'Caste Certificate',
            serviceName: 'Caste Certificate',
            department: 'DEPT_C'
        })
    });
    const appData = await res.json();
    console.log("Application created:", appData);
    
    // 4. Verify DB Row via GET
    console.log("4. Verifying Application GET...");
    res = await fetch(`${API}/workflow/instances?citizen_id=${citizenId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const instances = await res.json();
    console.log(`Found ${instances.length} applications. First ID: ${instances[0]?.id}`);
    
    if (instances.length === 0) {
        throw new Error("Application was not persisted!");
    }
    
    console.log("=== TEST COMPLETED SUCCESSFULLY ===");
}

run().catch(console.error);
