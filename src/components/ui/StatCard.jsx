import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, trend, className }) {
  return (
    <div className={cn('bg-card rounded-xl border border-border p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      <div className="font-heading text-2xl font-bold">{value}</div>
      {trend && (
        <span className={cn(
          'text-xs font-medium mt-1 inline-block',
          trend > 0 ? 'text-accent' : 'text-destructive'
        )}>
          {trend > 0 ? '+' : ''}{trend}% from yesterday
        </span>
      )}
    </div>
  );
}