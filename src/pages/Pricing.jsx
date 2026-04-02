import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useCurrentUser from '../hooks/useCurrentUser';
import { toast } from 'sonner';

const tierIcons = { free: Zap, premium: Crown, vip: Crown };
const tierColors = {
  free: 'border-border',
  premium: 'border-primary ring-2 ring-primary/20',
  vip: 'border-gold ring-2 ring-gold/20',
};

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const { user, isPremium, isVip, refresh } = useCurrentUser();

  useEffect(() => {
    base44.entities.MembershipPlan.filter({ status: 'active' }, 'display_order').then(p => {
      setPlans(p); setLoading(false);
    });
  }, []);

  const handleUpgrade = async (plan) => {
    if (!user) { toast.error('Please log in first'); return; }
    setPaying(plan.id);
    // Paystack integration stub - activate directly for demo
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + plan.duration_days);
      await base44.auth.updateMe({
        membership_type: plan.tier,
        membership_status: 'active',
        membership_expiry_date: expiry.toISOString(),
      });
      toast.success(`Welcome to ${plan.name}! Your membership is now active.`);
      refresh();
    } catch (e) {
      toast.error('Upgrade failed. Please try again.');
    }
    setPaying(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="font-heading text-5xl font-bold mb-4">Membership Plans</h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Choose the plan that fits your analysis needs. Upgrade or downgrade anytime.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      ) : plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map(plan => {
            const Icon = tierIcons[plan.tier] || Zap;
            const features = plan.features ? plan.features.split(',').map(f => f.trim()).filter(Boolean) : [];
            const isCurrentPlan = user?.membership_type === plan.tier && isPremium;
            const isVipPlan = plan.tier === 'vip';

            return (
              <div key={plan.id} className={cn(
                'relative flex flex-col bg-card rounded-2xl border p-6 transition-all',
                tierColors[plan.tier],
                plan.is_popular && 'scale-[1.02]'
              )}>
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full uppercase tracking-wider">
                    Most Popular
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
                  <span className="text-muted-foreground text-sm">/ {plan.duration_days} days</span>
                </div>
                {features.length > 0 && (
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={cn('w-4 h-4 mt-0.5 shrink-0', isVipPlan ? 'text-gold' : 'text-accent')} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  className={cn('w-full', isVipPlan && 'bg-gold hover:bg-gold/90 text-white')}
                  variant={plan.tier === 'free' ? 'outline' : 'default'}
                  disabled={isCurrentPlan || paying === plan.id || plan.price === 0}
                  onClick={() => handleUpgrade(plan)}
                >
                  {paying === plan.id ? 'Processing...' : isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Free Tier' : `Get ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">No plans configured yet.</p>
        </div>
      )}

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">All plans include 24/7 access. Cancel or change at any time.</p>
      </div>
    </div>
  );
}