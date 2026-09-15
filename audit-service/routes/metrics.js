const express = require('express');
const router = express.Router();

// GET /metrics
router.get('/', (req, res, next) => {
  try {
    const db = req.db;
    
    const totalAuditEntries = db.prepare('SELECT count(*) as count FROM audit_log').get().count;
    
    const exceptionsByStatus = db.prepare('SELECT status, count(*) as count FROM exceptions GROUP BY status').all();
    const totalExceptions = {};
    for (const row of exceptionsByStatus) {
      totalExceptions[row.status] = row.count;
    }
    
    const recentActivity = db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10').all();
    
    res.json({
      totalAuditEntries,
      totalExceptions,
      recentActivity
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
