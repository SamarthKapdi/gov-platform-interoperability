module.exports = [
  { prefix: '/api/deptA', target: process.env.ADAPTER_A_URL || 'http://localhost:3011', stripPrefix: true },
  { prefix: '/api/deptB', target: process.env.ADAPTER_B_URL || 'http://localhost:3012', stripPrefix: true },
  { prefix: '/api/deptC', target: process.env.ADAPTER_C_URL || 'http://localhost:3013', stripPrefix: true },
  { prefix: '/api/raw-deptA', target: 'http://localhost:3001', stripPrefix: true },
  { prefix: '/api/raw-deptB', target: 'http://localhost:3002', stripPrefix: true },
  { prefix: '/api/raw-deptC', target: 'http://localhost:3003', stripPrefix: true },
  { prefix: '/api/mdm', target: process.env.MDM_URL || 'http://localhost:3030', stripPrefix: true },
  { prefix: '/api/consent', target: process.env.CONSENT_URL || 'http://localhost:3040', stripPrefix: true },
  { prefix: '/api/events', target: process.env.EVENT_BUS_URL || 'http://localhost:3050', stripPrefix: true },
  { prefix: '/api/workflow', target: process.env.WORKFLOW_URL || 'http://localhost:3060', stripPrefix: true },
  { prefix: '/api/audit', target: process.env.AUDIT_URL || 'http://localhost:3070', stripPrefix: true },
  { prefix: '/api/auth', target: process.env.IDENTITY_URL || 'http://localhost:3020', stripPrefix: true }
];
