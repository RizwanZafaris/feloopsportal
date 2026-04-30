'use client';

import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, trend, loading, className }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('rounded-xl border bg-card p-6 shadow-sm', className)}>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2">
              {trend && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    trend.positive ? 'bg-felo-emerald-100 text-felo-emerald-700' : 'bg-red-100 text-red-700'
                  )}
                >
                  {trend.positive ? '+' : ''}
                  {trend.value}%
                </span>
              )}
              {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-felo-sage-100 text-felo-sage-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
