const { parseXmlToObjects } = require('../helpers/xml-parser');

const DEPARTMENTS = {
  DEPT_A: {
    adapterUrl: `${process.env.ADAPTER_A_URL || 'http://localhost:3011'}/normalized/citizens`,
    directUrl: `${process.env.DEPT_A_URL || 'http://localhost:3001'}/citizens`,
    idField: 'citizen_uid',
    name: 'DEPT_A'
  },
  DEPT_B: {
    adapterUrl: `${process.env.ADAPTER_B_URL || 'http://localhost:3012'}/normalized/citizens`,
    directUrl: `${process.env.DEPT_B_URL || 'http://localhost:3002'}/registry/applicants`,
    idField: 'applicant_id',
    name: 'DEPT_B',
    isXml: true
  },
  DEPT_C: {
    adapterUrl: `${process.env.ADAPTER_C_URL || 'http://localhost:3013'}/normalized/citizens`,
    directUrl: `${process.env.DEPT_C_URL || 'http://localhost:3003'}/beneficiaries`,
    idField: 'beneficiary_code',
    name: 'DEPT_C'
  }
};

async function fetchFromDept(deptKey) {
  const dept = DEPARTMENTS[deptKey];
  try {
    const res = await fetch(dept.adapterUrl);
    if (res.ok) {
      const data = await res.json();
      return { data, source: 'adapter' };
    }
  } catch (err) {
    console.log(`Adapter for ${deptKey} down or failed. Trying direct url...`);
  }

  try {
    const res = await fetch(dept.directUrl);
    if (!res.ok) {
      throw new Error(`Direct URL returned ${res.status}`);
    }
    
    if (dept.isXml) {
      const xml = await res.text();
      const rawData = parseXmlToObjects(xml);
      const data = rawData.map(r => ({
        id: r[dept.idField] || r.id,
        name: r.full_name || r.name || '',
        dob: r.dob || '',
        mobile: r.phone || r.mobile || ''
      }));
      return { data, source: 'direct' };
    } else {
      const rawData = await res.json();
      const data = rawData.map(r => ({
        id: r[dept.idField] || r.id,
        name: r.name || r.full_name || '',
        dob: r.dob || r.date_of_birth || '',
        mobile: r.mobile || r.phone || ''
      }));
      return { data, source: 'direct' };
    }
  } catch (err) {
    console.error(`Failed to fetch from ${deptKey}:`, err.message);
    return { data: [], error: err.message };
  }
}

async function fetchFullProfileData(canonicalId, deptLinks) {
    const profileData = {
        applications: [],
        grievances: [],
        errors: []
    };

    for (const link of deptLinks) {
        const deptKey = link.department;
        const deptId = link.department_id;
        
        try {
            if (deptKey === 'DEPT_A') {
                const res = await fetch(`${process.env.DEPT_A_URL || 'http://localhost:3001'}/citizens/${deptId}`);
                if (res.ok) {
                    const data = await res.json();
                    profileData['DEPT_A'] = data;
                }
            } else if (deptKey === 'DEPT_B') {
                const res = await fetch(`${process.env.DEPT_B_URL || 'http://localhost:3002'}/registry/applicants`);
                if (res.ok) {
                    const xml = await res.text();
                    const apps = parseXmlToObjects(xml, 'applicant');
                    const applicant = apps.find(a => a.applicant_id === deptId);
                    if (applicant) profileData['DEPT_B'] = applicant;
                }
            } else if (deptKey === 'DEPT_C') {
                const res = await fetch(`${process.env.DEPT_C_URL || 'http://localhost:3003'}/beneficiaries/${deptId}`);
                if (res.ok) {
                    const data = await res.json();
                    profileData['DEPT_C'] = data;
                }
            }
        } catch (err) {
            profileData.errors.push(`Failed to fetch extra data from ${deptKey}: ${err.message}`);
        }
    }
    return profileData;
}

module.exports = { DEPARTMENTS, fetchFromDept, fetchFullProfileData };
