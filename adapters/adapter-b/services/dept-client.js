const DEPT_B_URL = 'http://localhost:3002';

async function fetchApplicants() {
  const res = await fetch(`${DEPT_B_URL}/registry/applicants`);
  if (!res.ok) throw new Error('Failed to fetch applicants');
  return res.text();
}

async function fetchApplicant(id) {
  const res = await fetch(`${DEPT_B_URL}/registry/applicants/${id}`);
  if (!res.ok) throw new Error('Failed to fetch applicant');
  return res.text();
}

async function fetchApplications() {
  const res = await fetch(`${DEPT_B_URL}/registry/jobs`);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.text();
}

async function fetchApplicationsByApplicant(applicantId) {
  const res = await fetch(`${DEPT_B_URL}/registry/jobs/${applicantId}`);
  if (!res.ok) throw new Error('Failed to fetch applicant applications');
  return res.text();
}

async function updateApplicationStatus(payload) {
  const res = await fetch(`${DEPT_B_URL}/registry/jobs/${payload.JobRefNo}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: payload.CurrentStatus })
  });
  if (!res.ok) throw new Error('Failed to update status');
  return res.text();
}

module.exports = {
  fetchApplicants,
  fetchApplicant,
  fetchApplications,
  fetchApplicationsByApplicant,
  updateApplicationStatus
};
