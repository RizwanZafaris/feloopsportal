'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLog, getAnomalies } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { ClipboardList, Search, AlertTriangle, Moon } from 'lucide-react';
import type { AuditLogEntry } from '@/types/admin';

export default function AuditViewerPage() {
  const [search, setSearch] = React.useState('');
  const [actorId, setActorId] = React.useState('');
  const { data: auditLog, isLoading } = useQuery({ queryKey: ['auditLog', search, actorId], queryFn: () => listAuditLog({ search: search || undefined, actorId: actorId || undefined, limit: 50 }) });
  const { data: anomalies } = useQuery({ queryKey: ['anomalies'], queryFn: getAnomalies });

  const columns = [
    { key: 'createdAt', header: 'Time', render: (e: AuditLogEntry) => <span className="text-xs whitespace-nowrap">{formatDate(e.createdAt, { withTime: true })}</span> },
    { key: 'actorId', header: 'Actor', render: (e: AuditLogEntry) => <span className="font-mono text-xs">{e.actorId.slice(0, 10)}</span> },
    { key: 'action', header: 'Action', render: (e: AuditLogEntry) => <Badge variant="outline">{e.action}</Badge> },
    { key: 'resourceType', header: 'Resource', render: (e: AuditLogEntry) => <span className="text-sm">{e.resourceType}:{e.resourceId.slice(0, 8)}</span> },
    { key: 'severity', header: 'Severity', render: (e: AuditLogEntry) => (
      <Badge variant={e.severity === 'critical' ? 'destructive' : e.severity === 'warning' ? 'warning' : 'secondary'}>{e.severity}</Badge>
    )},
    { key: 'ipAddress', header: 'IP', render: (e: AuditLogEntry) => <span className="text-xs text-muted-foreground">{e.ipAddress}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Audit Viewer
        </h1>
        <p className="text-sm text-muted-foreground">Full audit trail with search, diff rendering, and anomaly detection</p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search actions, resources..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Input placeholder="Filter by actor ID" value={actorId} onChange={(e) => setActorId(e.target.value)} className="max-w-xs" />
          </div>
          <DataTable columns={columns} data={auditLog?.items || []} keyExtractor={(e) => e.id} loading={isLoading} />
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          {anomalies && (
            <>
              {anomalies.massExports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-felo-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      Mass Export Alerts ({anomalies.massExports.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={columns} data={anomalies.massExports} keyExtractor={(e) => e.id} />
                  </CardContent>
                </Card>
              )}
              {anomalies.afterHoursAccess.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-felo-amber-600">
                      <Moon className="h-4 w-4" />
                      After-Hours Access ({anomalies.afterHoursAccess.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DataTable columns={columns} data={anomalies.afterHoursAccess} keyExtractor={(e) => e.id} />
                  </CardContent>
                </Card>
              )}
              {anomalies.massExports.length === 0 && anomalies.afterHoursAccess.length === 0 && (
                <Card><CardContent className="py-12 text-center text-muted-foreground">No anomalies detected</CardContent></Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
