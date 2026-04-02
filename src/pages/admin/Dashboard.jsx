import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, Trophy, Calendar, TrendingUp, Crown, Mail, FileText, Zap } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import moment from 'moment';

export default function Dashboard() {
  const [stats, setStats] = useState({ users: 0, premium: 0, matches: 0, odds: 0, messages: 0, posts: 0 });
  const [loading, setLoading] = useState(true);
  const [recentOdds, setRecentOdds] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [users, matches, odds, messages, posts] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.Match.list('-created_date', 100),
        base44.entities.Odd.filter({ workflow_status: 'published' }, '-created_date', 50),
        base44.entities.ContactMessage.filter({ status: 'new' }),
        base44.entities.Post.filter({ status: 'published' }),
      ]);
      const premiumUsers = users.filter(u => u.membership_type === 'premium' || u.membership_type === 'vip');
      const today = new Date().toDateString();
      const todayMatches = matches.filter(m => new Date(m.match_datetime).toDateString() === today);
      const todayOdds = odds.filter(o => new Date(o.created_date).toDateString() === today);
      setStats({ users: users.length, premium: premiumUsers.length, matches: todayMatches.length, odds: todayOdds.length, messages: messages.length, posts: posts.length });
      setRecentOdds(odds.slice(0, 5));
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-sidebar-foreground">Dashboard</h1>
        <p className="text-sidebar-foreground/50 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-sidebar-accent animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats.users, icon: Users },
            { label: 'Premium Members', value: stats.premium, icon: Crown },
            { label: 'Matches Today', value: stats.matches, icon: Calendar },
            { label: 'Odds Published Today', value: stats.odds, icon: Zap },
            { label: 'New Messages', value: stats.messages, icon: Mail },
            { label: 'Published Posts', value: stats.posts, icon: FileText },
          ].map(s => (
            <div key={s.label} className="bg-sidebar-accent rounded-xl border border-sidebar-border p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">{s.label}</span>
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-sidebar-primary" />
                </div>
              </div>
              <div className="font-heading text-3xl font-bold text-sidebar-foreground">{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent published odds */}
      <div className="bg-sidebar-accent rounded-xl border border-sidebar-border p-6">
        <h2 className="font-heading text-lg font-semibold text-sidebar-foreground mb-4">Recent Published Odds</h2>
        {recentOdds.length > 0 ? (
          <div className="space-y-3">
            {recentOdds.map(o => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-sidebar-border last:border-0">
                <div className="text-sm text-sidebar-foreground">{o.prediction || 'Match prediction'}</div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-sidebar-primary">{o.home_win?.toFixed(2)} / {o.draw?.toFixed(2)} / {o.away_win?.toFixed(2)}</span>
                  {o.is_premium && <span className="text-xs px-2 py-0.5 rounded bg-sidebar-primary/10 text-sidebar-primary">PRO</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sidebar-foreground/40 text-sm">No published odds yet.</p>
        )}
      </div>
    </div>
  );
}