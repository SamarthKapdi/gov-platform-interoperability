const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  router.get('/', (req, res) => {
    const { citizen_id, limit = 50 } = req.query;

    let query = 'SELECT * FROM notifications';
    const params = [];

    if (citizen_id) {
      query += ' WHERE citizen_id = ?';
      params.push(citizen_id);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    try {
      const notifications = db.prepare(query).all(...params);
      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/stats', (req, res) => {
    try {
      const byChannel = db.prepare('SELECT channel, COUNT(*) as count FROM notifications GROUP BY channel').all();
      const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM notifications GROUP BY status').all();
      
      res.json({ byChannel, byStatus });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
