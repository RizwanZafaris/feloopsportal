'use client';

import { useQuery } from '@tanstack/react-query';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getDashboardStats, getSignupFunnel, getTransactionSources, getServiceHealth, getRecentAuditLog } from '@/lib/api';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import {
  Users, Activity, CreditCard, TrendingUp, AlertTriangle, ActivitySquare,
  Server, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

const PIE_COLORS = ['#4d7a4d', '#6f966f', '#9bb89b', '#d5ccbe', '#f59e0b'];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['dashboardStats'], queryFn: getDashboardStats });
  const { data: funnel } = useQuery({ queryKey: ['signupFunnel'], queryFn: () => getSignupFunnel(30) });
  const { data: sources } = useQuery({ queryKey: ['transactionSources'], queryFn: getTransactionSources });
  const { data: health } = useQuery({ queryKey: ['serviceHealth'], queryFn: getServiceHealth });
  const { data: auditLog } = useQuery({ queryKey: ['recentAuditLog'], queryFn: () => getRecentAuditLog(10) });

  const statItems = [
    { title: 'Total Users', value: stats?.totalUsers ?? 0, icon: <Users className="h-5 w-5" />, subtitle: `${stats?.newUsersThisWeek ?? 0} this week` },
    { title: 'Active Today', value: stats?.activeUsersToday ?? 0, icon: <Activity className="h-5 w-5" />, subtitle: 'Daily active users' },
    { title: 'MRR', value: formatCurrency(stats?.mrr ?? 0, 'USD'), icon: <CreditCard className="h-5 w-5" />, subtitle: 'Monthly recurring' },
    { title: 'ARPU', value: formatCurrency(stats?.arpu ?? 0, 'USD'), icon: <TrendingUp className="h-5 w-5" />, subtitle: 'Per user' },
    { title: 'Churn Rate', value: formatPercent(stats?.churnRate ?? 0), icon: <AlertTriangle className="h-5 w-5" />, subtitle: 'Monthly', trend: { value: 0.5, positive: false } },
    { title: 'Transactions', value: stats?.transactionsToday ?? 0, icon: <ActivitySquare className="h-5 w-5" />, subtitle: 'Today' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of FELO platform health and activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statItems.map((s) => (
          <StatCard key={s.title} {...s} loading={statsLoading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Signup Funnel (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {funnel ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={funnel}>
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4d7a4d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[250px] w-full" />
            )}
          </CardContent>
        </Card>

        {/* Transaction Sources */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {sources ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={sources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={90} label>
                    {sources.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-[250px] w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Health + Audit Log */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Service Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="space-y-3">
                {health.map((svc) => (
                  <div key={svc.service} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        svc.status === 'healthy' ? 'bg-felo-emerald-500' :
                        svc.status === 'degraded' ? 'bg-felo-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium">{svc.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{svc.uptime.toFixed(1)}% uptime</span>
                      <Badge variant={svc.status === 'healthy' ? 'success' : svc.status === 'degraded' ? 'warning' : 'destructive'}>
                        {svc.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Audit Log</CardTitle>
          </CardHeader>
          <CardContent>
            {auditLog ? (
              <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      entry.severity === 'critical' ? 'bg-red-500' :
                      entry.severity === 'warning' ? 'bg-felo-amber-500' : 'bg-felo-sage-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{entry.resourceType} — {entry.actorId}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt, { relative: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
