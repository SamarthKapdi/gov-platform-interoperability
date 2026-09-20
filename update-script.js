const fs = require('fs');
let t = fs.readFileSync('scripts/real-product-e2e.js', 'utf8');
const replacement = `        for(let i=0; i<8; i++) {
            let z = await fetch(\`\${BASE_URL}/workflow/instances/\${instanceId}/advance\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${offToken}\` }
            });
            let zTxt = await z.text();
            console.log('Advance ' + i + ':', z.status, zTxt);
            await delay(500);
        }`;
t = t.replace(/for\(let i=0; i<6; i\+\+\) \{[\s\S]*?await delay\(200\);\s*\}/, replacement);
fs.writeFileSync('scripts/real-product-e2e.js', t);
