import { useState, useEffect } from 'react';
import { Check, Crown, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useCurrentUser from '../hooks/useCurrentUser';
import { toast } from 'sonner';
import localDb from '@/lib/localDb';

const tierIcons = { free: Zap, premium: Crown, vip: Shield };

export default function MembershipPricing() {
  const [plans, setPlans] = useState([]);
  const [pageHeader, setPageHeader] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, isPremium, isVip, refresh } = useCurrentUser();

  useEffect(() => {
    const header = localDb.sections.getByName('pricing', 'page_header');
    setPageHeader(header);

    const defaultPlans = localDb.plans.getAll();
    setPlans(defaultPlans);
    setLoading(false);
  }, []);

  const handleSubscribe = async (plan) => {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const currentUser = localDb.users.getCurrentUser();
    if (currentUser) {
      localDb.users.update(currentUser.id, {
        membership_type: plan.id,
        membership_status: 'active',
        membership_expiry_date: expiryDate.toISOString(),
      });
    }
    
    toast.success(`You're now a ${plan.name} member!`);
    if (refresh) refresh();
  };

  const title = pageHeader?.title || 'Membership Plans';
  const subtitle = pageHeader?.subtitle || 'Choose the plan that fits your analysis needs.';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <div className="text-center mb-12 sm:mb-16">
        <h1 className="font-heading text-3xl sm:text-5xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">{subtitle}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[1,2,3].map(i => <div key={i} className="h-96 bg-card rounded-2xl border border-border animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(plan => {
            const Icon = tierIcons[plan.id] || Zap;
            const isCurrentPlan = (plan.id === 'premium' && isPremium && !isVip) ||
              (plan.id === 'vip' && isVip) ||
              (plan.id === 'free' && !isPremium);
            const features = plan.features || [];

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative bg-card rounded-2xl border p-7 flex flex-col transition-all',
                  plan.id === 'premium' ? 'border-primary shadow-xl shadow-primary/5 scale-[1.02]' : 'border-border',
                  plan.id === 'vip' && 'border-gold/30'
                )}
              >
                {plan.id === 'premium' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-5',
                  plan.id === 'vip' ? 'bg-gold/10' : 'bg-primary/5'
                )}>
                  <Icon className={cn('w-6 h-6', plan.id === 'vip' ? 'text-gold' : 'text-primary')} />
                </div>
                <h3 className="font-heading text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-5">{plan.description || `${plan.name} membership features`}</p>
                <div className="mb-6">
                  <span className="font-heading text-4xl font-bold">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-muted-foreground ml-1">/ month</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn('w-4 h-4 mt-0.5 shrink-0', plan.id === 'vip' ? 'text-gold' : 'text-accent')} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrentPlan}
                  variant={plan.id === 'premium' ? 'default' : 'outline'}
                  className={cn(
                    'w-full h-12',
                    plan.id === 'vip' && !isCurrentPlan && 'bg-gold hover:bg-gold/90 text-gold-foreground'
                  )}
                >
                  {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Upgrade Now'}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
