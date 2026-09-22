const http = require('http');

const DEPT_A_URL = process.env.DEPT_A_URL || 'http://localhost:3001';

async function fetchFromDeptA(path, options = {}) {
  const url = `${DEPT_A_URL}${path}`;
  
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP error! status: ${res.statusCode} ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

module.exports = {
  getCitizens: () => fetchFromDeptA('/citizens'),
  getCitizen: (id) => fetchFromDeptA(`/citizens/${id}`),
  getApplications: () => fetchFromDeptA('/applications'),
  getApplicationsByCitizen: (id) => fetchFromDeptA(`/applications?citizen_uid=${id}`),
  updateStatus: (id, statusData) => fetchFromDeptA(`/applications/${id}`, {
    method: 'PATCH',
    body: statusData
  })
};
