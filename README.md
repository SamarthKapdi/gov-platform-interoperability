# 🏛️ MAHA-SETU: Government Interoperability Platform

![SIH 2026](https://img.shields.io/badge/SIH_2026-Problem_26129-orange?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Federated_Microservices-blue?style=for-the-badge)
![Production Status](https://img.shields.io/badge/Status-Real_Data_Ready-emerald?style=for-the-badge)

**A federated, event-driven interoperability layer for Indian government departments.** Built in strict adherence to IndEA (India Enterprise Architecture) standards, MAHA-SETU enables seamless, consent-driven data exchange across disconnected legacy government databases without centralized data replication.

## 🚀 Real Full-Stack Architecture
This platform is a **genuine full-stack product**. 
Unlike typical hackathon submissions, MAHA-SETU does **not** rely on pre-populated mock data, hardcoded dashboard metrics, or fake UI transitions. 

- **Empty Database Startup:** The application boots cleanly from an empty database schema.
- **Dynamic Entities:** Users must actually register, login, and submit applications. The dashboard aggregates these actions into real-time metrics using SQL.
- **Persisted State:** Every workflow transition, consent grant, and integration event is backed by a SQLite transaction. Restarting the services preserves absolute state.

## ⚙️ Core Modules
1. **OIDC API Gateway:** Single entry point enforcing JWT validation, RBAC, and rate limiting.
2. **Master Data Management (MDM):** Dynamically builds "Golden Records" by scanning isolated department databases and mapping entity relationships via fuzzy matching.
3. **Pluggable Adapters:** Translates legacy departmental formats (e.g., XML) into canonical JSON.
4. **DEPA Consent Engine:** Enforces citizen-controlled data access. Protected records are blocked at the adapter level until a cryptographic consent grant is verified.
5. **Workflow Orchestrator:** A robust BPMN-style state machine tracking applications across inter-departmental hops.
6. **Resilient Event Bus:** Asynchronous Pub/Sub system equipped with a Dead Letter Queue (DLQ). Department webhook outages are caught, stored, and safely retried upon recovery.

---

## 🛠️ Quick Start

### 1. Production-Like Mode (Empty Database)
Starts the platform exactly as a real product would: completely blank, awaiting user registration and natural data creation.

```bash
# Delete all DB files and initialize fresh schemas
npm run reset:empty

# Boot the API Gateway, 6 microservices, 3 department simulators, and 2 frontends
npm run start:all
```

**To use the system:**
1. Open the Citizen Portal at `http://localhost:5173`.
2. Click **Register** to create a new citizen profile.
3. Submit a new service application.
4. Open the Official Dashboard at `http://localhost:5174` (login with the auto-bootstrapped `official_a` / `password123`).
5. Process the application!

### 2. Test / Evaluation Mode
For rapid testing or hackathon evaluations, you can seed the database with test fixtures (fictional citizens, workflows, and exceptions).

```bash
# Wipe database and inject test fixtures
npm run seed:test

# Boot the platform
npm run start:all
```

---

## 🏗️ Tech Stack
- **Backend:** Node.js, Express, SQL.js (SQLite without native binary dependencies)
- **Frontend:** React 18, Vite, Tailwind CSS, Recharts
- **Auth:** JWT (JSON Web Tokens), bcryptjs
- **Tooling:** Concurrently

## 📊 Evaluation Readiness
Please review the internal documentation generated for the architecture audit:
- [REAL_PRODUCT_AUDIT.md](./REAL_PRODUCT_AUDIT.md): Detailed database schema breakdown and transformation notes.
- [REAL_DATA_READINESS.md](./REAL_DATA_READINESS.md): Traces the real lifecycle of data across the system from an empty state.
