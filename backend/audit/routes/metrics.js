const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const db = req.db;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAuditCount = db.prepare('SELECT count(*) as count FROM audit_log WHERE timestamp >= ?').get(today).count;
    
    const exceptionsRows = db.prepare('SELECT status, count(*) as count FROM exceptions GROUP BY status').all();
    const exceptionsByStatus = { PENDING: 0, RETRY: 0, RESOLVED: 0, DEAD_LETTER: 0 };
    for (const row of exceptionsRows) {
      exceptionsByStatus[row.status] = row.count;
    }
    
    const consentEventsCount = db.prepare("SELECT count(*) as count FROM audit_log WHERE action LIKE '%CONSENT%'").get().count;
    const totalAuditEntries = db.prepare('SELECT count(*) as count FROM audit_log').get().count;
    
    res.json({
      todayAuditCount,
      exceptionsByStatus,
      exceptions: exceptionsByStatus, // Alias for frontend
      consentEventsCount,
      consentEvents: consentEventsCount, // Alias for frontend
      totalAuditEntries,
      count: totalAuditEntries, // Alias for frontend workflows count (mocked/fallback)
      workflows: totalAuditEntries // Alias for frontend workflows count (mocked/fallback)
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
