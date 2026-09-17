const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const STATES = [
  'SUBMITTED',
  'IDENTITY_VERIFIED',
  'DEPT_B_VERIFICATION',
  'GRIEVANCE_CHECK',
  'OFFICIAL_REVIEW',
  'APPROVED',
  'SERVICE_ISSUED'
];

const publishEvent = async (event) => {
  try {
    await fetch('http://localhost:3050/events/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  } catch (err) {
    console.error('Failed to publish event:', err.message);
  }
};

const logAudit = async (req, db, action, entityId, before, after, result) => {
  const actor = req.user ? req.user.name : 'SYSTEM';
  const role = req.user ? req.user.role : 'SYSTEM';
  
  // Also log locally just in case
  db.prepare(`
    INSERT INTO audit_log (actor, actor_role, action, entity_type, entity_id, before_state, after_state, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(actor, role, action, 'WORKFLOW', entityId, before, after, JSON.stringify({ result }));

  // Send to central audit service
  try {
    await fetch('http://localhost:3070/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actor,
        actorRole: role,
        action,
        entityType: 'WORKFLOW',
        entityId,
        before,
        after,
        metadata: { result }
      })
    });
  } catch (err) {
    console.error('Failed to send audit log to central service:', err.message);
  }
};

router.post('/instances', async (req, res) => {
  const db = req.app.locals.db;
  const { applicationId, citizenId, serviceName, department } = req.body;
  
  const id = uuidv4();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO workflow_instances (id, application_id, citizen_id, current_state, previous_state, owner, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, applicationId, citizenId, 'SUBMITTED', null, citizenId, now, now);
  
  const instance = db.prepare('SELECT * FROM workflow_instances WHERE id = ?').get(id);
  
  await publishEvent({
    type: 'workflow.created',
    department,
    citizenId,
    data: { serviceName, applicationId, id },
    source: 'workflow-service'
  });
  
  res.status(201).json(instance);
});

router.get('/instances', (req, res) => {
  const db = req.app.locals.db;
  const citizenId = req.query.citizen_id;
  
  let rows;
  if (citizenId) {
    rows = db.prepare('SELECT * FROM workflow_instances WHERE citizen_id = ? ORDER BY updated_at DESC').all(citizenId);
  } else {
    rows = db.prepare('SELECT * FROM workflow_instances ORDER BY updated_at DESC').all();
  }
  res.json(rows);
});

router.get('/instances/:id', (req, res) => {
  const db = req.app.locals.db;
  const instance = db.prepare('SELECT * FROM workflow_instances WHERE id = ?').get(req.params.id);
  if (!instance) return res.status(404).json({ error: 'Not found' });
  res.json(instance);
});

// Advance workflow
router.post('/instances/:id/advance', async (req, res) => {
  const db = req.app.locals.db;
  const instanceId = req.params.id;
  const actor = req.user ? req.user.name : 'SYSTEM';
  
  const instance = db.prepare('SELECT * FROM workflow_instances WHERE id = ?').get(instanceId);
  if (!instance) return res.status(404).json({ error: 'Instance not found' });
  
  const currentIndex = STATES.indexOf(instance.current_state);
  if (currentIndex === -1 || currentIndex === STATES.length - 1) {
    return res.status(400).json({ error: 'Cannot advance from current state' });
  }
  
  const nextState = STATES[currentIndex + 1];
  
  // Validation Rules
  if (nextState === 'DEPT_B_VERIFICATION') {
    // Requires consent for DEPT_B
    try {
      // We simulate checking consent via the Gateway
      // The API gateway will return 403 or strip data if consent is missing.
      // But here we directly ask the Consent service for this demo's precision.
      const consentRes = await fetch(`http://localhost:3040/citizen/${instance.citizen_id}`, {
        headers: { 'Authorization': req.headers.authorization }
      });
      const consents = await consentRes.json();
      
      const hasConsent = Array.isArray(consents) && consents.some(c => c.requesting_dept === 'DEPT_B' && c.status === 'ACTIVE');
      if (!hasConsent) {
        await logAudit(req, db, 'WORKFLOW_TRANSITION', instanceId, instance.current_state, nextState, 'BLOCKED');
        return res.status(409).json({ 
          error: 'WORKFLOW BLOCKED', 
          reason: 'Citizen consent required for Department B verification.' 
        });
      }
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Failed to verify consent constraints' });
    }
  }

  // Persist State
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE workflow_instances 
    SET previous_state = ?, current_state = ?, updated_at = ?
    WHERE id = ?
  `).run(instance.current_state, nextState, now, instanceId);

  // Emit event
  await publishEvent({
    type: 'workflow.transition.completed',
    payload: {
      workflow_id: instanceId,
      application_id: instance.application_id,
      old_state: instance.current_state,
      new_state: nextState,
      actor: actor,
      timestamp: now
    }
  });

  // Log audit
  await logAudit(req, db, 'WORKFLOW_TRANSITION', instanceId, instance.current_state, nextState, 'SUCCESS');

  const updatedInstance = db.prepare('SELECT * FROM workflow_instances WHERE id = ?').get(instanceId);
  res.json(updatedInstance);
});

module.exports = router;
