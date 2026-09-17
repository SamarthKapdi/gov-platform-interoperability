# MAHA-SETU API Documentation

All API requests MUST be routed through the API Gateway at `http://localhost:3000`. 
Authenticated routes require a JWT in the `Authorization` header: `Bearer <token>`.

## 1. Gateway Services

### Health Check
* **Method & Path**: `GET /health`
* **Description**: Returns the health status of the Gateway and all registered microservices.
* **Auth Required**: No
* **Response**:
```json
{
  "status": "healthy",
  "services": {
    "identity": "up",
    "mdm": "up"
  }
}
```

### List Services
* **Method & Path**: `GET /api/services`
* **Description**: Returns the registry of all internal services and their base URLs.
* **Auth Required**: Yes

## 2. Identity Service

### Login
* **Method & Path**: `POST /api/auth/login`
* **Description**: Authenticates a user and returns a JWT.
* **Auth Required**: No
* **Request Body**:
```json
{
  "username": "admin",
  "password": "password123"
}
```

### List Users
* **Method & Path**: `GET /api/auth/users`
* **Description**: Retrieves a list of simulated users.
* **Auth Required**: Yes

### OIDC Configuration
* **Method & Path**: `GET /.well-known/openid-configuration`
* **Description**: Returns the OIDC discovery document (prototype implementation).
* **Auth Required**: No

## 3. Master Data Management (MDM) Service

### Fuzzy Match
* **Method & Path**: `POST /match`
* **Description**: Compares two records and returns a match probability score.
* **Auth Required**: Yes

### List Citizens
* **Method & Path**: `GET /citizens`
* **Description**: Retrieves a list of all identified citizens (Golden Records).
* **Auth Required**: Yes

### Get Citizen
* **Method & Path**: `GET /citizen/:id`
* **Description**: Retrieves the basic golden record for a citizen.
* **Auth Required**: Yes

### Get Full Profile
* **Method & Path**: `GET /citizen/:id/full-profile`
* **Description**: Retrieves aggregated citizen data from all departments (enforces consent).
* **Auth Required**: Yes

### Search Citizen
* **Method & Path**: `GET /search?q={query}`
* **Description**: Searches for citizens by name or ID.
* **Auth Required**: Yes

## 4. Consent Service

### Get Citizen Consent
* **Method & Path**: `GET /citizen/:id`
* **Description**: Retrieves all active consent grants for a citizen.
* **Auth Required**: Yes

### Grant Consent
* **Method & Path**: `POST /grant`
* **Description**: Records a new consent grant.
* **Auth Required**: Yes (Citizen)

### Revoke Consent
* **Method & Path**: `POST /revoke`
* **Description**: Revokes an existing consent grant.
* **Auth Required**: Yes (Citizen)

## 5. Workflow Engine

### List Instances
* **Method & Path**: `GET /instances`
* **Description**: Retrieves all active workflow instances.
* **Auth Required**: Yes

### Create Instance
* **Method & Path**: `POST /instances`
* **Description**: Starts a new cross-departmental workflow.
* **Auth Required**: Yes

### Get Instance
* **Method & Path**: `GET /instances/:id`
* **Description**: Retrieves details and current status of a specific workflow.
* **Auth Required**: Yes

### Advance Workflow
* **Method & Path**: `POST /instances/:id/advance`
* **Description**: Moves a workflow to its next logical state.
* **Auth Required**: Yes (Official)

## 6. Event Bus

### Publish Event
* **Method & Path**: `POST /events/publish`
* **Description**: Internal endpoint to publish an asynchronous event.
* **Auth Required**: Yes (Internal)

### Get Recent Events
* **Method & Path**: `GET /events/recent`
* **Description**: Retrieves the most recent system events.
* **Auth Required**: Yes (Official)

### Get Citizen Events
* **Method & Path**: `GET /events/citizen/:id`
* **Description**: Retrieves events specific to a citizen's timeline.
* **Auth Required**: Yes

## 7. Audit Service

### Log Action
* **Method & Path**: `POST /log`
* **Description**: Internal endpoint to record an audit log entry.
* **Auth Required**: Yes (Internal)

### Get Logs
* **Method & Path**: `GET /logs`
* **Description**: Retrieves paginated audit logs.
* **Auth Required**: Yes (Official)

### Log Exception
* **Method & Path**: `POST /exceptions`
* **Description**: Records a security or system exception (e.g., unauthorized access attempt).
* **Auth Required**: Yes (Internal)

### Get Exceptions
* **Method & Path**: `GET /exceptions`
* **Description**: Retrieves all active system exceptions.
* **Auth Required**: Yes (Official)

### Acknowledge Exception
* **Method & Path**: `PATCH /exceptions/:id`
* **Description**: Marks an exception as acknowledged/resolved.
* **Auth Required**: Yes (Official)

### Get Metrics
* **Method & Path**: `GET /metrics`
* **Description**: Retrieves aggregated platform metrics for dashboards.
* **Auth Required**: Yes (Official)
