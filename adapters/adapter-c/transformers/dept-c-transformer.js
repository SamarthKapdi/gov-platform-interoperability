const { checks } = require('@sih/shared/validation');

function transformCitizen(deptData) {
  return {
    name: checks.normalizeName(deptData.applicant_name || ''),
    dateOfBirth: checks.normalizeDate(deptData.date_of_birth || ''),
    mobile: deptData.contact_no || '',
    email: deptData.email_id || '',
    address: deptData.residential_address || '',
    departmentLinks: [
      {
        department: 'dept-c',
        departmentId: deptData.beneficiary_code
      }
    ]
  };
}

function mapStatus(resolutionStatus) {
  const statusMap = {
    'filed': 'FILED',
    'under_review': 'UNDER_REVIEW',
    'in_progress': 'IN_PROGRESS',
    'resolved': 'RESOLVED',
    'closed': 'CLOSED',
    'reopened': 'REOPENED'
  };
  return statusMap[resolutionStatus] || 'OTHER';
}

function mapCategory(category) {
  const categoryMap = {
    'service_delay': 'SERVICE_DELAY',
    'document_issue': 'DOCUMENT_ISSUE',
    'payment_issue': 'PAYMENT_ISSUE',
    'staff_conduct': 'STAFF_CONDUCT',
    'other': 'OTHER'
  };
  return categoryMap[category] || 'OTHER';
}

function transformApplication(deptData) {
  return {
    applicationId: deptData.complaint_id,
    type: 'GRIEVANCE',
    status: mapStatus(deptData.resolution_status),
    departmentRefId: deptData.complaint_id,
    citizenId: deptData.beneficiary_code, // This might be unresolved locally without a mapping DB
    department: 'dept-c'
  };
}

function transformGrievance(deptData) {
  return {
    grievanceId: deptData.complaint_id,
    citizenId: deptData.beneficiary_code,
    department: 'dept-c',
    category: mapCategory(deptData.category),
    subject: deptData.subject,
    description: deptData.description,
    status: mapStatus(deptData.resolution_status),
    departmentRefId: deptData.complaint_id
  };
}

module.exports = {
  transformCitizen,
  transformApplication,
  transformGrievance
};
