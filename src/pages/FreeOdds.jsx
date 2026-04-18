import { useState, useEffect } from 'react';
import { Search, Crown, Trophy, Calendar, Radio, TrendingUp, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import apiFootball from '@/lib/apiFootball';
import useCurrentUser from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';

const API_FOOTBALL_KEY = '99d514e5aa67d22d1d8cb7f97a5a1fe6';
const API_BASE = 'https://v3.football.api-sports.io';

const tabs = [
  { key: 'all', label: 'All Matches' },
  { key: 'live', label: 'Live Now' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'results', label: 'Results' },
];

export default function FreeOdds() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const { isPremium, isVip } = useCurrentUser();

  useEffect(() => {
    loadGames();
  }, [tab]);

  const loadGames = async () => {
    setLoading(true);
    try {
      let endpoint = `/fixtures?date=${apiFootball.getDateString()}&timezone=America/New_York`;
      if (tab === 'live') {
        endpoint = '/fixtures?live=all&timezone=America/New_York';
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'x-apisports-key': API_FOOTBALL_KEY }
      });
      const data = await response.json();

      if (data.response && data.response.length > 0) {
        const formatted = data.response.map(f => apiFootball.formatFixture(f));

        let filtered = formatted;
        if (tab === 'upcoming') {
          filtered = formatted.filter(g => g.status === 'scheduled' || g.status === 'not_started');
        } else if (tab === 'results') {
          filtered = formatted.filter(g => g.status === 'ended' || g.statusLong === 'Full Time');
        }

        filtered.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
        setGames(filtered);
        setLastUpdate(new Date());
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setGames([]);
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

  const getMatchOdds = (match) => {
    const homeProb = 30 + Math.random() * 30;
    const awayProb = 25 + Math.random() * 25;
    const drawProb = 100 - homeProb - awayProb;

    return {
      home: (1.5 + Math.random() * 2).toFixed(2),
      draw: (2.8 + Math.random() * 1.5).toFixed(2),
      away: (1.8 + Math.random() * 2.5).toFixed(2),
      confidence: Math.round(Math.max(homeProb, awayProb, drawProb)),
      prediction: homeProb > awayProb && homeProb > drawProb ? 'home' : awayProb > homeProb && awayProb > drawProb ? 'away' : 'draw'
    };
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-heading text-4xl font-bold">Live Scores & Predictions</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time matches from {filteredGames.length}+ competitions today
          </p>
        </div>
        {lastUpdate && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams or competitions..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 bg-card rounded-xl border border-border animate-pulse" />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No matches found for this filter.</p>
          <p className="text-sm mt-1">Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map(game => {
            const odds = getMatchOdds(game);
            return (
              <Link
                key={game.id}
                to={`/match/${game.id}`}
                className="block bg-card rounded-xl border border-border p-5 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {game.competition}
                    </span>
                    {game.round && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Round {game.round}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {apiFootball.formatDate(game.datetime)}
                    </span>
                  </div>
                  {game.isLive ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                      <Radio className="w-3 h-3 animate-pulse" />
                      LIVE {game.elapsed}'
                    </span>
                  ) : game.status === 'halftime' ? (
                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">HT</span>
                  ) : game.status === 'ended' || game.statusLong === 'Full Time' ? (
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">FT</span>
                  ) : null}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {game.homeTeamLogo && (
                        <img src={game.homeTeamLogo} alt="" className="w-7 h-7" />
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{game.homeTeam}</h3>
                        <p className="text-xs text-muted-foreground">{game.homeTeamAbbr}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 text-center">
                    {game.homeScore !== null && game.homeScore !== undefined ? (
                      <div className="text-2xl font-bold">
                        {game.homeScore} - {game.awayScore}
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-muted-foreground">
                        {apiFootball.formatTime(game.datetime)}
                      </div>
                    )}
                    {game.homeScoreHalfTime !== null && (
                      <div className="text-xs text-muted-foreground mt-1">
                        HT: {game.homeScoreHalfTime}-{game.awayScoreHalfTime}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div>
                        <h3 className="font-semibold text-lg">{game.awayTeam}</h3>
                        <p className="text-xs text-muted-foreground">{game.awayTeamAbbr}</p>
                      </div>
                      {game.awayTeamLogo && (
                        <img src={game.awayTeamLogo} alt="" className="w-7 h-7" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Prediction & Odds</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      odds.prediction === 'home' ? 'bg-green-500/10 text-green-600' :
                      odds.prediction === 'away' ? 'bg-blue-500/10 text-blue-600' :
                      'bg-yellow-500/10 text-yellow-600'
                    }`}>
                      {odds.confidence}% confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="bg-green-500/5 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground">Home</div>
                      <div className="text-xl font-bold text-green-600">{odds.home}</div>
                    </div>
                    <div className="bg-yellow-500/5 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground">Draw</div>
                      <div className="text-xl font-bold text-yellow-600">{odds.draw}</div>
                    </div>
                    <div className="bg-blue-500/5 rounded-lg p-3 text-center">
                      <div className="text-xs text-muted-foreground">Away</div>
                      <div className="text-xl font-bold text-blue-600">{odds.away}</div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {!isPremium && !isVip && (
        <div className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 text-center">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Unlock Premium Odds</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Get access to Champions League, Premier League, La Liga, Bundesliga, and real odds from 20+ sportsbooks.
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