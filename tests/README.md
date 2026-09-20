# Test Architecture

MAHA-SETU test suites verify the full data lifecycle without depending on hardcoded or pre-seeded database records.

## Test Suites

1. **Master Test Suite (`npm run test:all`)**
   - Script: `scripts/test-all.js` (supported by `scripts/test-bootstrap.js`)
   - Self-contained deterministic execution: stops existing services, resets DBs, provisions test operational accounts, verifies authentication, RBAC, MDM, application lifecycle, outage simulation, Dead Letter Queue (DLQ), automated webhook retry, recovery, and persistence across service restarts.

2. **Real Product E2E (`npm run test:real-product`)**
   - Script: `scripts/real-product-e2e.js`
   - Validates the complete runtime user journey from empty database through citizen self-registration, consent granting/revocation, multi-department workflow transitions, and service output verification.
