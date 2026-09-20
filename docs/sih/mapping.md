# SIH 26129 Problem Statement Mapping

| PS Requirement | Implementation | Screen/API | Demo Evidence |
|---|---|---|---|
| **API-based data exchange** | API Gateway orchestrating microservices | Gateway `/health`, `/api/services` | All dashboard data routes through Gateway (Port 3000) |
| **Common data standards** | Adapter pattern converting legacy payloads to canonical schemas (IndEA aligned) | Interoperability Page | Adapter XML to JSON transformation logs |
| **Master Data Management (MDM)** | Dedicated MDM engine with fuzzy matching for identity resolution | Golden Record Page | Unified citizen view aggregating Dept A and Dept B |
| **Consent Management** | Dedicated Consent service enforcing access control | Citizen Portal, Consent API | Citizen blocking/allowing data access in real-time |
| **Security & Authentication** | JWT-based Auth (OIDC prototype) with RBAC | Identity Service, Auth Middleware | Login flows, blocking unauthenticated API access |
| **Event-Driven Architecture** | Centralized Event Bus (Pub/Sub pattern) | Event Bus API, Audit Page | Asynchronous logging of consent and workflow changes |
| **Cross-Department Workflows** | Workflow Engine orchestrating multi-step processes | Workflow Dashboard | Advancing state machines across simulated departments |
| **Audit & Accountability** | Immutable logging of all state changes and security exceptions | Audit Ledger Page | Read-only ledger showing actions from the demo |
| **Legacy System Integration** | Simulated XML/SOAP adapters | Interoperability Page | Visual proof of heterogeneous system translation |
| **Scalable Microservices** | Node.js/Express individual services running independently | Health Dashboard | Gateway status monitoring individual service health |
| **Federated Architecture** | Connecting systems rather than centralizing all databases | Golden Record Page | Live API calls fetching fragments from Dept A/B/C |
