# MAHA-SETU: Real Database Schema Inventory

This document outlines the precise database schemas for every SQLite file in the federated architecture, strictly proving that the system operates identically to a real production environment (without hardcoded JSON logic).

### 1. Identity Service (`identity.db`)
- **Service**: `identity-service`
- **Path**: `identity/data/identity.db`
- **Table: `users`**
  - **Purpose**: Core IAM and Authentication storage.
  - **Columns**:
    - `id` (TEXT PRIMARY KEY) - UUID.
    - `username` (TEXT UNIQUE)
    - `password_hash` (TEXT)
    - `name` (TEXT)
    - `email` (TEXT)
    - `mobile` (TEXT)
    - `role` (TEXT) - `admin`, `citizen`, `dept_official`
    - `department` (TEXT) - Nullable, ties official to a dept.
    - `is_active` (INTEGER)
    - `created_at` (TEXT)

### 2. MDM Service (`mdm.db`)
- **Service**: `mdm-service`
- **Path**: `mdm-service/data/mdm.db`
- **Table: `golden_citizens`**
  - **Purpose**: The canonical unified profile for citizens.
  - **Columns**:
    - `canonical_id` (TEXT PRIMARY KEY)
    - `name` (TEXT)
    - `date_of_birth` (TEXT)
    - `mobile` (TEXT)
    - `email` (TEXT)
    - `address` (TEXT)
    - `confidence_score` (REAL)
    - `created_at` (TEXT)
    - `updated_at` (TEXT)
- **Table: `department_links`**
  - **Purpose**: Maps the canonical citizen to isolated source-system records.
  - **Columns**:
    - `canonical_id` (TEXT, FK to `golden_citizens`)
    - `department` (TEXT) - e.g., 'DEPT_A'
    - `department_id` (TEXT) - The source system ID (e.g., `SKB-1001`)
    - `department_id_field` (TEXT)
    - `linked_at` (TEXT)
  - **Constraints**: PRIMARY KEY (`canonical_id`, `department`, `department_id`)

### 3. Consent Service (`consent.db`)
- **Service**: `consent-service`
- **Path**: `consent-service/data/consent.db`
- **Table: `consent_grants`**
  - **Purpose**: DEPA-compliant cryptographic consent ledger.
  - **Columns**:
    - `id` (TEXT PRIMARY KEY)
    - `citizen_id` (TEXT)
    - `granting_dept` (TEXT)
    - `requesting_dept` (TEXT)
    - `data_scope` (TEXT)
    - `status` (TEXT) - ACTIVE, PENDING, REVOKED, EXPIRED
    - `purpose` (TEXT)
    - `granted_at` (TEXT)
    - `revoked_at` (TEXT)
    - `expires_at` (TEXT)
    - `created_by` (TEXT)
- **Table: `consent_access_log`**
  - **Purpose**: Tracks every time protected data is fetched via consent.
  - **Columns**:
    - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
    - `consent_id` (TEXT)
    - `accessor_id` (TEXT)
    - `accessed_at` (TEXT)
    - `ip_address` (TEXT)

### 4. Workflow Service (`workflow.db`)
- **Service**: `workflow-service`
- **Path**: `workflow/data/workflow.db`
- **Table: `workflow_instances`**
  - **Purpose**: Tracks application state machines.
  - **Columns**:
    - `id` (TEXT PRIMARY KEY)
    - `application_id` (TEXT)
    - `citizen_id` (TEXT)
    - `current_state` (TEXT)
    - `previous_state` (TEXT)
    - `owner` (TEXT)
    - `created_at` (TEXT)
    - `updated_at` (TEXT)
- **Table: `service_outputs`**
  - **Purpose**: The final immutable output / certificate resulting from a workflow.
  - **Columns**:
    - `id` (TEXT PRIMARY KEY)
    - `application_id` (TEXT)
    - `service_id` (TEXT)
    - `issued_at` (TEXT)
    - `issued_by` (TEXT)
    - `verification_code` (TEXT)
    - `status` (TEXT)

### 5. Event Bus (`events.db`)
- **Service**: `event-bus`
- **Path**: `event-bus/data/events.db`
- **Table: `notifications`**
  - **Purpose**: Tracks alerts triggered by events.
  - **Columns**:
    - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
    - `citizen_id` (TEXT)
    - `channel` (TEXT)
    - `recipient` (TEXT)
    - `message` (TEXT)
    - `event_type` (TEXT)
    - `sent_at` (TEXT)
    - `status` (TEXT)
- **Table: `event_log`**
  - **Purpose**: Absolute ledger of pub-sub events.
  - **Columns**:
    - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
    - `event_type` (TEXT)
    - `payload` (TEXT) - JSON Dump
    - `source` (TEXT)
    - `created_at` (TEXT)

### 6. Audit & Exceptions Service (`audit.db`)
- **Service**: `audit-service`
- **Path**: `audit-service/data/audit.db`
- **Table: `audit_log`**
  - **Purpose**: Security auditing and system action verification.
  - **Columns**:
    - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
    - `timestamp` (TEXT)
    - `action` (TEXT)
    - `actor` (TEXT)
    - `entity_type` (TEXT)
    - `entity_id` (TEXT)
    - `old_state` (TEXT)
    - `new_state` (TEXT)
    - `metadata` (TEXT)
    - `ip_address` (TEXT)
- **Table: `exceptions`**
  - **Purpose**: Centralized Dead Letter Queue and failure tracking.
  - **Columns**:
    - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
    - `timestamp` (TEXT)
    - `source` (TEXT)
    - `entity_type` (TEXT)
    - `entity_id` (TEXT)
    - `error_type` (TEXT)
    - `error_message` (TEXT)
    - `raw_data` (TEXT)
    - `status` (TEXT) - FAILED, RETRY, RESOLVED
    - `retry_count` (INTEGER)
    - `resolution_notes` (TEXT)

### 7. Department Simulators (Source Systems)
These databases prove the adapters can pull from isolated schemas safely.
- **`dept-a.db`**: Table `citizens` and `applications`. Fields: `citizen_uid`, `name`, `course_id`.
- **`dept-b.db`**: Table `applicants` and `job_applications`. Fields: `applicant_id`, `full_name`. (Returned natively as XML before adapter conversion).
- **`dept-c.db`**: Table `beneficiaries` and `complaints`. Fields: `beneficiary_code`, `applicant_name`.
