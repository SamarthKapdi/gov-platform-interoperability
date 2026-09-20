# Master Build Prompt — Government Interoperability & Federated Service Delivery Platform

**Use this document as a single master prompt.** Paste the whole thing (or section by section) into Claude Code, Cursor, or any AI coding assistant to scaffold and build the prototype. It is written so an AI agent can execute it directly, phase by phase.

---

## 1. Project context (do not skip — this frames every decision)

**Problem Statement ID:** 26129
**Title:** System integration and interoperability among government digital platforms, resulting in fragmented service delivery
**Organization:** Government of Maharashtra — Maharashtra State Innovation Society, Dept. of Skills, Employment, Entrepreneurship and Innovation

**Core problem:** Government departments run independent portals, apps, registries, workflow systems, and databases with mismatched data formats, identifiers, authentication, APIs, and process definitions. Citizens re-submit the same information repeatedly, can't track applications across portals, and officials lack a consolidated view. The fix must NOT require replacing existing systems.

**Required solution shape (from the PS — build to satisfy every one of these):**
1. API-based exchange between systems
2. Common data standards (canonical schemas)
3. Master-data management (single source of truth per entity)
4. Consent-based data sharing
5. Single sign-on / federated identity
6. Event-driven notifications
7. Unified application tracking
8. Configurable workflow orchestration
9. Reusable connectors for legacy AND modern systems
10. Audit logs
11. Role-based access control
12. Data-quality checks
13. Exception handling
14. Monitoring dashboards

**Success metrics judges will look for:** fewer duplicate submissions, reduced processing time, consistent records across departments, improved citizen experience, better cross-department coordination, measurable SLA compliance.

---

## 2. Prototype scope (what to actually build — keep it narrow and working)

Do not attempt to integrate real government systems. Instead:

- Build **3 mock "department" services**, each simulating a different legacy shape:
  - **Dept A — "Skill Certification Board"**: REST/JSON API, PostgreSQL.
  - **Dept B — "Employment Registry"**: simulate a legacy shape by exposing SOAP-style XML over HTTP (or a quirky flat-file/CSV export endpoint).
  - **Dept C — "Grievance Cell"**: REST/JSON API but with completely different field names/identifiers for the same citizen (e.g. `applicant_id` vs `citizen_uid` vs `beneficiary_code`) — this is what proves the need for master data management.
- Build the **interoperability middleware layer** described in Section 3.
- Build **one complete end-to-end citizen journey** through all three departments (see Section 6 — Demo Script) rather than shallow coverage of many flows.

---

## 3. Final architecture

```
[Dept A API] [Dept B XML API] [Dept C API] [Citizen mobile/web]
        \         |            /                |
         \        |           /                 |
       [Connector / Adapter Layer]      [API Gateway: Kong/APISIX]
                    |                            |
                    +------------ [API Gateway] -+
                                    |
        +---------------+----------+----------+---------------+
        |               |                     |               |
[Identity/Consent] [Event Bus]        [Master Data Mgmt]  [Workflow Engine]
   (Keycloak)     (Redis/Kafka)         (Postgres +          (Camunda/n8n)
                                        matching logic)
        |               |                     |               |
        +-------+-------+---------------------+-------+-------+
                |                                     |
     [Audit log, RBAC, data-quality checks, exception handling, monitoring]
                |                                     |
     [Citizen Unified Tracker Portal]      [Official Consolidated Dashboard]
```

---

## 4. Tech stack (final — use exactly this unless a component genuinely blocks you)

