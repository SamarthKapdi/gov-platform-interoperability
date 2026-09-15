export const getAuthToken = () => localStorage.getItem('sih_token');

export const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('sih_token');
    localStorage.removeItem('sih_user');
    window.location.href = '/';
  }
  
  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch (e) {
      // Not JSON
    }
    throw new Error(message);
  }
  
  return response.json();
};

export const login = async (username, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    throw new Error('Login failed');
  }
  
  return response.json();
};

export const logout = async () => {
  // Optional backend call
  return Promise.resolve();
};

export const getCitizenProfile = (id) => fetchWithAuth(`/api/mdm/citizen/${id}/full-profile`);
export const getCitizenConsents = (id) => fetchWithAuth(`/api/consent/citizen/${id}`);
export const grantConsent = (data) => fetchWithAuth('/api/consent/grant', { method: 'POST', body: JSON.stringify(data) });
export const revokeConsent = (id) => fetchWithAuth(`/api/consent/revoke/${id}`, { method: 'POST' });
