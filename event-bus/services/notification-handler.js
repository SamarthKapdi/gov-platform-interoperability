const publisher = require('./publisher');

const { logException } = require('@sih/shared/validation');

function handleEvents(db) {
  publisher.subscribe((payload) => {
    const { type, department, citizenId, data } = payload;
    
    let message = '';
    let channel = 'sms';
    let recipient = '';

    if (type === 'application.status_changed') {
      message = `Your ${data.applicationType || 'application'} status changed to ${data.newStatus}`;
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
    } else if (type === 'document.verified') {
      message = `Your document ${data.documentId || ''} has been verified`;
      channel = 'sms';
      recipient = '+91XXXXXXXXXX';
    } else if (type === 'grievance.updated') {
      message = `Your grievance status changed to ${data.newStatus}`;
      channel = 'sms';
      recipient = '+91XXXXXXXXXX';
    }

    if (message) {
      processNotification(db, { citizenId, channel, recipient, message, type }, payload, 1);
    }
  });
}

function processNotification(db, notif, rawPayload, attempt) {
  // Simulate occasional network failure for demo/retry purposes
  const simulateFailure = Math.random() < 0.1; // 10% chance to fail

  if (simulateFailure) {
    if (attempt < 3) {
      console.log(`[Notification Mock] Delivery failed (Attempt ${attempt}). Retrying...`);
      setTimeout(() => processNotification(db, notif, rawPayload, attempt + 1), 2000);
      return;
    } else {
      console.error(`[Notification Mock] Delivery failed permanently after 3 retries. Dead-lettering to exceptions.`);
      
      const stmt = db.prepare(`
        INSERT INTO exceptions (source, entity_type, entity_id, error_type, error_message, raw_data, status, retry_count)
        VALUES (?, ?, ?, ?, ?, ?, 'OPEN', ?)
      `);
      stmt.run(
        'event-bus',
        'notification',
        notif.citizenId || null,
        'DELIVERY_FAILURE',
        'Failed to deliver notification after 3 attempts',
        JSON.stringify(rawPayload),
        3
      );
      return;
    }
  }

  console.log(`[Notification Mock] ${notif.channel.toUpperCase()} sent to ${notif.recipient}: ${notif.message}`);
  
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

module.exports = { handleEvents };
