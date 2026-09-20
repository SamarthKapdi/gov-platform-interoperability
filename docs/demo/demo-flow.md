# MAHA-SETU 3-Minute Demo Flow

## 0:00 - 0:30 | Introduction & Golden Record
* **Action**: Open the Official Dashboard (`http://localhost:5174`). Log in as `admin`.
* **Click**: Navigate to the "Golden Record" section.
* **Say**: "Welcome to MAHA-SETU, a federated interoperability platform. Instead of replacing existing departmental databases, our platform connects them. Here, our MDM engine resolves identities across multiple departments using fuzzy matching to create a 'Golden Record' for citizens."
* **Judge Sees**: A unified dashboard showing citizens. The presenter clicks on a citizen to show aggregated details pulled dynamically from underlying simulated legacy systems.

## 0:30 - 1:00 | Interoperability & Adapters
* **Action**: Navigate to the "Interoperability & Adapters" page.
* **Click**: Expand the logs for 'Adapter B' (XML).
* **Say**: "We achieve this via adapters. For example, Department B operates on legacy XML. Our adapter catches the XML payload, translates it to the IndEA canonical JSON standard, and passes it to the Gateway. The core system only ever speaks standard JSON."
* **Judge Sees**: Live logs demonstrating an XML payload being transformed into a JSON payload.

## 1:00 - 1:45 | Consent & The Citizen Experience
* **Action**: Open an incognito window. Open the Citizen Portal (`http://localhost:5173`). Log in as `citizen`.
* **Click**: Attempt an action that requires consent on the Official dashboard. Then, show the Citizen portal's "Consent Manager".
* **Say**: "Data sharing is entirely consent-driven. If an official tries to view a restricted dataset, it is blocked. The citizen must explicitly grant consent. Here, the citizen reviews the request, grants it, and immediately the official dashboard is unblocked via real-time event updates."
* **Judge Sees**: A blocked access attempt on the Official Dashboard. The citizen grants consent in the Citizen Portal. The Official Dashboard immediately reflects the granted access.

## 1:45 - 2:15 | Cross-Departmental Workflows & Exceptions (Dead Letter Queue)
* **Action**: Navigate to "Workflows" on the Official Dashboard.
* **Click**: "Advance Step" on a pending Business Registration workflow.
* **Say**: "Complex processes often span multiple departments. Our workflow engine orchestrates these state machines. When I advance this, the Workflow service updates its state and fires an event to the Event Bus."
* **Action**: Now, open a new browser window/incognito session and log in as `admin`. Open the "Demo Control Centre" and click **Simulate Dept B Outage**. Navigate back to the `official_a` window's Workflows and advance a workflow to the 'DEPT B VERIFICATION' state.
* **Say**: "But what happens if a department goes offline? Our Event Bus uses a webhook retry pattern. It will try 3 times, and upon permanent failure, route the event to a Dead Letter Queue."
* **Action**: Navigate to the "Exceptions" tab.
* **Judge Sees**: An active exception of type 'DELIVERY_FAILURE' in the Dead-Letter Queue.
* **Action**: Go back to the `admin` Demo Controls, click **Restore Dept B**. Go to Exceptions in the `official_a` window and click **FORCE RETRY**.
* **Say**: "Once the department is back online, the admin can force retry the dead-lettered event, ensuring resilient retry, dead-letter handling, and recovery."
* **Judge Sees**: The exception status changes from OPEN to RESOLVED.

## 2:15 - 2:45 | Audit, Events & Security
* **Action**: Navigate to the "Audit Ledger" tab.
* **Click**: Review the logs and security exceptions.
* **Say**: "Every action, including that workflow advancement and the consent grant, was asynchronously logged via our Event Bus. Furthermore, any unauthorized attempts are trapped and displayed as security exceptions, ensuring an append-oriented trail of accountability."
* **Judge Sees**: A read-only, timestamped ledger of the exact actions just performed during the demo.

## 2:45 - 3:00 | System Resilience & Architecture
* **Action**: Show the "System Health" component on the main dashboard. Briefly switch to the `Architecture` tab in the UI.
* **Say**: "Our microservices architecture ensures resilience. You can see the actual live health checks for every microservice. MAHA-SETU delivers secure, scalable, and standard-compliant interoperability for the future of governance."
* **Judge Sees**: A green/red status board of all microservices, proving the federated nature of the deployment.
