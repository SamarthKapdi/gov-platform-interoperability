const publisher = require('./publisher');

function handleEvents(db) {
  publisher.subscribe((payload) => {
    const { type, department, citizenId, data } = payload;
    
    // 1. Citizen Notifications
    let message = '';
    let channel = 'sms';
    let recipient = '';

    if (type === 'workflow.created') {
      message = `Your ${data.serviceName} application (${data.applicationId}) has been submitted.`;
      channel = 'sms';
      recipient = '+91XXXXXXXXXX';
    } else if (type === 'workflow.transition.completed') {
      message = `Your application ${data.application_id} moved to ${data.new_state}`;
      channel = 'sms';
      recipient = '+91XXXXXXXXXX';
    } else if (type === 'consent.granted') {
      message = `Consent granted for ${department} to access your data`;
      channel = 'email';
      recipient = 'user@email.com';
    } else if (type === 'consent.revoked') {
      message = `Consent revoked for ${department} to access your data`;
      channel = 'email';
      recipient = 'user@email.com';
    }

    if (message) {
      logNotification(db, { citizenId, channel, recipient, message, type });
    }

    // 2. Department Webhooks (Cross-Department Event Sync)
    if (type === 'workflow.transition.completed' && data && data.new_state === 'DEPT_B_VERIFICATION') {
      const webhookPayload = {
        action: 'VERIFY_CITIZEN',
        applicationId: data.application_id,
        workflowId: data.workflow_id
      };
      // Send to Dept B
      deliverWebhook(db, 'http://127.0.0.1:3002/api/webhook', webhookPayload, 'DEPT_B', 1);
    }
  });
}

function logNotification(db, notif) {
  const stmt = db.prepare(`
    INSERT INTO notifications (citizen_id, channel, recipient, message, event_type, sent_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  try {
    stmt.run(
      notif.citizenId || 'unknown',
      notif.channel,
      notif.recipient,
      notif.message,
      notif.type,
      new Date().toISOString(),
      'sent'
    );
  } catch (err) {
    console.error('Failed to log notification to DB', err);
  }
}

async function deliverWebhook(db, url, payload, targetDept, attempt) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      timeout: 3000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    console.log(`[Webhook Delivery] Success to ${targetDept} on attempt ${attempt}`);
  } catch (err) {
    console.log(`[Webhook Delivery] Failed to ${targetDept} (Attempt ${attempt}): ${err.message}`);
    
    if (attempt < 3) {
      setTimeout(() => deliverWebhook(db, url, payload, targetDept, attempt + 1), 2000);
    } else {
      console.error(`[Webhook Delivery] Permanent failure. Dead-lettering to exceptions.`);
      try {
        await fetch('http://127.0.0.1:3070/exceptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: 'event-bus',
            entityType: 'webhook',
            entityId: payload.applicationId || 'unknown',
            errorType: 'DELIVERY_FAILURE',
            errorMessage: `Failed to deliver event to ${targetDept} after 3 attempts`,
            rawData: { url, payload, targetDept }
          })
        });
      } catch (dbErr) {
        console.error('Failed to write centralized exception:', dbErr);
      }
    }
  }
}

module.exports = { handleEvents, deliverWebhook };
