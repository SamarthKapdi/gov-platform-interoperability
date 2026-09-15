const express = require('express');
const router = express.Router();
const http = require('http');
const { validate } = require('@sih/shared/validation');
const deptClient = require('../services/dept-client');
const transformer = require('../transformers/dept-a-transformer'); // Pluggable transformer

// Log validation exceptions to audit service
async function logException(exceptionData) {
  const data = JSON.stringify(exceptionData);
  const req = http.request('http://localhost:3070/exceptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  });
  req.on('error', (e) => console.error('Error logging exception:', e));
  req.write(data);
  req.end();
}

// Validate against canonical schema and add warnings if any
async function validateAndTransform(data, transformFn, schemaName) {
  const canonicalData = transformFn(data);
  const validation = validate(schemaName, canonicalData);
  
  if (!validation.valid) {
    canonicalData._validationWarnings = validation.errors;
    
    // Asynchronously log the exception
    logException({
      source: 'adapter-a',
      type: 'VALIDATION_WARNING',
      description: `Data from Dept A failed canonical ${schemaName} validation`,
      data: canonicalData,
      errors: validation.errors,
      timestamp: new Date().toISOString()
    }).catch(() => {}); // ignore logging errors to not break the flow
  }
  
  return canonicalData;
}

// GET /normalized/citizens
router.get('/citizens', async (req, res) => {
  try {
    const deptCitizens = await deptClient.getCitizens();
    const canonicalCitizens = [];
    for (const citizen of deptCitizens) {
      canonicalCitizens.push(await validateAndTransform(citizen, transformer.citizenToCanonical, 'citizen'));
    }
    res.json(canonicalCitizens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /normalized/citizen/:deptId
router.get('/citizen/:deptId', async (req, res) => {
  try {
    const citizen = await deptClient.getCitizen(req.params.deptId);
    const canonicalCitizen = await validateAndTransform(citizen, transformer.citizenToCanonical, 'citizen');
    res.json(canonicalCitizen);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /normalized/applications
router.get('/applications', async (req, res) => {
  try {
    const deptApps = await deptClient.getApplications();
    const canonicalApps = [];
    for (const app of deptApps) {
      canonicalApps.push(await validateAndTransform(app, transformer.applicationToCanonical, 'application'));
    }
    res.json(canonicalApps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /normalized/applications/:citizenDeptId
router.get('/applications/:citizenDeptId', async (req, res) => {
  try {
    const deptApps = await deptClient.getApplicationsByCitizen(req.params.citizenDeptId);
    const canonicalApps = [];
    for (const app of deptApps) {
      canonicalApps.push(await validateAndTransform(app, transformer.applicationToCanonical, 'application'));
    }
    res.json(canonicalApps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /normalized/status-update
router.post('/status-update', async (req, res) => {
  try {
    const { departmentId, applicationId, status } = req.body;
    
    if (!applicationId || !status) {
      return res.status(400).json({ error: 'applicationId and status are required' });
    }
    
    // Transform canonical status to department-specific status
    const deptStatus = transformer.statusFromCanonical(status);
    
    // Call Dept A PATCH endpoint
    const response = await deptClient.updateStatus(applicationId, { status: deptStatus });
    res.json({ message: 'Status updated successfully', data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
