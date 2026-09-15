const { checks } = require('@sih/shared/validation');

function mapStatus(deptStatus) {
  const statusMap = {
    'registered': 'SUBMITTED',
    'shortlisted': 'UNDER_REVIEW',
    'interviewed': 'UNDER_REVIEW',
    'placed': 'APPROVED',
    'rejected': 'REJECTED'
  };
  return statusMap[deptStatus?.toLowerCase()] || 'SUBMITTED';
}

function transformCitizen(applicantObj) {
  return {
    departmentId: applicantObj.ApplicantID,
    name: checks.normalizeName(applicantObj.FullName || ''),
    dateOfBirth: checks.normalizeDate(applicantObj.DOB || ''),
    mobile: applicantObj.Phone || '',
    email: applicantObj.Email || ''
  };
}

function transformApplication(appObj) {
  return {
    applicationId: appObj.JobRefNo,
    citizenDeptId: appObj.ApplicantID,
    serviceName: appObj.JobTitle || 'Employment Scheme',
    status: mapStatus(appObj.CurrentStatus),
    submissionDate: checks.normalizeDate(appObj.ApplicationDate || ''),
    department: 'Dept B'
  };
}

module.exports = {
  transformCitizen,
  transformApplication
};