| Layer | Technology | Notes |
|---|---|---|
| Mock department backends | Node.js + Express (Dept A, C), simple XML-emitting Express service (Dept B) | Each with its own Postgres/SQLite DB and deliberately different schema |
| Adapter / connector layer | Node.js services, one per department, each exposing a normalized REST interface + transforming to/from the canonical schema | This is the "reusable connector" requirement — make it pluggable (strategy pattern) |
| API gateway | Kong (Docker) or Apache APISIX | JWT validation, rate limiting, routing to adapters |
| Identity & SSO | Keycloak (Docker), OIDC | One realm, one citizen login working across all department-facing UIs |
| Consent management | Custom Node.js service + Postgres table (`consent_grants`) modeled loosely on the Account Aggregator / DEPA consent-artifact pattern | Citizen approves/revokes department-to-department data sharing; every access checked against an active consent record |
| Event bus / notifications | Redis Pub/Sub (fastest to stand up) or Redpanda if team wants Kafka-compatible | Publish `application.status_changed`, `document.verified`, etc.; a notification service consumes and mocks SMS/email |
| Master data management | Postgres canonical tables + a matching/dedup service (rule-based: fuzzy match on name+DOB+mobile, or exact match on a canonical citizen ID) | Produces one "golden record" per citizen across departments |
| Workflow orchestration | Camunda (BPMN, Docker) or n8n | Model at least one multi-department approval workflow visually |
| Data standards / canonical schema | JSON Schema definitions checked into `/schemas`, one per entity (Citizen, Application, Grievance) | Reference IndEA / DIGIT conventions in comments |
| Audit logging | Append-only Postgres table `audit_log` (actor, action, entity, timestamp, before/after) written via a shared middleware in every service | |
| RBAC | Roles enforced via Keycloak roles + a middleware checking role claims on every gateway-routed request | Roles: `citizen`, `dept_official`, `admin` |
| Data-quality checks | Validation layer in the adapter (schema validation + null/format checks) that flags bad records into an `exceptions` table instead of silently passing them | |
| Exception handling | `exceptions` service/table + a retry queue for failed sync events | Surface these on the dashboard |
| Monitoring dashboard | React + Recharts, pulling from a metrics endpoint (Prometheus optional; a simple `/metrics` aggregation endpoint is enough for a demo) | Show: pending applications, average processing time, SLA breaches, exception count |
| Citizen portal | React + Tailwind | Login via Keycloak, unified tracker view, consent screen |
| Official dashboard | React + Tailwind | Consolidated view across all 3 mock departments, monitoring charts |
| Containerization | Docker Compose, single `docker-compose.yml` bringing up all services | This is what you'll actually demo from |

---

## 5. Build phases (execute in this order)

**Phase 0 — Scaffolding**
- Create a monorepo with folders: `dept-a/`, `dept-b/`, `dept-c/`, `adapters/`, `gateway/`, `identity/` (Keycloak config), `consent-service/`, `event-bus/`, `mdm-service/`, `workflow/`, `audit-service/`, `citizen-portal/`, `official-dashboard/`, `schemas/`, `docker-compose.yml`.
- Write the canonical JSON Schemas first (`schemas/citizen.json`, `schemas/application.json`, `schemas/grievance.json`) — every adapter maps into these.

