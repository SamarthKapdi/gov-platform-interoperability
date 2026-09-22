const express = require('express');
const router = express.Router();

// POST /exceptions
router.post('/', (req, res, next) => {
  try {
    const source = req.body.source || req.body.service || 'unknown';
    const entityType = req.body.entityType || req.body.entity_type || 'unknown';
    const entityId = req.body.entityId || req.body.entity_id || 'unknown';
    const errorType = req.body.errorType || req.body.type || 'unknown';
    const errorMessage = req.body.errorMessage || req.body.message || 'unknown';
    const rawData = req.body.rawData || req.body.raw_data;
    const stmt = req.db.prepare(`
      INSERT INTO exceptions (source, entity_type, entity_id, error_type, error_message, raw_data, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
    `);
    const result = stmt.run(
      source, 
      entityType, 
      entityId, 
      errorType, 
      errorMessage, 
      rawData ? JSON.stringify(rawData) : null
    );
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('Failed exception insert:', err);
    next(err);
  }
});

// GET /exceptions
router.get('/', (req, res, next) => {
  try {
    const { source, status, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM exceptions WHERE 1=1';
    const params = [];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const exceptions = req.db.prepare(query).all(...params);
    res.json(exceptions);
  } catch (err) {
    next(err);
  }
});

// PATCH /exceptions/:id
router.patch('/:id', (req, res, next) => {
  try {
    const { status } = req.body;
    
    const stmt = req.db.prepare(`
      UPDATE exceptions 
      SET status = ?, retry_count = retry_count + 1
      WHERE id = ?
    `);
    
    const result = stmt.run(status, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
    
    
    if (status === 'RETRY') {
      const exc = req.db.prepare('SELECT * FROM exceptions WHERE id = ?').get(req.params.id);
      if (exc && exc.raw_data) {
        try {
          const data = JSON.parse(exc.raw_data);
          if (data.url && data.payload) {
            // SECURITY CHECK: Only allow retry to known local services (adapters/departments)
            try {
              const parsedUrl = new URL(data.url);
              const allowedHosts = (process.env.ALLOWED_RETRY_HOSTS || '').split(',').filter(Boolean);
              allowedHosts.push('127.0.0.1', 'localhost');
              if (!allowedHosts.includes(parsedUrl.hostname)) {
                throw new Error('Forbidden URL');
              }
            } catch (e) {
               return res.status(403).json({ error: 'Untrusted webhook destination' });
            }

            fetch(data.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data.payload)
            }).catch(e => console.error('Failed to retry webhook:', e));
          }
        } catch (err) {
          console.error('Failed to parse raw_data for retry', err);
        }
      }
    }

    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
