import { Zap } from 'lucide-react';

export default function LiveTicker({ matches = [] }) {
  const liveMatches = matches.filter(m => m.status === 'live');

  if (liveMatches.length === 0) return null;

  return (
    <div className="w-full bg-foreground text-background overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-2 animate-marquee whitespace-nowrap">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent shrink-0">
          <Zap className="w-3 h-3" /> Live
        </span>
        {liveMatches.map(m => (
          <span key={m.id} className="flex items-center gap-2 text-xs shrink-0">
            <span className="font-medium">{m.home_team_name}</span>
            <span className="font-mono font-bold text-accent">{m.home_score ?? 0} - {m.away_score ?? 0}</span>
            <span className="font-medium">{m.away_team_name}</span>
            <span className="text-background/40 mx-2">|</span>
          </span>
        ))}
        {liveMatches.map(m => (
          <span key={`dup-${m.id}`} className="flex items-center gap-2 text-xs shrink-0">
            <span className="font-medium">{m.home_team_name}</span>
            <span className="font-mono font-bold text-accent">{m.home_score ?? 0} - {m.away_score ?? 0}</span>
            <span className="font-medium">{m.away_team_name}</span>
            <span className="text-background/40 mx-2">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}