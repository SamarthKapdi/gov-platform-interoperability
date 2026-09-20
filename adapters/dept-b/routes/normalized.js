const express = require('express');
const router = express.Router();
const client = require('../services/dept-client');
const { parseXmlList, parseXmlItemToObject } = require('../helpers/xml-parser');
const transformer = require('../transformers/dept-b-transformer');
const { validate, logException } = require('@sih/shared/validation');

// Mock DB for logging exceptions in stateless adapter
const mockDb = {
  prepare: () => ({ run: () => {} })
};

router.get('/citizens', async (req, res) => {
  try {
    const xml = await client.fetchApplicants();
    const applicantXmls = parseXmlList(xml, 'Applicant');
    
    const validCitizens = [];
    for (const appXml of applicantXmls) {
      const obj = parseXmlItemToObject(appXml);
      const transformed = transformer.transformCitizen(obj);
      
      const { valid, errors } = validate('citizen', transformed);
      if (valid) {
        validCitizens.push(transformed);
      } else {
        logException(mockDb, {
          entityType: 'citizen',
          sourceId: transformed.departmentId,
          sourceDept: 'Dept B',
          errors: JSON.stringify(errors)
        });
      }
    }
    
    res.json(validCitizens);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/citizen/:deptId', async (req, res) => {
  try {
    const xml = await client.fetchApplicant(req.params.deptId);
    if (!xml) return res.status(404).json({ error: 'Not found' });
    
    const applicantXmls = parseXmlList(xml, 'Applicant');
    const obj = applicantXmls.length ? parseXmlItemToObject(applicantXmls[0]) : parseXmlItemToObject(xml);
    
    const transformed = transformer.transformCitizen(obj);
    const { valid, errors } = validate('citizen', transformed);
    
    if (!valid) {
      logException(mockDb, {
        entityType: 'citizen',
        sourceId: transformed.departmentId,
        sourceDept: 'Dept B',
        errors: JSON.stringify(errors)
      });
      return res.status(400).json({ error: 'Invalid data from source' });
    }
    
    res.json(transformed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications', async (req, res) => {
  try {
    const xml = await client.fetchApplications();
    const appXmls = parseXmlList(xml, 'Application');
    
    const validApps = [];
    for (const appXml of appXmls) {
      const obj = parseXmlItemToObject(appXml);
      const transformed = transformer.transformApplication(obj);
      
      const { valid, errors } = validate('application', transformed);
      if (valid) {
        validApps.push(transformed);
      } else {
        logException(mockDb, {
          entityType: 'application',
          sourceId: transformed.applicationId,
          sourceDept: 'Dept B',
          errors: JSON.stringify(errors)
        });
      }
    }
    
    res.json(validApps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/applications/:citizenDeptId', async (req, res) => {
  try {
    const xml = await client.fetchApplicationsByApplicant(req.params.citizenDeptId);
    const appXmls = parseXmlList(xml, 'Application');
    
    const validApps = [];
    for (const appXml of appXmls) {
      const obj = parseXmlItemToObject(appXml);
      const transformed = transformer.transformApplication(obj);
      
      const { valid, errors } = validate('application', transformed);
      if (valid) {
        validApps.push(transformed);
      } else {
        logException(mockDb, {
          entityType: 'application',
          sourceId: transformed.applicationId,
          sourceDept: 'Dept B',
          errors: JSON.stringify(errors)
        });
      }
    }
    
    res.json(validApps);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/status-update', async (req, res) => {
  try {
    const payload = req.body; 
    
    const deptStatusMap = {
      'SUBMITTED': 'registered',
      'UNDER_REVIEW': 'shortlisted', 
      'APPROVED': 'placed',
      'REJECTED': 'rejected'
    };
    
    const currentStatus = deptStatusMap[payload.status] || 'registered';
    
    await client.updateApplicationStatus({
      ApplicantID: payload.citizenDeptId,
      JobRefNo: payload.applicationId,
      CurrentStatus: currentStatus
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
