'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getApiHealth, getProviderHealth, getSmsRouteHealth, getDatabaseHealth, getErrorRateHistory } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Server, Database, MessageSquare, Globe, Activity, TrendingUp, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const STATUS_ICON: Record<string, React.ReactNode> = {
  healthy: <CheckCircle className="h-4 w-4 text-felo-emerald-500" />,
  degraded: <AlertTriangle className="h-4 w-4 text-felo-amber-500" />,
  down: <XCircle className="h-4 w-4 text-red-500" />,
  maintenance: <MinusCircle className="h-4 w-4 text-blue-500" />,
};

const STATUS_BG: Record<string, string> = {
  healthy: 'bg-felo-emerald-50 border-felo-emerald-200',
  degraded: 'bg-felo-amber-50 border-felo-amber-200',
  down: 'bg-red-50 border-red-200',
  maintenance: 'bg-blue-50 border-blue-200',
};

const STATUS_DOT: Record<string, string> = {
  healthy: 'bg-felo-emerald-500',
  degraded: 'bg-felo-amber-500',
  down: 'bg-red-500',
  maintenance: 'bg-blue-500',
};

export default function SystemHealthPage() {
  const { data: apiHealth, isLoading: apiLoading } = useQuery({
    queryKey: ['apiHealth'],
    queryFn: getApiHealth,
  });
  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['providerHealth'],
    queryFn: getProviderHealth,
  });
  const { data: smsRoutes, isLoading: smsLoading } = useQuery({
    queryKey: ['smsRouteHealth'],
    queryFn: getSmsRouteHealth,
  });
  const { data: dbHealth, isLoading: dbLoading } = useQuery({
    queryKey: ['databaseHealth'],
    queryFn: getDatabaseHealth,
  });
  const { data: errorHistory, isLoading: errorLoading } = useQuery({
    queryKey: ['errorHistory'],
    queryFn: () => getErrorRateHistory(24),
  });

  const overallStatus = React.useMemo(() => {
    const allStatuses = [
      ...(apiHealth?.map((a) => a.status) || []),
      ...(providers?.map((p) => p.status) || []),
      ...(smsRoutes?.map((s) => s.status) || []),
      ...(dbHealth?.map((d) => d.status) || []),
    ];
    if (allStatuses.some((s) => s === 'down')) return 'down';
    if (allStatuses.some((s) => s === 'degraded')) return 'degraded';
    if (allStatuses.some((s) => s === 'maintenance')) return 'maintenance';
    return 'healthy';
  }, [apiHealth, providers, smsRoutes, dbHealth]);

  const overallBadge = {
    healthy: { variant: 'success' as const, label: 'All Systems Operational' },
    degraded: { variant: 'warning' as const, label: 'Degraded Performance' },
    down: { variant: 'destructive' as const, label: 'Service Disruption' },
    maintenance: { variant: 'info' as const, label: 'Maintenance Mode' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-6 w-6" />
          System Health
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time monitoring of platform infrastructure and third-party providers
        </p>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-xl border p-4 flex items-center justify-between ${STATUS_BG[overallStatus]}`}>
        <div className="flex items-center gap-3">
          {STATUS_ICON[overallStatus]}
          <div>
            <p className="font-medium">{overallBadge[overallStatus].label}</p>
            <p className="text-xs text-muted-foreground">
              Last updated: {formatDate(new Date().toISOString(), { withTime: true })}
            </p>
          </div>
        </div>
        <Badge variant={overallBadge[overallStatus].variant} className="text-sm px-3 py-1">
          {overallStatus.toUpperCase()}
        </Badge>
      </div>

      {/* API Health Cards */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3 flex items-center gap-2">
          <Server className="h-5 w-5" />
          API Health
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {apiLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))
            : apiHealth?.map((api) => (
                <Card key={api.endpoint} className={`${STATUS_BG[api.status]} transition-colors`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{api.endpoint}</span>
                      <div className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[api.status]}`} />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Latency</span>
                        <span className="font-medium">{api.latencyMs}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime</span>
                        <span className="font-medium">{api.uptimePercent.toFixed(2)}%</span>
                      </div>
                      {api.lastErrorAt && (
                        <div className="flex justify-between text-red-600">
                          <span>Last Error</span>
                          <span>{formatDate(api.lastErrorAt, { relative: true })}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* Provider Status - 17 providers */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3 flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Provider Status
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {providersLoading
            ? Array.from({ length: 17 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))
            : providers?.map((provider) => (
                <Card key={provider.id} className={`${STATUS_BG[provider.status]} transition-colors`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">{provider.name}</span>
                      {STATUS_ICON[provider.status]}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{provider.corridor}</Badge>
                      <span className="text-[10px] text-muted-foreground">{provider.latencyMs}ms</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            provider.errorRate < 1
                              ? 'bg-felo-emerald-500'
                              : provider.errorRate < 5
                              ? 'bg-felo-amber-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, provider.errorRate * 10)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-10 text-right">{provider.errorRate.toFixed(1)}%</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Last check: {formatDate(provider.lastCheckedAt, { relative: true })}
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>

      {/* SMS Routes + Database */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* SMS Route Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Route Status
            </CardTitle>
            <CardDescription>SMS parsing route health and delivery metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {smsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))
            ) : smsRoutes?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No SMS routes configured</p>
            ) : (
              smsRoutes?.map((route) => (
                <div
                  key={route.routeId}
                  className={`flex items-center justify-between rounded-lg border p-3 ${STATUS_BG[route.status]}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${STATUS_DOT[route.status]}`} />
                      <span className="font-medium text-sm">{route.bankName}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Success: {(route.successRate * 100).toFixed(1)}% · Avg: {route.avgLatencyMs}ms
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {route.lastMessageAt
                        ? formatDate(route.lastMessageAt, { relative: true })
                        : 'No recent messages'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Health
            </CardTitle>
            <CardDescription>Connection pools, query performance, and replication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dbLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))
            ) : dbHealth?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No database metrics available</p>
            ) : (
              dbHealth?.map((db) => (
                <div
                  key={db.name}
                  className={`rounded-lg border p-3 ${STATUS_BG[db.status]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${STATUS_DOT[db.status]}`} />
                      <span className="font-medium text-sm">{db.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {db.activeConnections}/{db.maxConnections}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-24">Connections</span>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-felo-sage-500"
                          style={{ width: `${(db.activeConnections / db.maxConnections) * 100}%` }}
                        />
                      </div>
                    </div>
                    {db.slowQueries > 0 && (
                      <p className="text-xs text-felo-amber-600">
                        {db.slowQueries} slow queries detected
                      </p>
                    )}
                    {db.replicationLagMs != null && db.replicationLagMs > 1000 && (
                      <p className="text-xs text-red-600">
                        Replication lag: {(db.replicationLagMs / 1000).toFixed(1)}s
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Error Rate Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Error Rate Trend (24h)
          </CardTitle>
          <CardDescription>Platform-wide error rate over the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          {errorLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : !errorHistory || errorHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Activity className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No error rate data available</p>
              <p className="text-xs">Data will appear once the monitoring pipeline is active</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={errorHistory}>
                <defs>
                  <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(ts) =>
                    new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  }
                  tick={{ fontSize: 11 }}
                />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(ts) => formatDate(ts, { withTime: true })}
                />
                <Area
                  type="monotone"
                  dataKey="errorRate"
                  stroke="#ef4444"
                  fill="url(#errorGradient)"
                  strokeWidth={2}
                  name="Error Rate %"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
