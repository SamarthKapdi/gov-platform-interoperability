const API_BASE = 'http://localhost:3000'; // Gateway

export const api = {
  get: async (endpoint) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  post: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
  put: async (endpoint, data) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }
};

export const getAuditLogs = () => api.get('/api/audit/logs');
export const getExceptions = () => api.get('/api/audit/exceptions');
export const retryException = (id) => {
  const token = localStorage.getItem('token');
  return fetch(`http://localhost:3000/api/audit/exceptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
    body: JSON.stringify({ status: 'RETRY' })
  }).then(r => r.json());
};
export const getCitizenRecord = (query, type) => {
  if (query.length === 36 && query.includes('-')) {
    return api.get(`/api/mdm/citizen/${query}/full-profile`);
  }
  return api.get(`/api/mdm/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`);
};
export const getMetrics = () => api.get('/api/audit/metrics');
export const getGatewayHealth = () => fetch('http://localhost:3000/health').then(r => r.json());
export const getRecentEvents = (limit = 5) => api.get(`/api/events/recent?limit=${limit}`);
export const getWorkflows = () => api.get('/api/workflow/instances');
