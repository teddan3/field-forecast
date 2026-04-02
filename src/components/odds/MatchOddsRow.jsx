import { Clock, Crown, Lock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import OddsCell from './OddsCell';
import moment from 'moment';

const confidenceColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-green-500/10 text-green-600',
  very_high: 'bg-primary/10 text-primary',
};

export default function MatchOddsRow({ match, odd, canViewPremium, canViewVip }) {
  const isPremium = odd?.is_premium;
  const isVip = odd?.is_vip;
  const locked = (isPremium && !canViewPremium) || (isVip && !canViewVip);
  const matchTime = match?.match_datetime ? moment(match.match_datetime) : null;
  const isLive = match?.status === 'live';
  const confidence = odd?.confidence || 'medium';

  return (
    <div className={cn(
      'group flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-all',
      isLive && 'border-accent/30 bg-accent/[0.02]'
    )}>
      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          {isLive && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-green" />
              Live
            </span>
          )}
          {match?.league_name && (
            <span className="text-[11px] text-muted-foreground font-medium truncate">{match.league_name}</span>
          )}
          {(isPremium || isVip) && (
            <span className={cn(
              'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
              isVip ? 'bg-gold/10 text-gold' : 'bg-primary/10 text-primary'
            )}>
              <Crown className="w-2.5 h-2.5" />
              {isVip ? 'VIP' : 'PRO'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{match?.home_team_name || 'TBD'}</span>
          <span className="text-xs text-muted-foreground font-mono">vs</span>
          <span className="font-medium text-sm truncate">{match?.away_team_name || 'TBD'}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {matchTime && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              {matchTime.format('MMM D, HH:mm')}
            </span>
          )}
          {odd?.prediction && !locked && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-primary">
              <TrendingUp className="w-3 h-3" />
              {odd.prediction}
            </span>
          )}
        </div>
      </div>

      {/* Confidence badge */}
      {odd && !locked && (
        <div className="hidden sm:flex items-center">
          <span className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider', confidenceColors[confidence])}>
            {confidence.replace('_', ' ')}
          </span>
        </div>
      )}

      {/* Odds cells */}
      <div className="flex items-center gap-1.5 overflow-x-auto sm:overflow-visible">
        {odd ? (
          <>
            <OddsCell value={odd.home_win} label="1" locked={locked} />
            <OddsCell value={odd.draw} label="X" locked={locked} />
            <OddsCell value={odd.away_win} label="2" locked={locked} />
            {odd.over_2_5 && <OddsCell value={odd.over_2_5} label="O2.5" locked={locked} />}
            {odd.under_2_5 && <OddsCell value={odd.under_2_5} label="U2.5" locked={locked} />}
          </>
        ) : (
          <span className="text-xs text-muted-foreground px-3">No odds yet</span>
        )}
      </div>

      {locked && (
        <div className="flex items-center">
          <Lock className="w-4 h-4 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}