import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Gift, User, CreditCard, MessageCircle, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isPremium, isVip, isAffiliate, subscriptionActive, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login?redirect=/dashboard');
    return null;
  }

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    navigate('/');
  };

  const menuItems = [
    {
      title: 'My Subscription',
      description: subscriptionActive ? `Active ${user.subscription_tier} plan` : 'Free tier',
      icon: Crown,
      to: '/pricing',
      color: 'text-primary',
    },
    {
      title: 'Affiliate Program',
      description: isAffiliate ? 'Start earning commissions' : 'Become an affiliate',
      icon: Gift,
      to: '/affiliate',
      color: 'text-green-600',
    },
    {
      title: 'Community',
      description: 'Join discussions',
      icon: MessageCircle,
      to: '/community',
      color: 'text-blue-600',
    },
    {
      title: 'Account Settings',
      description: 'Update your profile',
      icon: Settings,
      to: '/settings',
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user.name || user.email}!</p>
      </div>

      {(!subscriptionActive || user.subscription_tier === 'free') && (
        <div className="mb-8 bg-primary/5 border border-primary/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Upgrade to Premium</h3>
              <p className="text-sm text-muted-foreground">Unlock all leagues, predictions, and VIP features</p>
            </div>
            <Link to="/pricing">
              <Button>Upgrade Now</Button>
            </Link>
          </div>
        </div>
      )}

      {isVip && (
        <div className="mb-8 bg-gold/5 border border-gold/20 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
              <Crown className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-gold">VIP Member</h3>
              <p className="text-sm text-muted-foreground">Thank you for your support!</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{user.name || user.email}</p>
            <p className="text-sm text-muted-foreground">
              {user.subscription_tier === 'free' ? 'Free account' : `${user.subscription_tier} member`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} disabled={loading}>
          <LogOut className="w-4 h-4 mr-2" />
          {loading ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
    </div>
  );
}