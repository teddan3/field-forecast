import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight } from 'lucide-react';

export default function Sports() {
  const [sports, setSports] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [sp, lg] = await Promise.all([
        base44.entities.Sport.filter({ status: 'active' }, 'display_order'),
        base44.entities.League.filter({ status: 'active' }),
      ]);
      setSports(sp); setLeagues(lg);
      if (sp.length > 0) setSelectedSport(sp[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const filteredLeagues = leagues.filter(l => l.sport_id === selectedSport);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold mb-2">Sports Categories</h1>
        <p className="text-muted-foreground">Browse odds by sport and league.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sports list */}
          <div className="lg:col-span-1 space-y-2">
            {sports.map(s => (
              <button key={s.id} onClick={() => setSelectedSport(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  selectedSport === s.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/30'
                }`}>
                {s.icon ? <img src={s.icon} alt="" className="w-6 h-6 object-contain" /> : <Trophy className="w-5 h-5 opacity-70" />}
                <span className="font-medium text-sm">{s.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto opacity-50" />
              </button>
            ))}
            {sports.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-sm bg-card rounded-xl border border-border">No sports configured yet.</div>
            )}
          </div>

          {/* Leagues */}
          <div className="lg:col-span-3">
            <h2 className="font-heading text-xl font-semibold mb-4">
              {sports.find(s => s.id === selectedSport)?.name || 'Select a Sport'}
            </h2>
            {filteredLeagues.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredLeagues.map(l => (
                  <div key={l.id} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-all cursor-pointer">
                    {l.logo ? (
                      <img src={l.logo} alt={l.name} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">{l.name}</p>
                      {l.country && <p className="text-xs text-muted-foreground">{l.country}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-xl border border-border">
                <p className="text-muted-foreground">No leagues available for this sport.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}