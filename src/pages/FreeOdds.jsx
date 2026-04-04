import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MatchOddsRow from '../components/odds/MatchOddsRow';
import useCurrentUser from '../hooks/useCurrentUser';
import localDb from '@/lib/localDb';

const tabs = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'all', label: 'All' },
];

function getDateStr(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function FreeOdds() {
  const [matches, setMatches] = useState([]);
  const [odds, setOdds] = useState([]);
  const [sports, setSports] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [leagueFilter, setLeagueFilter] = useState('all');
  const { isPremium, isVip } = useCurrentUser();
  const [pageHeader, setPageHeader] = useState(null);

  useEffect(() => {
    const header = localDb.sections.getByName('free-odds', 'page_header');
    setPageHeader(header);

    const demoSports = [
      { id: 's1', name: 'Football' },
      { id: 's2', name: 'Basketball' },
      { id: 's3', name: 'Tennis' },
    ];
    const demoLeagues = [
      { id: 'l1', name: 'Premier League' },
      { id: 'l2', name: 'La Liga' },
      { id: 'l3', name: 'Bundesliga' },
    ];
    const demoMatches = [
      { id: 'm1', home_team_name: 'Manchester United', away_team_name: 'Liverpool', league_name: 'Premier League', sport_id: 's1', league_id: 'l1', match_datetime: getDateStr(), status: 'upcoming' },
      { id: 'm2', home_team_name: 'Real Madrid', away_team_name: 'Barcelona', league_name: 'La Liga', sport_id: 's1', league_id: 'l2', match_datetime: getDateStr(), status: 'upcoming' },
      { id: 'm3', home_team_name: 'Bayern Munich', away_team_name: 'Dortmund', league_name: 'Bundesliga', sport_id: 's1', league_id: 'l3', match_datetime: getDateStr(1), status: 'upcoming' },
      { id: 'm4', home_team_name: 'PSG', away_team_name: 'Marseille', league_name: 'Ligue 1', sport_id: 's1', league_id: 'l1', match_datetime: getDateStr(), status: 'upcoming' },
      { id: 'm5', home_team_name: 'Juventus', away_team_name: 'AC Milan', league_name: 'Serie A', sport_id: 's1', league_id: 'l1', match_datetime: getDateStr(2), status: 'upcoming' },
    ];
    const demoOdds = [
      { match_id: 'm1', home_odds: 2.1, draw_odds: 3.4, away_odds: 3.5, prediction: 'home', confidence: 78 },
      { match_id: 'm2', home_odds: 1.9, draw_odds: 3.6, away_odds: 4.2, prediction: 'home', confidence: 82 },
      { match_id: 'm3', home_odds: 1.7, draw_odds: 4.0, away_odds: 4.5, prediction: 'home', confidence: 85 },
      { match_id: 'm4', home_odds: 1.8, draw_odds: 3.5, away_odds: 4.8, prediction: 'home', confidence: 75 },
      { match_id: 'm5', home_odds: 2.2, draw_odds: 3.2, away_odds: 3.3, prediction: 'away', confidence: 70 },
    ];

    setMatches(demoMatches);
    setOdds(demoOdds);
    setSports(demoSports);
    setLeagues(demoLeagues);
    setLoading(false);
  }, []);

  const title = pageHeader?.title || 'Free Odds';
  const subtitle = pageHeader?.subtitle || "Today's best free predictions and odds analysis.";
  const oddsMap = Object.fromEntries(odds.map(o => [o.match_id, o]));

  const filtered = useMemo(() => {
    let result = matches;
    if (tab === 'today') result = result.filter(m => new Date(m.match_datetime).toDateString() === new Date().toDateString());
    else if (tab === 'tomorrow') result = result.filter(m => {
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      return new Date(m.match_datetime).toDateString() === tomorrow.toDateString();
    });
    if (sportFilter !== 'all') result = result.filter(m => m.sport_id === sportFilter);
    if (leagueFilter !== 'all') result = result.filter(m => m.league_id === leagueFilter);
    if (search) result = result.filter(m => `${m.home_team_name} ${m.away_team_name} ${m.league_name}`.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [matches, tab, sportFilter, leagueFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search matches..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Sport" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {sports.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={leagueFilter} onValueChange={setLeagueFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="League" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Leagues</SelectItem>
            {leagues.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(m => <MatchOddsRow key={m.id} match={m} odd={oddsMap[m.id]} canViewPremium={isPremium} canViewVip={isVip} />)}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No matches found for this filter.</p>
        </div>
      )}
    </div>
  );
}
