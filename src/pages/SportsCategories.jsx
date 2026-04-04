import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import localDb from '@/lib/localDb';

export default function SportsCategories() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageHeader, setPageHeader] = useState(null);
  const [sportsGrid, setSportsGrid] = useState(null);

  useEffect(() => {
    const header = localDb.sections.getByName('sports', 'page_header');
    const grid = localDb.sections.getByName('sports', 'sports_grid');
    setPageHeader(header);
    setSportsGrid(grid);
    
    if (grid?.grid_items) {
      setSports(JSON.parse(grid.grid_items).map((item, i) => ({
        id: `sp${i+1}`,
        name: item.name,
        icon: item.icon,
        color: item.color,
        count: item.count,
        leagues: [
          { id: `l${i*10+1}`, name: 'Major League' },
          { id: `l${i*10+2}`, name: 'Regional League' },
        ]
      })));
    } else {
      const demoSports = [
        { id: 'sp1', name: 'Football', icon: null, leagues: [
          { id: 'l1', name: 'Premier League' },
          { id: 'l2', name: 'La Liga' },
          { id: 'l3', name: 'Bundesliga' },
          { id: 'l4', name: 'Serie A' },
          { id: 'l5', name: 'Ligue 1' },
        ]},
        { id: 'sp2', name: 'Basketball', icon: null, leagues: [
          { id: 'l6', name: 'NBA' },
          { id: 'l7', name: 'EuroLeague' },
        ]},
        { id: 'sp3', name: 'Tennis', icon: null, leagues: [
          { id: 'l8', name: 'ATP Tour' },
          { id: 'l9', name: 'WTA Tour' },
        ]},
        { id: 'sp4', name: 'Baseball', icon: null, leagues: [
          { id: 'l10', name: 'MLB' },
        ]},
        { id: 'sp5', name: 'Hockey', icon: null, leagues: [
          { id: 'l11', name: 'NHL' },
        ]},
        { id: 'sp6', name: 'American Football', icon: null, leagues: [
          { id: 'l12', name: 'NFL' },
        ]},
      ];
      setSports(demoSports);
    }
    setLoading(false);
  }, []);

  const title = pageHeader?.title || 'Sports Categories';
  const subtitle = pageHeader?.subtitle || 'Browse odds by sport and league';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-2">{title}</h1>
        <p className="text-muted-foreground">{subtitle}</p>
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
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-semibold">{sport.name}</h2>
                  <span className="text-xs text-muted-foreground">{sport.leagues?.length || 0} leagues</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {(sport.leagues || []).slice(0, 5).map(league => (
                  <Link
                    key={league.id}
                    to={`/free-odds?league=${league.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm group"
                  >
                    <span className="flex items-center gap-2">
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
