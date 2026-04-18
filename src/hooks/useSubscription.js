import { useState, useEffect, useCallback } from 'react';
import useCurrentUser from './useCurrentUser';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  limits: {
    matches_per_day: number;
    premium_leagues: boolean;
    h2h_data: boolean;
    advanced_stats: boolean;
    early_access?: boolean;
  };
}

export interface Subscription {
  tier: string;
  is_active: boolean;
  expires_at: string | null;
  started_at: string | null;
  auto_renew: boolean;
  days_remaining: number;
}

export function useSubscription() {
  const { user } = useCurrentUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/current`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/plans`);
      const data = await response.json();

      if (data.success) {
        setPlans(Object.values(data.plans) as SubscriptionPlan[]);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans]);

  const checkAccess = useCallback(async (feature: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ feature }),
      });
      const data = await response.json();
      return data.can_access ?? false;
    } catch {
      return false;
    }
  }, [user]);

  const createCheckout = useCallback(async (priceId: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/subscription/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          price_id: priceId,
          success_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });
      const data = await response.json();
      return data.checkout_session?.url ?? null;
    } catch (err) {
      console.error('Failed to create checkout:', err);
      return null;
    }
  }, [user]);

  return {
    subscription,
    plans,
    loading,
    error,
    refetch: fetchSubscription,
    checkAccess,
    createCheckout,
    isPremium: subscription?.tier === 'premium' && subscription?.is_active,
    isVip: subscription?.tier === 'vip' && subscription?.is_active,
    hasActiveSubscription: subscription?.is_active ?? false,
  };
}

export function useFeatureAccess(requiredFeature: string) {
  const { checkAccess, loading, subscription } = useSubscription();
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (!loading && subscription) {
      checkAccess(requiredFeature).then(setCanAccess);
    }
  }, [checkAccess, requiredFeature, loading, subscription]);

  return {
    canAccess,
    loading,
    tier: subscription?.tier ?? 'free',
  };
}

export default useSubscription;