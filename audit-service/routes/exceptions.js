const express = require('express');
const router = express.Router();

// POST /exceptions
router.post('/', (req, res, next) => {
  try {
    const { source, entityType, entityId, errorType, errorMessage, rawData } = req.body;
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
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    
    const exceptions = req.db.prepare(query).all(...params);
    res.json(exceptions);
  } catch (err) {
    next(err);
  }
});

// PATCH /exceptions/:id
router.patch('/:id', (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;
    
    if (!['RESOLVED', 'RETRY', 'IGNORED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const row = req.db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
    console.log('Exception row before update:', row);
    
    const stmt = req.db.prepare(`
      UPDATE exceptions 
      SET status = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(status, id);
    console.log('Update result:', result);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Exception not found' });
    }
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /exceptions/stats
router.get('/stats', (req, res, next) => {
  try {
    const db = req.db;
    const byStatus = db.prepare('SELECT status, count(*) as count FROM exceptions GROUP BY status').all();
    const bySource = db.prepare('SELECT source, count(*) as count FROM exceptions GROUP BY source').all();
    
    res.json({
      byStatus,
      bySource
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
