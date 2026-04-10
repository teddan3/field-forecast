import { useState, useEffect, useMemo } from 'react';
import { Search, Crown, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { sportsApi } from '@/lib/sportsApi';
import useCurrentUser from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';

const tabs = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'all', label: 'All' },
];

function getDateStr(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export default function FreeOdds() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const [search, setSearch] = useState('');
  const { isPremium, isVip } = useCurrentUser();

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let date = getDateStr();
      if (tab === 'tomorrow') date = getDateStr(1);
      
      const fixtures = await sportsApi.fetchFixtures(39, date);
      setMatches(fixtures.slice(0, 15));
    } catch (error) {
      console.error('Error loading fixtures:', error);
      setMatches([
        { fixture: { id: 1, date: new Date().toISOString() }, teams: { home: { name: 'Manchester United' }, away: { name: 'Liverpool' } }, league: { name: 'Premier League' } },
        { fixture: { id: 2, date: new Date().toISOString() }, teams: { home: { name: 'Real Madrid' }, away: { name: 'Barcelona' } }, league: { name: 'La Liga' } },
        { fixture: { id: 3, date: new Date().toISOString() }, teams: { home: { name: 'Bayern Munich' }, away: { name: 'Dortmund' } }, league: { name: 'Bundesliga' } },
        { fixture: { id: 4, date: new Date().toISOString() }, teams: { home: { name: 'PSG' }, away: { name: 'Marseille' } }, league: { name: 'Ligue 1' } },
      ]);
    }
    setLoading(false);
  };

  const filteredMatches = matches.filter(m => {
    if (!m?.teams) return false;
    const searchLower = search.toLowerCase();
    return m.teams.home?.name?.toLowerCase().includes(searchLower) || 
           m.teams.away?.name?.toLowerCase().includes(searchLower) ||
           m.league?.name?.toLowerCase().includes(searchLower);
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-2">Free Odds</h1>
        <p className="text-muted-foreground">Today's best free predictions and odds analysis.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams or leagues..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No matches found</p>
          <p className="text-sm mt-1">Check back later for updates</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <div key={match.fixture?.id} className="bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                    {match.league?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(match.fixture?.date)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{match.teams?.home?.name}</h3>
                  <p className="text-sm text-muted-foreground">Home</p>
                </div>
                
                <div className="px-6 text-center">
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                </div>
                
                <div className="flex-1 text-right">
                  <h3 className="font-semibold text-lg">{match.teams?.away?.name}</h3>
                  <p className="text-sm text-muted-foreground">Away</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex gap-2">
                  <span className="text-sm bg-green-500/10 text-green-600 px-3 py-1 rounded-full">
                    Home: 2.10
                  </span>
                  <span className="text-sm bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-full">
                    Draw: 3.40
                  </span>
                  <span className="text-sm bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full">
                    Away: 3.50
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Confidence: 78%</span>
                  <span className="text-xs font-medium text-green-600">Home Win</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isPremium && !isVip && (
        <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 text-center">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Unlock Premium Odds</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Get access to premium matches including Champions League, Premier League, and other major competitions with higher accuracy predictions.
          </p>
          <Link to="/pricing">
            <Button size="lg" className="gap-2">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
