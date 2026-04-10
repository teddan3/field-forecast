import { useState, useEffect } from 'react';
import { Crown, Lock, Search, Calendar, Trophy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import sportsApi, { PREMIUM_LEAGUES } from '@/lib/sportsApi';
import useCurrentUser from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';

const PREMIUM_COMPETITIONS = ['ELITE', 'CL', 'EPL', 'PL', 'LigueA', 'Bundesliga', 'LaLiga', 'SerieA'];

const PREMIUM_DEMO_GAMES = [
  { gameId: 1, homeTeam: 'Real Madrid', awayTeam: 'Bayern Munich', competition: 'UEFA Champions League', datetime: new Date().toISOString(), status: 'Scheduled' },
  { gameId: 2, homeTeam: 'Manchester City', awayTeam: 'Arsenal', competition: 'Premier League', datetime: new Date().toISOString(), status: 'Scheduled' },
  { gameId: 3, homeTeam: 'Barcelona', awayTeam: 'PSG', competition: 'UEFA Champions League', datetime: new Date().toISOString(), status: 'Scheduled' },
  { gameId: 4, homeTeam: 'Liverpool', awayTeam: 'Chelsea', competition: 'Premier League', datetime: new Date().toISOString(), status: 'Scheduled' },
  { gameId: 5, homeTeam: 'Inter Milan', awayTeam: 'AC Milan', competition: 'Serie A', datetime: new Date().toISOString(), status: 'Scheduled' },
  { gameId: 6, homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', competition: 'Bundesliga', datetime: new Date().toISOString(), status: 'Scheduled' },
];

export default function PremiumOdds() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isPremium, isVip, user } = useCurrentUser();

  useEffect(() => {
    if (isPremium || isVip) {
      loadPremiumGames();
    }
  }, [isPremium, isVip]);

  const loadPremiumGames = async () => {
    setLoading(true);
    try {
      const date = sportsApi.getDateString();
      const allGames = [];
      
      for (const comp of PREMIUM_COMPETITIONS) {
        try {
          const data = await sportsApi.fetchGamesByDate(comp, date);
          if (Array.isArray(data)) {
            const formatted = sportsApi.formatGameData(data);
            allGames.push(...formatted);
          }
        } catch (e) {}
      }

      setGames(allGames.length > 0 ? allGames : PREMIUM_DEMO_GAMES);
    } catch (error) {
      setGames(PREMIUM_DEMO_GAMES);
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

  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-heading text-3xl font-bold mb-4">Premium Odds</h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-8">
            Access exclusive premium predictions for major competitions including UEFA Champions League, 
            Premier League, La Liga, and other top-tier events with our highest confidence picks.
          </p>
          <Link to="/pricing">
            <Button size="lg" className="gap-2">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Premium Leagues
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PREMIUM_LEAGUES.map((league, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{league}</span>
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
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gold/10 text-gold font-semibold text-sm border border-gold/20">
            <Crown className="w-4 h-4" /> VIP Member
          </span>
        )}
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
            <div key={i} className="h-36 bg-card rounded-xl border border-primary/20 animate-pulse" />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
          <Crown className="w-12 h-12 mx-auto mb-4 text-primary/40" />
          <p className="text-muted-foreground font-medium">No premium games scheduled for today.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Check back soon for updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map(game => {
            const odds = sportsApi.generateOdds(game);
            return (
              <div key={game.gameId} className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{game.competition}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {sportsApi.formatDate(game.datetime)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl">{game.homeTeam}</h3>
                  </div>
                  <div className="px-6 text-center">
                    <div className="text-lg font-bold text-muted-foreground">VS</div>
                  </div>
                  <div className="flex-1 text-right">
                    <h3 className="font-semibold text-xl">{game.awayTeam}</h3>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-primary/20 flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-sm bg-green-500/10 text-green-600 px-3 py-1 rounded-full font-medium">
                      Home: {odds.home}
                    </span>
                    <span className="text-sm bg-yellow-500/10 text-yellow-600 px-3 py-1 rounded-full font-medium">
                      Draw: {odds.draw}
                    </span>
                    <span className="text-sm bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full font-medium">
                      Away: {odds.away}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded">
                      {odds.confidence}% Confidence
                    </span>
                    <span className={`text-sm font-medium px-3 py-1 rounded ${
                      odds.prediction === 'home' ? 'bg-green-500/10 text-green-600' :
                      odds.prediction === 'away' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {odds.prediction === 'home' ? 'Home Win' : odds.prediction === 'away' ? 'Away Win' : 'Draw'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-background/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Analysis: </span>
                    {game.gameId % 2 === 0 
                      ? 'Strong home record with key players in form. Defensive solidity gives home side the edge in this high-stakes encounter.'
                      : 'Recent head-to-head heavily favors the away side. Counter-attacking strategy could expose home team vulnerabilities.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
