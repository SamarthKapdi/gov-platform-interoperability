const express = require('express');
const router = express.Router();
const client = require('../services/dept-client');
const transformer = require('../transformers/dept-c-transformer');
const { validate } = require('@sih/shared/validation');
const axios = require('axios');

async function handleExceptions(data, schemaName) {
  const result = validate(schemaName, data);
  if (result !== true) {
    try {
      // Assuming audit service has an endpoint for tracking exceptions across the system
      await axios.post(${process.env.AUDIT_URL || \'http://localhost:3070\'}/exceptions, {
        service: 'adapter-c',
        type: 'VALIDATION_ERROR',
        details: JSON.stringify(result),
        payload: JSON.stringify(data)
      });
    } catch (e) {
      console.error('Could not log exception to audit service', e.message);
    }
  }
}

router.get('/citizens', async (req, res) => {
  try {
    const rawData = await client.getBeneficiaries();
    const transformed = rawData.map(d => transformer.transformCitizen(d));
    for (const data of transformed) {
      await handleExceptions(data, 'citizen');
    }
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/citizen/:deptId', async (req, res) => {
  try {
    const rawData = await client.getBeneficiary(req.params.deptId);
    if (!rawData) return res.status(404).json({ error: 'Not found' });
    const transformed = transformer.transformCitizen(rawData);
    await handleExceptions(transformed, 'citizen');
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const rawData = await client.getComplaints();
    const transformed = rawData.map(d => transformer.transformApplication(d));
    for (const data of transformed) {
      await handleExceptions(data, 'application');
    }
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/grievances', async (req, res) => {
  try {
    const rawData = await client.getComplaints();
    const transformed = rawData.map(d => transformer.transformGrievance(d));
    for (const data of transformed) {
      await handleExceptions(data, 'grievance');
    }
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications/:citizenDeptId', async (req, res) => {
  try {
    const rawData = await client.getComplaintsByBeneficiary(req.params.citizenDeptId);
    const transformed = rawData.map(d => transformer.transformApplication(d));
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/status-update', async (req, res) => {
  try {
    const { complaintId, status } = req.body;
    
    // Map status back to dept format
    const reverseStatusMap = {
      'FILED': 'filed',
      'UNDER_REVIEW': 'under_review',
      'IN_PROGRESS': 'in_progress',
      'RESOLVED': 'resolved',
      'CLOSED': 'closed',
      'REOPENED': 'reopened'
    };
    
    const deptStatus = reverseStatusMap[status] || status;
    const result = await client.updateComplaintStatus(complaintId, deptStatus);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
