const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  try {
    const beneficiaries = req.db.prepare('SELECT * FROM beneficiaries').all();
    res.json(beneficiaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:beneficiary_code', (req, res) => {
  try {
    const beneficiary = req.db.prepare('SELECT * FROM beneficiaries WHERE beneficiary_code = ?').get(req.params.beneficiary_code);
    if (!beneficiary) {
      return res.status(404).json({ error: 'Beneficiary not found' });
    }
    res.json(beneficiary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
