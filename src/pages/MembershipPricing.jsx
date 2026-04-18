import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, Zap, Star, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import api from '@/api/fieldForecastClient';

const tierIcons = { free: Zap, weekly: Crown, monthly: Crown, quarterly: Star };

const defaultPlans = [
  {
    id: 'free',
    name: 'Free',
    tier: 'free',
    price: 0,
    duration_days: 0,
    description: 'Basic access to free leagues',
    features: [
      'Live scores from free leagues',
      'MLS, Eredivisie, Brasileiro',
      'Basic predictions',
      'Community access',
    ],
    popular: false,
  },
  {
    id: 'weekly',
    name: 'Weekly',
    tier: 'weekly',
    price: 4,
    duration_days: 7,
    description: 'Perfect for trying premium',
    features: [
      'All free features',
      'Premier League access',
      'Champions League',
      'La Liga, Serie A, Bundesliga',
      'Real-time odds comparison',
      'H2H data',
      'Ad-free experience',
    ],
    popular: false,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    tier: 'monthly',
    price: 14,
    duration_days: 30,
    description: 'Best value for regular users',
    features: [
      'All Weekly features',
      'Full league access',
      'Advanced stats',
      'Expert predictions',
      'Priority support',
      'Early access to tips',
    ],
    popular: true,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    tier: 'quarterly',
    price: 42,
    duration_days: 90,
    description: 'Unlock the Full Intelligence Suite',
    features: [
      'All Monthly features',
      'VIP predictions',
      'Exclusive VIP tips',
      'VIP community access',
      'Custom match alerts',
      'Dedicated support',
      'Birthday bonus',
    ],
    popular: false,
  },
];

export default function MembershipPricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isPremium, isVip, subscriptionActive } = useAuth();
  const [plans, setPlans] = useState(defaultPlans);
  const [loading, setLoading] = useState(false);
  const [subscribing, setSubscribing] = useState(null);

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate(`/register?redirect=/pricing`);
      return;
    }

    setSubscribing(plan.id);

    try {
      const result = await api.createCheckout(
        plan.id,
        `${window.location.origin}/dashboard?success=true`,
        `${window.location.origin}/pricing?cancelled=true`
      );

      if (result.checkout_session?.url) {
        window.location.href = result.checkout_session.url;
      } else {
        alert('Checkout currently unavailable. Please try again later.');
      }
    } catch (err) {
      console.error('Subscribe error:', err);
      alert('Failed to create checkout session');
    } finally {
      setSubscribing(null);
    }
  };

  const getCurrentTier = () => {
    if (!user || !subscriptionActive) return 'free';
    return user.subscription_tier || 'free';
  };

  const isCurrentPlan = (plan) => {
    const current = getCurrentTier();
    return current === plan.tier;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="font-heading text-3xl sm:text-5xl font-bold mb-4">Membership Plans</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Choose the plan that fits your sports intelligence needs. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = tierIcons[plan.tier] || Zap;
          const currentPlan = isCurrentPlan(plan);
          const features = plan.features || [];
          const isVipPlan = plan.tier === 'quarterly';

          return (
            <div
              key={plan.id}
              className={cn(
                'relative bg-card rounded-2xl border p-7 flex flex-col transition-all',
                plan.popular ? 'border-primary shadow-xl shadow-primary/5 scale-[1.02] lg:scale-[1.05]' : 'border-border',
                isVipPlan && 'border-gold/30'
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                  Best Value
                </span>
              )}
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-5',
                  isVipPlan ? 'bg-gold/10' : 'bg-primary/5'
                )}
              >
                <Icon className={cn('w-6 h-6', isVipPlan ? 'text-gold' : 'text-primary')} />
              </div>
              <h3 className="font-heading text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>
              <div className="mb-6">
                <span className="font-heading text-4xl font-bold">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-muted-foreground ml-1">
                    /{plan.duration_days === 7 ? 'week' : plan.duration_days === 30 ? 'month' : '3 months'}
                  </span>
                )}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        'w-4 h-4 mt-0.5 shrink-0',
                        isVipPlan ? 'text-gold' : 'text-accent'
                      )}
                    />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(plan)}
                disabled={currentPlan || subscribing === plan.id}
                variant={plan.tier === 'free' ? 'outline' : 'default'}
                className={cn(
                  'w-full h-12',
                  isVipPlan && !currentPlan && 'bg-gold hover:bg-gold/90 text-white'
                )}
              >
                {subscribing === plan.id
                  ? 'Processing...'
                  : currentPlan
                  ? 'Current Plan'
                  : plan.price === 0
                  ? 'Get Started'
                  : 'Upgrade Now'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          All plans include 24/7 access. Cancel or change at any time.
        </p>
        <p className="text-xs text-muted-foreground mt-2">Secure payments powered by Stripe</p>
      </div>

      {isAuthenticated && (
        <div className="mt-16 text-center">
          <Link to="/affiliate" className="text-sm text-primary hover:underline flex items-center justify-center gap-2">
            <Gift className="w-4 h-4" />
            Join our Affiliate Program
          </Link>
        </div>
      )}
    </div>
  );
}