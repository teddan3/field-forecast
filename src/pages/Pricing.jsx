import { useState } from 'react';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useCurrentUser from '../hooks/useCurrentUser';
import { Link } from 'react-router-dom';

const plans = [
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
    tier: 'premium',
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
    tier: 'premium',
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
    tier: 'vip',
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

const tierIcons = { free: Zap, premium: Crown, vip: Star };
const tierColors = {
  free: 'border-border',
  premium: 'border-primary ring-2 ring-primary/20',
  vip: 'border-gold ring-2 ring-gold/20',
};

export default function Pricing() {
  const [paying, setPaying] = useState(null);
  const { user, isPremium, isVip } = useCurrentUser();

  const handleUpgrade = async (plan) => {
    if (!user) {
      return;
    }

    setPaying(plan.id);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + plan.duration_days);

      localStorage.setItem('ff_membership', JSON.stringify({
        tier: plan.tier,
        expiry: expiry.toISOString(),
        plan: plan.name,
      }));

      window.location.reload();
    } catch (e) {
      console.error('Upgrade error:', e);
    }

    setPaying(null);
  };

  const isCurrentPlan = (plan) => {
    const membership = JSON.parse(localStorage.getItem('ff_membership') || '{}');
    return membership.tier === plan.tier;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="font-heading text-5xl font-bold mb-4">Membership Plans</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Choose the plan that fits your sports intelligence needs. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {plans.map(plan => {
          const Icon = tierIcons[plan.tier] || Zap;
          const isVipPlan = plan.tier === 'vip';
          const currentPlan = isCurrentPlan(plan);

          return (
            <div key={plan.id} className={cn(
              'relative flex flex-col bg-card rounded-2xl border p-6 transition-all',
              tierColors[plan.tier],
              plan.popular && 'scale-[1.02] lg:scale-[1.05]'
            )}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                  Best Value
                </div>
              )}
              <div className={cn(
                'w-11 h-11 rounded-xl flex items-center justify-center mb-4',
                isVipPlan ? 'bg-gold/10' : 'bg-primary/10'
              )}>
                <Icon className={cn('w-5 h-5', isVipPlan ? 'text-gold' : 'text-primary')} />
              </div>
              <h3 className="font-heading text-2xl font-bold mb-1">{plan.name}</h3>
              {plan.description && <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="font-heading text-4xl font-bold">${plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground text-sm">/ {plan.duration_days === 7 ? 'week' : plan.duration_days === 30 ? 'month' : '3 months'}</span>}
              </div>
              {plan.features.length > 0 && (
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className={cn('w-4 h-4 mt-0.5 shrink-0', isVipPlan ? 'text-gold' : 'text-accent')} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                className={cn('w-full', isVipPlan && 'bg-gold hover:bg-gold/90 text-white')}
                variant={plan.tier === 'free' ? 'outline' : 'default'}
                disabled={currentPlan || paying === plan.id || plan.price === 0}
                onClick={() => handleUpgrade(plan)}
              >
                {paying === plan.id ? 'Processing...' : currentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started' : `Get ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">All plans include 24/7 access. Cancel or change at any time.</p>
        <p className="text-xs text-muted-foreground mt-2">Secure payments powered by Stripe</p>
      </div>

      <div className="mt-16 bg-card rounded-2xl border border-border p-8 text-center">
        <h2 className="font-heading text-2xl font-bold mb-4">Need a Custom Plan?</h2>
        <p className="text-muted-foreground mb-6">
          For teams, sports analysts, or enterprise solutions, we offer custom plans tailored to your needs.
        </p>
        <Button asChild variant="outline">
          <Link to="/contact">Contact Sales</Link>
        </Button>
      </div>
    </div>
  );
}