# 🏛️ MAHA-SETU: Government Interoperability Platform

![SIH 2026](https://img.shields.io/badge/SIH_2026-Problem_26129-orange?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Federated_Microservices-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A federated, event-driven interoperability layer for Indian government departments.** Built in strict adherence to IndEA (India Enterprise Architecture) standards, MAHA-SETU enables seamless, consent-driven data exchange across disconnected legacy government databases without centralized data replication.

---

## 🚨 The Problem (SIH 26129)
Government departments operate in silos using disparate tech stacks, legacy formats (XML, SOAP, JSON), and fragmented citizen identifiers. Forcing a massive centralized data migration is technically and politically infeasible. Citizens suffer from repetitive KYC, and officials lack a holistic 360° view of beneficiaries.

## 💡 The Solution
MAHA-SETU acts as an intelligent abstraction layer. It leaves the data at its source and connects it dynamically through on-the-fly adapter normalization, a Master Data Management (MDM) fuzzy-matching engine, and a DEPA-compliant consent framework. 

### ✨ Key Features
- **🧩 Pluggable Adapters:** Transform legacy formats (e.g., XML/SOAP) into canonical IndEA JSON schemas instantly.
- **🧬 MDM Golden Record:** Dynamically links fragmented citizen profiles across departments based on fuzzy matching (Name, DOB, Mobile).
- **🔒 DEPA Consent Framework:** Citizens have absolute control over cross-department data sharing. Records are cryptographically locked until explicit, verifiable consent is granted.
- **🔀 Lightweight BPMN Engine:** State-machine orchestrator for multi-department approvals, featuring dynamic SVG flowcharts.
- **🛡️ OIDC API Gateway:** Single entry point enforcing JWT validation, RBAC, and rate limiting.
- **📬 Resilient Event Bus:** Built-in Pub/Sub with a Dead-Letter Queue that automatically retries failed cross-department notifications.

---

## 🏗️ Architecture

`mermaid
graph TD
    subgraph Frontends
        C[Citizen Portal]
        O[Official Dashboard]
    end

    G[API Gateway :3000]
    
    subgraph Platform Services
        ID[Identity/OIDC :3020]
        MDM[MDM Engine :3030]
        CON[Consent Service :3040]
        WF[Workflow Engine :3060]
        AUD[Audit & Exception :3070]
        EB[Event Bus :3050]
    end

    subgraph Adapters & Source Systems
        A1[Adapter A :3011] --> D1[(Dept A - JSON)]
        A2[Adapter B :3012] --> D2[(Dept B - Legacy XML)]
        A3[Adapter C :3013] --> D3[(Dept C - SOAP)]
    end

    C --> G
    O --> G
    G --> ID
    G --> MDM
    G --> CON
    G --> WF
    
    MDM --> A1
    MDM --> A2
    MDM --> A3
    
    WF -.-> EB
    CON -.-> EB
    EB -.-> AUD
`

---

## 🚀 Quick Start (Local Setup)

The entire federated ecosystem (9 microservices + 2 frontends) can be booted locally for demonstration.

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
`ash
npm install
cd citizen-portal && npm install
cd ../official-dashboard && npm install
cd ..
`

### 2. Seed Databases
Resets the deterministic demo state across all 9 microservices.
`ash
npm run seed
`

### 3. Start the Ecosystem
Boot up all department APIs, adapters, core services, and frontends concurrently.
`ash
npm run start:all
`

### 4. Trigger MDM Matching
In a new terminal, trigger the fuzzy-matching engine to generate the Golden Records:
`ash
curl -X POST http://localhost:3030/match
# or using PowerShell:
# Invoke-RestMethod -Method POST -Uri http://localhost:3030/match
`

---

## 🧪 E2E Automation Testing
The platform includes an exhaustive 30-step E2E integration test suite that verifies Gateway health, RBAC enforcement, Golden Record matching, Consent Revocation, Dead-Letter queues, and workflow persistence.

`ash
npm run test:all
`

---

## 🎮 Demo Credentials

Access the live applications at:
- **Citizen Portal:** http://localhost:5173
- **Official Dashboard:** http://localhost:5174

| Role | Username | Password |
|------|----------|----------|
| Citizen | \citizen_demo\ | \password123\ |
| Dept Official | \official_a\ | \password123\ |
| Administrator | \dmin\ | \dmin123\ |

---
*Built for the Smart India Hackathon 2026*
