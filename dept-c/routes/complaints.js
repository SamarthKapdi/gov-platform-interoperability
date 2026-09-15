const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { beneficiary_code, resolution_status } = req.query;
    let query = 'SELECT * FROM complaints WHERE 1=1';
    const params = [];

    if (beneficiary_code) {
      query += ' AND beneficiary_code = ?';
      params.push(beneficiary_code);
    }
    if (resolution_status) {
      query += ' AND resolution_status = ?';
      params.push(resolution_status);
    }

    const complaints = req.db.prepare(query).all(params);
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:complaint_id', (req, res) => {
  try {
    const complaint = req.db.prepare('SELECT * FROM complaints WHERE complaint_id = ?').get(req.params.complaint_id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { beneficiary_code, category, subject, description } = req.body;
    if (!beneficiary_code || !category || !subject || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const count = req.db.prepare('SELECT COUNT(*) as c FROM complaints').get().c;
    const complaint_id = `CMP-${3001 + count}`;
    const resolution_status = 'filed';
    const filed_on = new Date().toISOString().split('T')[0];
    const last_updated = filed_on;
    const assigned_to = null;

    req.db.prepare(`
      INSERT INTO complaints (complaint_id, beneficiary_code, category, subject, description, resolution_status, filed_on, last_updated, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(complaint_id, beneficiary_code, category, subject, description, resolution_status, filed_on, last_updated, assigned_to);

    res.status(201).json({ complaint_id, message: 'Complaint filed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:complaint_id/status', (req, res) => {
  try {
    const { complaint_id } = req.params;
    const { resolution_status, assigned_to } = req.body;
    
    if (!resolution_status) {
      return res.status(400).json({ error: 'resolution_status is required' });
    }

    const last_updated = new Date().toISOString().split('T')[0];
    
    const info = req.db.prepare(`
      UPDATE complaints 
      SET resolution_status = ?, assigned_to = COALESCE(?, assigned_to), last_updated = ? 
      WHERE complaint_id = ?
    `).run(resolution_status, assigned_to || null, last_updated, complaint_id);

    if (info.changes === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    res.json({ message: 'Complaint updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
