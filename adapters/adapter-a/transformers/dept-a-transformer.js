const { checks } = require('@sih/shared/validation');

function statusToCanonical(deptStatus) {
  if (!deptStatus) return 'SUBMITTED';
  const map = {
    'submitted': 'SUBMITTED',
    'under_review': 'UNDER_REVIEW',
    'verified': 'VERIFIED',
    'approved': 'APPROVED',
    'rejected': 'REJECTED'
  };
  return map[deptStatus.toLowerCase()] || 'SUBMITTED';
}

function statusFromCanonical(canonicalStatus) {
  if (!canonicalStatus) return 'submitted';
  const map = {
    'SUBMITTED': 'submitted',
    'UNDER_REVIEW': 'under_review',
    'VERIFIED': 'verified',
    'APPROVED': 'approved',
    'REJECTED': 'rejected'
  };
  return map[canonicalStatus.toUpperCase()] || 'submitted';
}

function citizenToCanonical(deptData) {
  return {
    id: `C-DEPT-A-${deptData.citizen_uid}`,
    name: checks.normalizeName ? checks.normalizeName(deptData.name) : deptData.name,
    dateOfBirth: checks.normalizeDate ? checks.normalizeDate(deptData.dob) : deptData.dob,
    mobile: deptData.mobile,
    email: deptData.email,
    departmentLinks: [
      {
        department: 'DEPT_A',
        departmentId: deptData.citizen_uid ? deptData.citizen_uid.toString() : undefined
      }
    ]
  };
}

function applicationToCanonical(deptData) {
  return {
    id: `APP-DEPT-A-${deptData.id || deptData.application_id}`,
    citizenId: `C-DEPT-A-${deptData.citizen_uid}`,
    department: 'DEPT_A',
    departmentApplicationId: (deptData.id || deptData.application_id || '').toString(),
    schemeName: deptData.course_name,
    status: statusToCanonical(deptData.status),
    appliedDate: deptData.applied_date || new Date().toISOString().split('T')[0],
    lastUpdated: deptData.last_updated || new Date().toISOString(),
    details: {
      course_id: deptData.course_id
    }
  };
}

module.exports = {
  citizenToCanonical,
  applicationToCanonical,
  statusFromCanonical,
  statusToCanonical
};
