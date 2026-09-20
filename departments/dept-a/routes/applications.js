const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { citizen_uid } = req.query;
    let applications;
    if (citizen_uid) {
      applications = req.db.prepare('SELECT * FROM applications WHERE citizen_uid = ?').all(citizen_uid);
    } else {
      applications = req.db.prepare('SELECT * FROM applications').all();
    }
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const application = req.db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { citizen_uid, course_id, course_name } = req.body;
    
    // Check if citizen exists
    const citizen = req.db.prepare('SELECT * FROM citizens WHERE citizen_uid = ?').get(citizen_uid);
    if (!citizen) {
      return res.status(400).json({ error: 'Invalid citizen_uid' });
    }

    const now = new Date().toISOString();
    const result = req.db.prepare(`
      INSERT INTO applications (citizen_uid, course_id, course_name, status, applied_at, updated_at, remarks)
      VALUES (?, ?, ?, 'submitted', ?, ?, '')
    `).run(citizen_uid, course_id, course_name, now, now);

    res.status(201).json({ id: result.lastInsertRowid, status: 'submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status, remarks } = req.body;
    const now = new Date().toISOString();
    
    const result = req.db.prepare(`
      UPDATE applications 
      SET status = ?, remarks = ?, updated_at = ?
      WHERE id = ?
    `).run(status, remarks || '', now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
