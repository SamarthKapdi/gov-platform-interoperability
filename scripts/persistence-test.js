const API = 'http://localhost:3000/api';

async function run() {
    console.log("1. Logging in with previously created user...");
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'test_citizen',
            password: 'password123'
        })
    });
    const authData = await res.json();
    if (!authData.access_token) throw new Error('Login failed: ' + JSON.stringify(authData));
    const token = authData.access_token;
    const citizenId = authData.user.sub;
    
    console.log("2. Fetching previously created application...");
    const res2 = await fetch(`${API}/workflow/instances?citizen_id=${citizenId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const instances = await res2.json();
    
    if (instances.length === 0) {
        throw new Error("Persistence failed. Application was lost.");
    }
    console.log(`Success! Application ${instances[0].id} survived restart.`);
}
run().catch(console.error);
