import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('yims_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('yims_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      const savedToken = localStorage.getItem('yims_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('yims_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          // Only clear session if explicitly unauthenticated (401)
          if (err.response && err.response.status === 401) {
            console.warn('Session expired (401), logging out');
            logout();
          } else {
            console.warn('Could not verify session with server; retaining cached session', err.message);
          }
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const res = await api.post('/auth/login', { email, password, rememberMe });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('yims_token', newToken);
    localStorage.setItem('yims_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    setLoading(false);
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('yims_token');
    localStorage.removeItem('yims_user');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    if (res.data.success && res.data.user) {
      setUser((prev) => ({ ...prev, ...res.data.user }));
      localStorage.setItem('yims_user', JSON.stringify({ ...user, ...res.data.user }));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
