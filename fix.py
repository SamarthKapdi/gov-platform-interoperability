import re
with open('scripts/real-product-e2e.js', 'r') as f:
    text = f.read()

replacement = """
        let revokeRes = await fetch(`${BASE_URL}/consent/revoke`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ consentId: consent.consentId })
        });
        if (!revokeRes.ok) throw new Error('Failed to revoke consent: ' + revokeRes.status + ' ' + await revokeRes.text());
        console.log('[PASS] Consent revoke');
"""
text = re.sub(r'let revokeRes = await fetch.*?console\.log\(\'\[PASS\] Consent revoke\'\);', replacement, text, flags=re.DOTALL)

# Let me also fix the backticks that were stripped by powershell earlier:
text = text.replace('fetch(${BASE_URL}/consent/revoke', 'fetch(`${BASE_URL}/consent/revoke`')
text = text.replace("Authorization': Bearer", "Authorization': `Bearer ${token}`")

with open('scripts/real-product-e2e.js', 'w') as f:
    f.write(text)
