module.exports = [
  { prefix: '/api/deptA', target: 'http://localhost:3011', stripPrefix: true },
  { prefix: '/api/deptB', target: 'http://localhost:3012', stripPrefix: true },
  { prefix: '/api/deptC', target: 'http://localhost:3013', stripPrefix: true },
  { prefix: '/api/mdm', target: 'http://localhost:3030', stripPrefix: true },
  { prefix: '/api/consent', target: 'http://localhost:3040', stripPrefix: true },
  { prefix: '/api/events', target: 'http://localhost:3050', stripPrefix: true },
  { prefix: '/api/workflow', target: 'http://localhost:3060', stripPrefix: true },
  { prefix: '/api/audit', target: 'http://localhost:3070', stripPrefix: true },
  { prefix: '/api/auth', target: 'http://localhost:3020', stripPrefix: true }
];
