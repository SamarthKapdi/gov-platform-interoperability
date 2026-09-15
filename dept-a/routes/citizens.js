const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const citizens = req.db.prepare('SELECT * FROM citizens').all();
    res.json(citizens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:citizen_uid', (req, res) => {
  try {
    const citizen = req.db.prepare('SELECT * FROM citizens WHERE citizen_uid = ?').get(req.params.citizen_uid);
    if (!citizen) {
      return res.status(404).json({ error: 'Citizen not found' });
    }
    res.json(citizen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
