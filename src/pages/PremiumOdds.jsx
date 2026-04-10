import { useState, useEffect } from 'react';
import { Crown, Lock, Search, Calendar, Trophy, Radio, TrendingUp, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import sportradarApi from '@/lib/sportradarApi';
import useCurrentUser from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';

const tabs = [
  { key: 'all', label: 'All Matches' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'results', label: 'Results' },
];

export default function PremiumOdds() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const { isPremium, isVip, user } = useCurrentUser();

  useEffect(() => {
    if (isPremium || isVip) {
      loadPremiumGames();
    }
  }, [isPremium, isVip, tab]);

  const loadPremiumGames = async () => {
    setLoading(true);
    try {
      const allGames = await sportradarApi.fetchAllPremiumGames();
      
      if (allGames.length > 0) {
        const formatted = allGames.map(g => sportradarApi.formatGameData(g));
        
        let filtered = formatted;
        if (tab === 'upcoming') {
          filtered = formatted.filter(g => g.status === 'scheduled' || g.status === 'not_started');
        } else if (tab === 'results') {
          filtered = formatted.filter(g => g.status === 'ended' || g.status === 'closed');
        }
        
        filtered.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        setGames(filtered);
      } else {
        setGames(sportradarApi.getDemoPremiumGames().map(g => sportradarApi.formatGameData(g)));
      }
    } catch (error) {
      console.error('Error loading premium games:', error);
      setGames(sportradarApi.getDemoPremiumGames().map(g => sportradarApi.formatGameData(g)));
    }
    setLoading(false);
  };

  const filteredGames = games.filter(g => {
    if (!search) return true;
    const s = search.toLowerCase();
    return g.homeTeam?.toLowerCase().includes(s) || 
           g.awayTeam?.toLowerCase().includes(s) ||
           g.competition?.toLowerCase().includes(s);
  });

  const getStatusBadge = (game) => {
    if (game.isLive) {
      return <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
        <Radio className="w-3 h-3 animate-pulse" /> LIVE
      </span>;
    }
    if (game.status === 'ended' || game.status === 'closed') {
      return <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">FT</span>;
    }
    if (game.status === 'halftime') {
      return <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">HT</span>;
    }
    return null;
  };

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-4">Premium Intelligence</h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Access exclusive premium predictions for major competitions including UEFA Champions League, 
            Premier League, La Liga, Bundesliga, Serie A, and Ligue 1 with our highest confidence picks.
          </p>
          <Link to="/pricing">
            <Button size="lg" className="gap-2">
              <Crown className="w-4 h-4" />
              Unlock Premium
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Premium Leagues
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sportradarApi.getPremiumCompetitions().map((league) => (
              <div key={league.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{league.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Premium</span>
          </div>
          <h1 className="font-heading text-4xl font-bold mb-2">Premium Intelligence</h1>
          <p className="text-muted-foreground">High-confidence picks for major competitions.</p>
        </div>
        {isVip && (
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 text-yellow-600 font-semibold text-sm border border-yellow-500/20">
            <Crown className="w-4 h-4" /> VIP Member
          </span>
        )}
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
          placeholder="Search premium fixtures..." 
          className="pl-9 max-w-sm" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-48 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 animate-pulse" />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
          <Crown className="w-12 h-12 mx-auto mb-4 text-primary/40" />
          <p className="text-muted-foreground font-medium">No premium games found for this filter.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Check back soon for updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map(game => {
            const odds = sportradarApi.generateOdds(game);
            return (
              <div key={game.id} className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{game.competition}</span>
                    {game.round && (
                      <span className="text-xs text-muted-foreground">Round {game.round}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sportradarApi.formatDate(game.datetime)}
                    </span>
                    {getStatusBadge(game)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl">{game.homeTeam}</h3>
                    <p className="text-sm text-muted-foreground">{game.homeTeamAbbr}</p>
                  </div>
                  <div className="px-6 text-center">
                    {game.homeScore !== null && game.homeScore !== undefined ? (
                      <div className="text-2xl font-bold">
                        {game.homeScore} - {game.awayScore}
                      </div>
                    ) : (
                      <div className="text-lg font-bold text-muted-foreground">VS</div>
                    )}
                    {game.periodScores && game.periodScores.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        HT: {game.periodScores[0]?.home_score}-{game.periodScores[0]?.away_score}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="font-semibold text-xl">{game.awayTeam}</h3>
                    <p className="text-sm text-muted-foreground">{game.awayTeamAbbr}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Premium Prediction</span>
                    </div>
                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded">
                      {odds.confidence}% Confidence
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-500/10 rounded-lg p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Home (1)</div>
                      <div className="text-2xl font-bold text-green-600">{odds.home}</div>
                      <div className="text-xs text-muted-foreground mt-1">{odds.homeProb}%</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Draw (X)</div>
                      <div className="text-2xl font-bold text-yellow-600">{odds.draw}</div>
                      <div className="text-xs text-muted-foreground mt-1">{odds.drawProb}%</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-4 text-center">
                      <div className="text-xs text-muted-foreground mb-1">Away (2)</div>
                      <div className="text-2xl font-bold text-blue-600">{odds.away}</div>
                      <div className="text-xs text-muted-foreground mt-1">{odds.awayProb}%</div>
                    </div>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Odds Comparison</span>
                    </div>
                    <div className="space-y-2">
                      {odds.sportsbookOdds.slice(0, 3).map((book, idx) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 text-xs">
                          <span className="text-muted-foreground">{book.sportsbook}</span>
                          <span className="text-green-600 text-center">{book.home}</span>
                          <span className="text-yellow-600 text-center">{book.draw}</span>
                          <span className="text-blue-600 text-center">{book.away}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
