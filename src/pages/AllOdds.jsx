import { useState, useEffect } from 'react';
import { Search, Crown, Trophy, Radio, ChevronDown, Filter, Globe, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sportradarApi, PREMIUM_COMPETITIONS, FREE_COMPETITIONS } from '@/lib/sportradarApi';
import useCurrentUser from '@/hooks/useCurrentUser';
import { Link } from 'react-router-dom';

const tabs = [
  { key: 'all', label: 'All Matches' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'results', label: 'Results' },
];

export default function AllOdds() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [leagueDropdownOpen, setLeagueDropdownOpen] = useState(false);
  const { isPremium, isVip } = useCurrentUser();

  const allCompetitions = [...PREMIUM_COMPETITIONS, ...FREE_COMPETITIONS];

  useEffect(() => {
    loadAllGames();
  }, [tab, selectedLeague]);

  const loadAllGames = async () => {
    setLoading(true);
    try {
      let allGames;
      
      if (selectedLeague) {
        const games = await sportradarApi.fetchGamesByCompetition(selectedLeague.id);
        allGames = games;
      } else {
        const [free, premium] = await Promise.all([
          sportradarApi.fetchAllFreeGames(),
          isPremium || isVip ? sportradarApi.fetchAllPremiumGames() : Promise.resolve([])
        ]);
        allGames = [...free, ...premium];
      }

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

  const groupedGames = filteredGames.reduce((acc, game) => {
    const comp = game.competition;
    if (!acc[comp]) acc[comp] = [];
    acc[comp].push(game);
    return acc;
  }, {});

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <h1 className="font-heading text-4xl font-bold">All Leagues</h1>
        </div>
        <p className="text-muted-foreground">Browse matches from leagues around the world.</p>
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

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="pl-10"
          />
        </div>
        
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setLeagueDropdownOpen(!leagueDropdownOpen)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {selectedLeague ? selectedLeague.name : 'All Leagues'}
            <ChevronDown className="w-4 h-4" />
          </Button>
          
          {leagueDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => { setSelectedLeague(null); setLeagueDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted ${
                    !selectedLeague ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                >
                  All Leagues
                </button>
                
                <div className="border-t my-2" />
                <div className="text-xs text-muted-foreground px-3 py-1">Premium Leagues</div>
                {PREMIUM_COMPETITIONS.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => { setSelectedLeague(comp); setLeagueDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted flex items-center gap-2 ${
                      selectedLeague?.id === comp.id ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                  >
                    <Crown className="w-3 h-3 text-primary" />
                    {comp.name}
                  </button>
                ))}
                
                <div className="border-t my-2" />
                <div className="text-xs text-muted-foreground px-3 py-1">Free Leagues</div>
                {FREE_COMPETITIONS.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => { setSelectedLeague(comp); setLeagueDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted ${
                      selectedLeague?.id === comp.id ? 'bg-primary/10 text-primary font-medium' : ''
                    }`}
                  >
                    {comp.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLeague && (
        <div className="mb-6 flex items-center gap-2">
          <Badge variant="secondary">
            {selectedLeague.name}
          </Badge>
          <button onClick={() => setSelectedLeague(null)} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <div className="h-6 w-32 bg-muted rounded mb-3 animate-pulse" />
              <div className="space-y-3">
                {[1, 2].map(j => (
                  <div key={j} className="h-24 bg-card rounded-xl border animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium">No matches found.</p>
          <p className="text-sm mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedGames).map(([competition, compGames]) => {
            const compInfo = allCompetitions.find(c => c.name === competition);
            const isPremiumComp = compInfo?.tier === 1 || PREMIUM_COMPETITIONS.some(p => p.name === competition);
            
            return (
              <div key={competition}>
                <div className="flex items-center gap-2 mb-4">
                  {isPremiumComp ? (
                    <Crown className="w-5 h-5 text-primary" />
                  ) : (
                    <Trophy className="w-5 h-5 text-muted-foreground" />
                  )}
                  <h2 className="text-xl font-bold">{competition}</h2>
                  {isPremiumComp && (
                    <Badge variant="outline" className="text-xs">Premium</Badge>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto">
                    {compGames.length} matches
                  </span>
                </div>
                
                <div className="space-y-3">
                  {compGames.map(game => (
                    <Link
                      key={game.id}
                      to={`/match/${game.id}`}
                      className="block bg-card rounded-xl border border-border p-4 hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {sportradarApi.formatDate(game.datetime)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {sportradarApi.formatTime(game.datetime)}
                          </span>
                        </div>
                        {getStatusBadge(game)}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-semibold">{game.homeTeam}</span>
                          <span className="text-xs text-muted-foreground ml-2">{game.homeTeamAbbr}</span>
                        </div>
                        
                        <div className="px-4 text-center">
                          {game.homeScore !== null && game.homeScore !== undefined ? (
                            <span className="text-xl font-bold">
                              {game.homeScore} - {game.awayScore}
                            </span>
                          ) : (
                            <span className="text-xl font-bold text-muted-foreground">VS</span>
                          )}
                        </div>
                        
                        <div className="flex-1 text-right">
                          <span className="font-semibold">{game.awayTeam}</span>
                          <span className="text-xs text-muted-foreground mr-2">{game.awayTeamAbbr}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isPremium && !isVip && (
        <div className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-8 text-center">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Unlock Premium Leagues</h2>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            Get access to Champions League, Premier League, La Liga, Bundesliga, Serie A, and Ligue 1.
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link to="/pricing">
              <Crown className="w-4 h-4" />
              Upgrade to Premium
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
