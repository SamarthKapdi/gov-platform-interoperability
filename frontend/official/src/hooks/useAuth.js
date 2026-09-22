import { useState, useEffect } from 'react';

// Basic JWT decoder (doesn't verify signature)
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // We'll call identity service directly through gateway
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await res.json();
    const decoded = parseJwt(data.access_token);
    
    if (decoded.role === 'citizen') {
      throw new Error('Access denied: Citizens cannot access the Official Dashboard');
    }

    localStorage.setItem('token', data.access_token);
    setUser(decoded);
    return decoded;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const token = localStorage.getItem('token');
  return { user, token, login, logout, loading };
};
