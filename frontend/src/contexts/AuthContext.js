import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveSession = (tokenVal, userVal, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem('auth_token', tokenVal);
    storage.setItem('auth_user', JSON.stringify(userVal));
    // Also mark which storage we used
    localStorage.setItem('auth_storage', rememberMe ? 'local' : 'session');
    setToken(tokenVal);
    setUser(userVal);
  };

  const clearSession = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_storage');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  // Restore session on mount
  useEffect(() => {
    const storageType = localStorage.getItem('auth_storage');
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    const savedToken = storage.getItem('auth_token');
    const savedUser = storage.getItem('auth_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));

      // Verify token is still valid
      fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) {
            clearSession();
          }
        })
        .catch(() => {
          clearSession();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password, rememberMe = false) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember_me: rememberMe }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    if (!res.ok) throw new Error(data.detail || 'Login failed');

    saveSession(data.token, data.user, rememberMe);
    return data.user;
  };

  const register = async (username, password, fullName) => {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, full_name: fullName || undefined }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    if (!res.ok) throw new Error(data.detail || 'Registration failed');

    saveSession(data.token, data.user, true);
    return data.user;
  };

  const forgotPassword = async (username) => {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = {}; }
    if (!res.ok) throw new Error(data.detail || 'Request failed');
    return data;
  };

  const resetPassword = async (username, resetCode, newPassword) => {
    const res = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        reset_code: resetCode,
        new_password: newPassword,
      }),
    });

    const text2 = await res.text();
    let data2;
    try { data2 = JSON.parse(text2); } catch { data2 = {}; }
    if (!res.ok) throw new Error(data2.detail || 'Reset failed');
    return data2;
  };

  const logout = useCallback(() => {
    clearSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
