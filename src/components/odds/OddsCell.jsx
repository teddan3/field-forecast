import { cn } from '@/lib/utils';

export default function OddsCell({ value, label, highlight = false, locked = false }) {
  if (locked) {
    return (
      <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-muted/50 backdrop-blur-sm min-w-[60px]">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        <span className="font-mono text-sm text-muted-foreground/40">•••</span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col items-center justify-center px-3 py-2 rounded-lg min-w-[60px] transition-all cursor-default',
      'hover:bg-primary/5 border border-transparent hover:border-primary/10',
      highlight && 'bg-accent/5 border-accent/20'
    )}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={cn(
        'font-mono text-sm font-semibold tabular-nums',
        highlight ? 'text-accent' : 'text-foreground'
      )}>
        {typeof value === 'number' ? value.toFixed(2) : value}
      </span>
    </div>
  );
}