**Phase 1 — Mock departments**
- Dept A: citizens apply for skill certification. Fields: `citizen_uid, name, dob, mobile, course_id, status`.
- Dept B: employment registry, deliberately returns XML with fields: `<ApplicantID>, <FullName>, <DOB>, <Phone>, <JobRefNo>, <CurrentStatus>`.
- Dept C: grievance cell. Fields: `beneficiary_code, applicant_name, date_of_birth, contact_no, complaint_id, resolution_status`.
- Seed each with 5-10 sample records including at least 2 citizens who appear in all three departments under different identifiers (this is the interoperability payoff you'll demo).

**Phase 2 — Adapter/connector layer**
- One Node.js adapter per department. Each exposes: `GET /normalized/applications`, `GET /normalized/citizen/:canonicalId`, `POST /normalized/status-update`.
- Each adapter transforms department-native format ↔ canonical schema, and runs data-quality validation, writing failures to the `exceptions` table.

**Phase 3 — API gateway + identity**
- Stand up Keycloak with roles `citizen`, `dept_official`, `admin`. One test citizen user, one official per department.
- Configure Kong/APISIX to route `/api/deptA/*`, `/api/deptB/*`, `/api/deptC/*` to the respective adapters, validating the Keycloak-issued JWT on every call.

**Phase 4 — Master data management**
- Build the matching service: given records from all 3 adapters, match on (name similarity + DOB + mobile last-4) to produce a `golden_citizen` record with a canonical ID, linking all department-specific IDs to it.
- Expose `GET /mdm/citizen/:canonicalId/full-profile` returning the merged view across departments.

**Phase 5 — Consent service**
- Table `consent_grants(citizen_id, granting_dept, requesting_dept, data_scope, status, granted_at, expires_at)`.
- API: citizen grants/revokes consent; MDM/adapter calls check for an active grant before cross-department reads.
- Every consent action and every consent-gated data access is written to `audit_log`.

**Phase 6 — Event bus & notifications**
- On any status change in Dept A/B/C, publish an event. A notification-service subscriber logs a mock SMS/email ("Notification sent to +91XXXXX: Your grievance status changed to Resolved").

**Phase 7 — Workflow orchestration**
- Model one BPMN workflow in Camunda: "Skill certificate → auto-check employment registry status → auto-check no pending grievance → final approval." Show this diagram live — it's your strongest "configurable, no-code" proof point.

**Phase 8 — Frontends**
- Citizen portal: SSO login → unified tracker (all 3 dept statuses in one screen, using canonical ID) → consent management screen.
- Official dashboard: cross-department applicant search, SLA/processing-time charts, exceptions list, audit log viewer.

**Phase 9 — Docker Compose + demo polish**
- Single `docker-compose up` should bring up: Postgres (x3 or 1 with multiple schemas), Keycloak, Redis, Kong, Camunda, all Node services, both React apps.
- Seed script that resets demo data to a known state before each run.

---

## 6. Demo script (what you show on stage — rehearse this exact sequence)

1. **Show the problem**: pull up Dept A, B, C's raw data for the same citizen — show mismatched IDs and formats.
2. **Citizen logs in once** (Keycloak SSO) → lands on unified tracker → sees all 3 department statuses under one profile, no re-login.
3. **Citizen grants consent** for Dept C (Grievance Cell) to pull a verified document from Dept A (Skill Board) instead of re-uploading it — show the consent toggle and the audit trail entry it creates.
4. **Trigger a status change** in Dept A → show real-time notification firing via the event bus, and the unified tracker updating live.
5. **Show the Camunda workflow diagram** running the cross-department approval check.
6. **Switch to the official dashboard** → show the consolidated applicant view, SLA compliance chart, and an intentionally-broken record landing in the exceptions queue (data-quality check working).
7. **Close on the audit log** — every consent grant, data access, and status change traceable to an actor and timestamp.

---

## 7. Judging-alignment talking points (say these explicitly in your pitch)

- "We don't replace legacy systems — the adapter layer is pluggable per department, proven by our 3 structurally different mock departments (JSON, XML, mismatched field names)."
- "Consent model is inspired by India's Account Aggregator / DEPA framework, not a custom ad-hoc permission system."
- "Identity federation via Keycloak/OIDC — standards-based, not proprietary."
- "Workflow is configurable via BPMN in Camunda, not hardcoded — a new department can be onboarded by adding an adapter + updating the workflow diagram, no core rewrite."
- "Every cross-department read is consent-gated and audit-logged — addresses the accountability concern government reviewers raise first."
- Reference **IndEA (India Enterprise Architecture)** and **DIGIT (eGov Foundation)** as the real-world precedents this design follows.

---

## 8. Non-functional requirements checklist (map directly to PS "Expected Solution")

- [ ] API-based exchange — Done via gateway + adapters
- [ ] Common data standards — Done via `/schemas` canonical JSON Schemas
- [ ] Master-data management — Done via MDM matching service
- [ ] Consent-based data sharing — Done via consent service
- [ ] SSO / federated identity — Done via Keycloak
- [ ] Event-driven notifications — Done via Redis pub/sub + notification service
- [ ] Unified application tracking — Done via citizen portal
- [ ] Configurable workflow orchestration — Done via Camunda BPMN
- [ ] Reusable connectors — Done via pluggable adapter pattern
- [ ] Audit logs — Done via `audit_log` table + viewer
- [ ] Role-based access control — Done via Keycloak roles + gateway middleware
- [ ] Data-quality checks — Done via adapter validation layer
- [ ] Exception handling — Done via `exceptions` table + dashboard queue
- [ ] Monitoring dashboards — Done via official dashboard charts

---

## 9. Instruction to the AI coding agent

When executing this prompt: work phase by phase in the order given in Section 5. After each phase, run and verify the service boots before moving to the next. Prioritize Phases 1–5 and 8 if time is short (mock depts, adapters, gateway+identity, MDM, citizen portal) — these alone demonstrate the core interoperability claim. Camunda (Phase 7) and the full monitoring dashboard (Phase 8 official side) can be simplified to a static diagram / basic chart if time runs out, but do not cut consent, SSO, or audit logging — those are the differentiators judges will ask about.
