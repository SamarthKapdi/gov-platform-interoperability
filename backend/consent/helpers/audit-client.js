const http = require('http');

async function sendAuditLog(entry) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(entry);

        const options = {
            hostname: 'localhost',
            port: 3070,
            path: '/log',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(responseData);
                } else {
                    reject(new Error(`Audit service returned ${res.statusCode}: ${responseData}`));
                }
            });
        });

        req.on('error', (e) => {
            console.error('Failed to send audit log:', e.message);
            // We resolve rather than reject to avoid failing the main transaction if audit service is down
            resolve();
        });

        req.write(data);
        req.end();
    });
}

module.exports = { sendAuditLog };
