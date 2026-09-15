const express = require('express');
const router = express.Router();
const { writeAuditLog, queryAuditLog } = require('@sih/shared/audit');

// POST /audit/log
router.post('/log', (req, res, next) => {
  try {
    const entry = req.body;
    // writeAuditLog(db, entry) expects entry to have actor, actorRole, action, entityType, entityId, department, before, after, metadata
    const result = writeAuditLog(req.db, entry);
    res.status(201).json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    next(err);
  }
});

// GET /audit/logs
router.get('/logs', (req, res, next) => {
  try {
    const filters = {
      actor: req.query.actor,
      action: req.query.action,
      entityType: req.query.entityType,
      entityId: req.query.entityId,
      department: req.query.department,
      limit: parseInt(req.query.limit, 10) || 50,
      offset: parseInt(req.query.offset, 10) || 0
    };
    const logs = queryAuditLog(req.db, filters);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

// GET /audit/logs/stats
router.get('/logs/stats', (req, res, next) => {
  try {
    const db = req.db;
    const totalEntries = db.prepare('SELECT count(*) as count FROM audit_log').get().count;
    const byAction = db.prepare('SELECT action, count(*) as count FROM audit_log GROUP BY action').all();
    const byDepartment = db.prepare('SELECT department, count(*) as count FROM audit_log GROUP BY department').all();
    
    res.json({
      totalEntries,
      byAction,
      byDepartment
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
