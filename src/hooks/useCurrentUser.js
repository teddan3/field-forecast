import { useState, useEffect } from 'react';
import localDb from '@/lib/localDb';

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = () => {
      const currentUser = localDb.users.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    checkUser();
    
    window.addEventListener('storage', checkUser);
    const interval = setInterval(checkUser, 1000);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      clearInterval(interval);
    };
  }, []);

  const isPremium = user?.membership_type === 'premium' || user?.membership_type === 'vip';
  const isVip = user?.membership_type === 'vip';
  const isAdmin = user?.role === 'admin' || user?.role === 'editor' || user?.role === 'odds_manager' || user?.role === 'seo_manager';
  const isSuperAdmin = user?.role === 'admin';
  const canManageOdds = user?.role === 'admin' || user?.role === 'odds_manager';
  const canManageSeo = user?.role === 'admin' || user?.role === 'seo_manager';
  const canManageContent = user?.role === 'admin' || user?.role === 'editor';

  const membershipActive = user?.membership_status === 'active';

  const logout = () => {
    localDb.users.logout();
    setUser(null);
    window.location.reload();
  };

  const refresh = () => {
    const currentUser = localDb.users.getCurrentUser();
    setUser(currentUser);
  };

  return { 
    user, 
    loading, 
    isPremium: isPremium && membershipActive, 
    isVip: isVip && membershipActive, 
    isAdmin, 
    isSuperAdmin, 
    canManageOdds, 
    canManageSeo, 
    canManageContent, 
    membershipActive: membershipActive,
    logout,
    refresh,
  };
}
