const axios = require('axios');

const BASE_URL = 'http://localhost:3003';

async function getBeneficiaries() {
  const response = await axios.get(`${BASE_URL}/beneficiaries`);
  return response.data;
}

async function getBeneficiary(deptId) {
  const response = await axios.get(`${BASE_URL}/beneficiaries/${deptId}`);
  return response.data;
}

async function getComplaints() {
  const response = await axios.get(`${BASE_URL}/complaints`);
  return response.data;
}

async function getComplaintsByBeneficiary(deptId) {
  const response = await axios.get(`${BASE_URL}/complaints?beneficiary_code=${deptId}`);
  return response.data;
}

async function updateComplaintStatus(complaintId, status) {
  const response = await axios.patch(`${BASE_URL}/complaints/${complaintId}`, { resolution_status: status });
  return response.data;
}

module.exports = {
  getBeneficiaries,
  getBeneficiary,
  getComplaints,
  getComplaintsByBeneficiary,
  updateComplaintStatus
};
