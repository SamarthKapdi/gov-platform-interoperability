const express = require('express');
const publisher = require('../services/publisher');

module.exports = (db) => {
  const router = express.Router();
  let clients = [];

  // Listen to publisher events to push to SSE clients
  publisher.subscribe((payload) => {
    clients.forEach(client => {
      // If client specified citizenId, filter events
      if (client.citizenId && client.citizenId !== payload.citizenId) {
        return;
      }
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    });
  });

  // Heartbeat to keep SSE alive
  setInterval(() => {
    clients.forEach(client => {
      client.res.write(': heartbeat\n\n');
    });
  }, 30000);

  router.post('/publish', (req, res) => {
    const { type, department, citizenId, data, source } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    const payload = {
      type,
      timestamp: new Date().toISOString(),
      department,
      citizenId,
      data,
      source
    };

    // Log to DB
    try {
      const stmt = db.prepare(`
        INSERT INTO event_log (event_type, payload, source, created_at)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(type, JSON.stringify(payload), source || 'unknown', payload.timestamp);
    } catch (err) {
      console.error('Failed to write event log to DB', err);
    }

    // Publish to Redis/In-memory
    publisher.publish(type, payload);

    res.status(200).json({ success: true, message: 'Event published', payload });
  });

  router.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const citizenId = req.query.citizenId;
    const client = { res, citizenId };
    
    clients.push(client);

    req.on('close', () => {
      clients = clients.filter(c => c !== client);
    });
  });

  router.get('/recent', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    try {
      const logs = db.prepare('SELECT * FROM event_log ORDER BY id DESC LIMIT ?').all(limit);
      const results = logs.map(l => ({ ...l, payload: JSON.parse(l.payload) }));
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/citizen/:citizenId', (req, res) => {
    const citizenId = req.params.citizenId;
    try {
      const logs = db.prepare('SELECT * FROM event_log WHERE payload LIKE ? ORDER BY id DESC').all(`%"citizenId":"${citizenId}"%`);
      const results = logs.map(l => ({ ...l, payload: JSON.parse(l.payload) }));
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/log', (req, res) => {
    const { type, department, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM event_log';
    const params = [];
    const conditions = [];

    if (type) {
      conditions.push('event_type = ?');
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(parseInt(limit, 10));

    try {
      const logs = db.prepare(query).all(...params);
      let results = logs.map(l => ({ ...l, payload: JSON.parse(l.payload) }));
      
      if (department) {
        results = results.filter(l => l.payload.department === department);
      }
      
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
