import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Crown, Lock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import MatchOddsRow from '../components/odds/MatchOddsRow';
import PremiumGate from '../components/odds/PremiumGate';
import useCurrentUser from '../hooks/useCurrentUser';

export default function PremiumOdds() {
  const [matches, setMatches] = useState([]);
  const [odds, setOdds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isPremium, isVip, user } = useCurrentUser();

  useEffect(() => {
    const load = async () => {
      const [m, o] = await Promise.all([
        base44.entities.Match.list('-match_datetime', 100),
        base44.entities.Odd.filter({ workflow_status: 'published', is_premium: true }, '-created_date', 50),
      ]);
      setMatches(m); setOdds(o); setLoading(false);
    };
    load();
  }, []);

  const oddsMap = Object.fromEntries(odds.map(o => [o.match_id, o]));

  const filteredOdds = useMemo(() => {
    if (!search) return odds;
    return odds.filter(o => {
      const m = matches.find(m => m.id === o.match_id);
      return m && `${m.home_team_name} ${m.away_team_name} ${m.league_name}`.toLowerCase().includes(search.toLowerCase());
    });
  }, [odds, matches, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Premium Odds</span>
          </div>
          <h1 className="font-heading text-4xl font-bold mb-2">Advanced Intelligence</h1>
          <p className="text-muted-foreground">High-confidence picks, expert analysis, and premium predictions.</p>
        </div>
        {isVip && (
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold/10 text-gold font-semibold text-sm border border-gold/20">
            <Crown className="w-4 h-4" /> VIP Member
          </span>
        )}
      </div>

      {!isPremium && (
        <div className="mb-10">
          <PremiumGate type="premium" />
        </div>
      )}

      {isPremium && (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search premium fixtures..." className="pl-9 max-w-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : filteredOdds.length > 0 ? (
            <div className="space-y-3">
              {filteredOdds.map(o => {
                const m = matches.find(m => m.id === o.match_id);
                return m ? (
                  <div key={o.id}>
                    <MatchOddsRow match={m} odd={o} canViewPremium={true} canViewVip={isVip} />
                    {o.analysis && (
                      <div className="ml-4 mt-2 mb-4 p-3 bg-primary/5 rounded-lg border-l-2 border-primary/30">
                        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Analysis: </span>{o.analysis}</p>
                      </div>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-xl border border-border">
              <Crown className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No premium odds published yet. Check back soon.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}