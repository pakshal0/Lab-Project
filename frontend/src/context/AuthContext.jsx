import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Check if session cookie is already valid on load
  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/customers/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok && data.success && data.customer) {
        setUser(data.customer);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session verification error:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Register new customer
  const register = async ({ fullName, email, password, phone }) => {
    try {
      const res = await fetch('/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, phone }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Registration failed');
      }

      return { success: true, message: data.message, customer: data.customer };
    } catch (err) {
      return { success: false, message: err.message || 'An error occurred during registration' };
    }
  };

  // Login customer
  const login = async (email, password) => {
    try {
      const res = await fetch('/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      setUser(data.customer);
      setAuthModalOpen(false);
      return { success: true, message: data.message, customer: data.customer };
    } catch (err) {
      return { success: false, message: err.message || 'Invalid email or password' };
    }
  };

  // Logout customer
  const logout = async () => {
    try {
      await fetch('/customers/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setProfileModalOpen(false);
    }
  };

  const openLoginModal = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalTab('register');
    setAuthModalOpen(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        profileModalOpen,
        setProfileModalOpen,
        register,
        login,
        logout,
        checkAuth,
        openLoginModal,
        openRegisterModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
