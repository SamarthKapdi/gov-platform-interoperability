const express = require('express');
const router = express.Router();
const { fetchFromDept, DEPARTMENTS, fetchFullProfileData } = require('../services/department-client');
const { runMatching } = require('../services/matcher');

router.post('/match', async (req, res) => {
  try {
    const allRecords = [];
    
    for (const [deptKey, deptInfo] of Object.entries(DEPARTMENTS)) {
      const { data, source } = await fetchFromDept(deptKey);
      if (data && Array.isArray(data)) {
        for (const record of data) {
          let deptId = record.id;
          if (record.departmentLinks && record.departmentLinks.length > 0) {
            deptId = record.departmentLinks[0].departmentId;
          }
          allRecords.push({
            ...record,
            id: deptId,
            dob: record.dob || record.dateOfBirth,
            department: deptKey,
            idField: deptInfo.idField
          });
        }
      }
    }
    
    const results = runMatching(allRecords, req.db);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/citizens', (req, res) => {
  const citizens = req.db.prepare('SELECT * FROM golden_citizens').all();
  for (const c of citizens) {
    c.departmentLinks = req.db.prepare('SELECT department, department_id FROM department_links WHERE canonical_id = ?').all(c.canonical_id);
  }
  res.json(citizens);
});

router.get('/citizen/:canonicalId', (req, res) => {
  const citizen = req.db.prepare('SELECT * FROM golden_citizens WHERE canonical_id = ?').get(req.params.canonicalId);
  if (!citizen) return res.status(404).json({ error: 'Not found' });
  
  citizen.departmentLinks = req.db.prepare('SELECT department, department_id FROM department_links WHERE canonical_id = ?').all(req.params.canonicalId);
  res.json(citizen);
});

router.get('/citizen/by-dept/:department/:departmentId', (req, res) => {
  const link = req.db.prepare('SELECT canonical_id FROM department_links WHERE department = ? AND department_id = ?')
    .get(req.params.department, req.params.departmentId);
    
  if (!link) return res.status(404).json({ error: 'Not found' });
  
  const citizen = req.db.prepare('SELECT * FROM golden_citizens WHERE canonical_id = ?').get(link.canonical_id);
  citizen.departmentLinks = req.db.prepare('SELECT department, department_id FROM department_links WHERE canonical_id = ?').all(link.canonical_id);
  
  res.json(citizen);
});

router.get('/citizen/:canonicalId/full-profile', async (req, res) => {
  const citizen = req.db.prepare('SELECT * FROM golden_citizens WHERE canonical_id = ?').get(req.params.canonicalId);
  if (!citizen) return res.status(404).json({ error: 'Not found' });
  
  const departmentLinks = req.db.prepare('SELECT department, department_id, department_id_field FROM department_links WHERE canonical_id = ?').all(req.params.canonicalId);
  
  const fullProfile = await fetchFullProfileData(req.params.canonicalId, departmentLinks);
  
  res.json({
    citizen,
    departmentLinks,
    ...fullProfile
  });
});

router.get('/search', async (req, res) => {
  const type = req.query.type;
  const q = req.query.q;
  let citizen = null;

  if (type === 'mobile') {
    citizen = req.db.prepare('SELECT * FROM golden_citizens WHERE mobile = ?').get(q);
  } else if (type === 'golden_id' || type === 'canonical_id') {
    citizen = req.db.prepare('SELECT * FROM golden_citizens WHERE canonical_id = ?').get(q);
  } else if (type === 'dept_id' || type === 'department_id') {
    const link = req.db.prepare('SELECT canonical_id FROM department_links WHERE department_id = ?').get(q);
    if (link) {
      citizen = req.db.prepare('SELECT * FROM golden_citizens WHERE canonical_id = ?').get(link.canonical_id);
    }
  } else {
    // Search by name in golden_citizens
    const likeQ = `%${q}%`;
    citizen = req.db.prepare('SELECT * FROM golden_citizens WHERE name LIKE ? OR mobile LIKE ?').get(likeQ, likeQ);
  }

  // Fallback: if no golden record found, search Identity service directly
  if (!citizen) {
    try {
      const identityUrl = process.env.IDENTITY_URL || 'http://localhost:3020';
      const identityRes = await fetch(`${identityUrl}/users?name=${encodeURIComponent(q)}`);
      if (identityRes.ok) {
        const users = await identityRes.json();
        const match = users.find(u => u.role === 'citizen' && u.name.toLowerCase().includes(q.toLowerCase()));
        if (match) {
          // Return a synthesized citizen record from identity data
          citizen = {
            canonical_id: match.id,
            name: match.name,
            date_of_birth: match.dob || 'N/A',
            mobile: match.mobile || 'N/A',
            email: match.email || null,
            confidence_score: 1.0,
            source: 'identity-service'
          };
        }
      }
    } catch (e) {
      // Identity service unavailable, continue with not found
    }
  }

  if (!citizen) return res.status(404).json({ error: 'Not found' });
  
  const departmentLinks = req.db.prepare('SELECT department, department_id, department_id_field FROM department_links WHERE canonical_id = ?').all(citizen.canonical_id);
  
  if (departmentLinks.length > 0) {
    const fullProfile = await fetchFullProfileData(citizen.canonical_id, departmentLinks);
    return res.json({
      citizen,
      departmentLinks,
      ...fullProfile
    });
  }

  res.json({
    citizen,
    departmentLinks: []
  });
});

module.exports = router;
