import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';

export default function SportsCategories() {
  const [sports, setSports] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [s, l] = await Promise.all([
        base44.entities.Sport.filter({ status: 'active' }, 'display_order', 50),
        base44.entities.League.filter({ status: 'active' }, 'name', 100),
      ]);
      setSports(s); setLeagues(l);
      setLoading(false);
    };
    load();
  }, []);

  const leaguesBySport = {};
  leagues.forEach(l => {
    if (!leaguesBySport[l.sport_id]) leaguesBySport[l.sport_id] = [];
    leaguesBySport[l.sport_id].push(l);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">Sports Categories</h1>
        <p className="text-muted-foreground">Browse odds by sport and league</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-card rounded-xl border border-border animate-pulse" />)}
        </div>
      ) : sports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sports.map(sport => (
            <div key={sport.id} className="bg-card rounded-xl border border-border p-6 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                {sport.icon ? (
                  <img src={sport.icon} alt={sport.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="font-heading text-lg font-semibold">{sport.name}</h2>
                  <span className="text-xs text-muted-foreground">{(leaguesBySport[sport.id] || []).length} leagues</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {(leaguesBySport[sport.id] || []).slice(0, 5).map(league => (
                  <Link
                    key={league.id}
                    to={`/free-odds?league=${league.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm group"
                  >
                    <span className="flex items-center gap-2">
                      {league.logo && <img src={league.logo} alt={league.name} className="w-4 h-4 rounded" />}
                      {league.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No sports available yet</p>
          <p className="text-sm mt-1">Sports will appear here once added by an admin</p>
        </div>
      )}
    </div>
  );
}