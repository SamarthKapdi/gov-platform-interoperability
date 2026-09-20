import { useState, createContext, useContext, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sih_token');
    const storedUser = localStorage.getItem('sih_user');
    
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await apiLogin(username, password);
      // Assuming response contains token and user info
      localStorage.setItem('sih_token', response.access_token);
      
      // Parse basic user info from JWT for simple frontend usage
      let userInfo = response.user;
      if (!userInfo && response.access_token) {
        try {
          const payload = JSON.parse(atob(response.access_token.split('.')[1]));
          userInfo = { id: payload.sub, username: payload.username || username, role: payload.role || 'citizen' };
        } catch (e) {
          userInfo = { id: username, username, role: 'citizen' };
        }
      }
      
      localStorage.setItem('sih_user', JSON.stringify(userInfo));
      setUser(userInfo);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      localStorage.removeItem('sih_token');
      localStorage.removeItem('sih_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
