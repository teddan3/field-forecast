import { Lock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PremiumGate({ type = 'premium', compact = false }) {
  const isVip = type === 'vip';

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-lg">
        <div className="absolute inset-0 backdrop-blur-[12px] bg-card/60 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{isVip ? 'VIP' : 'Premium'} Only</span>
          </div>
        </div>
        <div className="opacity-30 select-none pointer-events-none">
          <div className="grid grid-cols-3 gap-2 p-2">
            <div className="h-6 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
            <div className="h-6 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <div className="absolute inset-0 backdrop-blur-[12px] bg-card/70 z-10 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isVip ? 'bg-gold/10' : 'bg-primary/10'}`}>
          <Crown className={`w-6 h-6 ${isVip ? 'text-gold' : 'text-primary'}`} />
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold mb-1">{isVip ? 'VIP' : 'Premium'} Content</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Upgrade to access advanced predictions, expert analysis, and high-confidence picks.
          </p>
        </div>
        <Link to="/pricing">
          <Button className={isVip ? 'bg-gold hover:bg-gold/90' : ''}>
            <Crown className="w-4 h-4 mr-2" /> Upgrade Now
          </Button>
        </Link>
      </div>
      <div className="opacity-20 select-none pointer-events-none p-6">
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
              <div className="h-8 w-20 bg-muted-foreground/10 rounded" />
              <div className="flex-1 h-4 bg-muted-foreground/10 rounded" />
              <div className="h-8 w-16 bg-muted-foreground/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}