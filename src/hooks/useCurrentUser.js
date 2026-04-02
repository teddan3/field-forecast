import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCurrentUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const me = await base44.auth.me();
      setUser(me);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const isPremium = user?.membership_type === 'premium' || user?.membership_type === 'vip';
  const isVip = user?.membership_type === 'vip';
  const isAdmin = user?.role === 'admin' || user?.role === 'editor' || user?.role === 'odds_manager' || user?.role === 'seo_manager';
  const isSuperAdmin = user?.role === 'admin';
  const canManageOdds = user?.role === 'admin' || user?.role === 'odds_manager';
  const canManageSeo = user?.role === 'admin' || user?.role === 'seo_manager';
  const canManageContent = user?.role === 'admin' || user?.role === 'editor';

  const membershipActive = user?.membership_status === 'active' && 
    (!user?.membership_expiry_date || new Date(user.membership_expiry_date) > new Date());

  return { 
    user, loading, isPremium: isPremium && membershipActive, isVip: isVip && membershipActive, 
    isAdmin, isSuperAdmin, canManageOdds, canManageSeo, canManageContent, membershipActive,
    refresh: async () => { const me = await base44.auth.me(); setUser(me); }
  };
}