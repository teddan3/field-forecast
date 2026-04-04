import React, { createContext, useState, useContext, useEffect } from 'react';

const DEV_MODE = true;

const DEFAULT_DEV_USER = {
  id: 'dev-admin-001',
  full_name: 'Admin User',
  email: 'admin@fieldforecast.dev',
  role: 'admin',
  membership_type: 'premium',
  membership_status: 'active',
  membership_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  created_date: new Date().toISOString(),
};

const AuthContext = createContext();

const getDevUser = () => {
  try {
    const saved = localStorage.getItem('dev_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEV_USER;
  } catch {
    return DEFAULT_DEV_USER;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    if (DEV_MODE) {
      setAppPublicSettings({ id: 'dev-app', public_settings: {} });
      setUser(getDevUser());
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
      
      // Initialize localDb
      setTimeout(() => {
        import('@/lib/localDb').then(localDb => {
          localDb.default.initialize();
        }).catch(() => {});
      }, 500);
      return;
    }
  }, []);

  const logout = (shouldRedirect = true) => {
    if (DEV_MODE) {
      localStorage.removeItem('dev_user');
      window.location.href = '/admin/login';
      return;
    }
  };

  const navigateToLogin = () => {
    if (DEV_MODE) {
      window.location.href = '/admin/login';
      return;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState: () => {}
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export { DEV_MODE, DEFAULT_DEV_USER };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
