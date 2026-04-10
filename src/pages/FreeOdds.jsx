import { useState, useEffect } from 'react';
import { Search, Crown, Trophy, Calendar, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import sportsApi from '@/lib/sportsApi';
import useCurrentUser from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';

const tabs = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'all', label: 'All' },
];

export default function FreeOdds() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const [search, setSearch] = useState('');
  const { isPremium, isVip } = useCurrentUser();

  useEffect(() => {
    loadGames();
  }, [tab]);

  const loadGames = async () => {
    setLoading(true);
    try {
      let date = sportsApi.getDateString();
      if (tab === 'tomorrow') date = sportsApi.getDateString(1);
      
      const allGames = [];
      const competitions = ['MLS', 'EL1', 'EL2', 'MLS', 'ARG', 'BRA', 'JPN'];
      
      for (const comp of competitions.slice(0, 3)) {
        try {
          const data = await sportsApi.fetchGamesByDate(comp, date);
          if (Array.isArray(data)) {
            const formatted = sportsApi.formatGameData(data);
            allGames.push(...formatted);
          }
        } catch (e) {}
      }

      setGames(allGames.length > 0 ? allGames : getDemoGames());
    } catch (error) {
      setGames(getDemoGames());
    }
    setLoading(false);
  };

  const getDemoGames = () => [
    { gameId: 1, homeTeam: 'LA Galaxy', awayTeam: 'Seattle Sounders', competition: 'MLS', datetime: new Date().toISOString(), status: 'Scheduled', homeScore: null, awayScore: null },
    { gameId: 2, homeTeam: 'Orlando City', awayTeam: 'Inter Miami', competition: 'MLS', datetime: new Date().toISOString(), status: 'Scheduled', homeScore: null, awayScore: null },
    { gameId: 3, homeTeam: 'Celtic', awayTeam: 'Rangers', competition: 'Scottish Premiership', datetime: new Date().toISOString(), status: 'Scheduled', homeScore: null, awayScore: null },
    { gameId: 4, homeTeam: 'Ajax', awayTeam: 'PSV', competition: 'Eredivisie', datetime: new Date().toISOString(), status: 'Scheduled', homeScore: null, awayScore: null },
  ];

  const filteredGames = games.filter(g => {
    if (!search) return true;
    const s = search.toLowerCase();
    return g.homeTeam?.toLowerCase().includes(s) || 
           g.awayTeam?.toLowerCase().includes(s) ||
           g.competition?.toLowerCase().includes(s);
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-2">Free Odds</h1>
        <p className="text-muted-foreground">Free predictions for today's matches across major leagues.</p>
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
          placeholder="Search teams or competitions..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No games found for this filter.</p>
          <p className="text-sm mt-1">Try a different date or competition.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map(game => {
            const odds = sportsApi.generateOdds(game);
            return (
              <div key={game.gameId} className="bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {game.competition}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sportsApi.formatDate(game.datetime)}
                    </span>
                  </div>
                  {game.status === 'InProgress' && (
                    <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                      LIVE
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{game.homeTeam}</h3>
                    <p className="text-sm text-muted-foreground">Home</p>
                  </div>
                  
                  <div className="px-6 text-center">
                    {game.homeScore !== null ? (
                      <div className="text-2xl font-bold">
                        {game.homeScore} - {game.awayScore}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">VS</div>
                    )}
                    {game.period && <p className="text-xs text-muted-foreground">{game.period} {game.clock}</p>}
                  </div>
                  
                  <div className="flex-1 text-right">
                    <h3 className="font-semibold text-lg">{game.awayTeam}</h3>
                    <p className="text-sm text-muted-foreground">Away</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{odds.confidence}% confidence</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      odds.prediction === 'home' ? 'bg-green-500/10 text-green-600' :
                      odds.prediction === 'away' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {odds.prediction === 'home' ? 'Home Win' : odds.prediction === 'away' ? 'Away Win' : 'Draw'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isPremium && !isVip && (
        <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 text-center">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Unlock Premium Odds</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Get access to Champions League, Premier League, La Liga, and other major competitions with higher confidence predictions.
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
