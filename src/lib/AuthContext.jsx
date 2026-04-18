import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '@/api/fieldForecastClient';

const DEV_MODE = import.meta.env.DEV === false ? false : true;

const DEFAULT_DEV_USER = {
  id: 'dev-admin-001',
  name: 'Admin User',
  email: 'admin@fieldforecast.dev',
  role: 'admin',
  subscription_tier: 'quarterly',
  subscription_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
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
    const initAuth = async () => {
      if (DEV_MODE) {
        setAppPublicSettings({ id: 'dev-app', public_settings: {} });
        setUser(getDevUser());
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        
        setTimeout(() => {
          import('@/lib/localDb').then(localDb => {
            localDb.default.initialize();
          }).catch(() => {});
        }, 500);
        return;
      }

      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    };

    initAuth();

    const handleStorage = (e) => {
      if (e.key === 'auth_token' && !e.newValue) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const logout = async (shouldRedirect = true) => {
    if (DEV_MODE) {
      localStorage.removeItem('dev_user');
      if (shouldRedirect) {
        window.location.href = '/admin/login';
      }
      return;
    }

    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      if (shouldRedirect) {
        window.location.href = '/';
      }
    }
  };

  const navigateToLogin = () => {
    if (DEV_MODE) {
      window.location.href = '/admin/login';
      return;
    }
    window.location.href = '/login';
  };

  const checkAppState = async () => {
    if (!DEV_MODE) {
      try {
        const data = await api.getMe();
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
      }
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
      checkAppState
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
  
  const { user } = context;
  const isPremium = user?.subscription_tier && ['weekly', 'monthly', 'quarterly'].includes(user.subscription_tier);
  const isVip = user?.subscription_tier && ['monthly', 'quarterly'].includes(user.subscription_tier);
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'admin';
  const isAffiliate = user?.is_affiliate;
  const subscriptionActive = user?.subscription_expires_at 
    ? new Date(user.subscription_expires_at) > new Date()
    : user?.subscription_tier !== 'free';

  return {
    ...context,
    isPremium: isPremium && subscriptionActive,
    isVip: isVip && subscriptionActive,
    isAdmin,
    isSuperAdmin,
    isAffiliate,
    subscriptionActive,
  };
};