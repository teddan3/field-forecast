import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MatchOddsRow from '../components/odds/MatchOddsRow';
import useCurrentUser from '../hooks/useCurrentUser';
import moment from 'moment';

const tabs = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'weekend', label: 'Weekend' },
  { key: 'all', label: 'All' },
];

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

  useEffect(() => {
    const load = async () => {
      const [m, o, sp, lg] = await Promise.all([
        base44.entities.Match.list('-match_datetime', 100),
        base44.entities.Odd.filter({ workflow_status: 'published', is_premium: false }, '-created_date', 100),
        base44.entities.Sport.filter({ status: 'active' }),
        base44.entities.League.filter({ status: 'active' }),
      ]);
      setMatches(m); setOdds(o); setSports(sp); setLeagues(lg);
      setLoading(false);
    };
    load();
  }, []);

  const oddsMap = Object.fromEntries(odds.map(o => [o.match_id, o]));

  const filtered = useMemo(() => {
    let result = matches;
    if (tab === 'today') result = result.filter(m => moment(m.match_datetime).isSame(moment(), 'day'));
    else if (tab === 'tomorrow') result = result.filter(m => moment(m.match_datetime).isSame(moment().add(1, 'day'), 'day'));
    else if (tab === 'weekend') {
      const sat = moment().day(6); const sun = moment().day(7);
      result = result.filter(m => moment(m.match_datetime).isBetween(sat.startOf('day'), sun.endOf('day'), null, '[]'));
    }
    if (sportFilter !== 'all') result = result.filter(m => m.sport_id === sportFilter);
    if (leagueFilter !== 'all') result = result.filter(m => m.league_id === leagueFilter);
    if (search) result = result.filter(m => `${m.home_team_name} ${m.away_team_name} ${m.league_name}`.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [matches, tab, sportFilter, leagueFilter, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-2">Free Odds</h1>
        <p className="text-muted-foreground">Today's best free predictions and odds analysis.</p>
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