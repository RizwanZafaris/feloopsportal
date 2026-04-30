'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRemittanceProviders, getMarketQuotes, overrideFxRate, getComplianceFlags, assignComplianceFlag, resolveComplianceFlag } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Send, TrendingUp, ShieldAlert, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import type { RemittanceProvider, MarketQuote, ComplianceFlag } from '@/types/admin';

export default function RemittanceOpsPage() {
  const qc = useQueryClient();
  const [fxRate, setFxRate] = React.useState('');
  const [fxReason, setFxReason] = React.useState('');
  const [selectedQuote, setSelectedQuote] = React.useState('');

  const { data: providers, isLoading: providersLoading } = useQuery({ queryKey: ['remittanceProviders'], queryFn: listRemittanceProviders });
  const { data: quotes } = useQuery({ queryKey: ['marketQuotes'], queryFn: () => getMarketQuotes() });
  const { data: flags } = useQuery({ queryKey: ['complianceFlags'], queryFn: () => getComplianceFlags('open') });

  const overrideMutation = useMutation({
    mutationFn: () => overrideFxRate(selectedQuote, parseFloat(fxRate), fxReason),
    onSuccess: () => {
      toast({ title: 'FX rate overridden', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['marketQuotes'] });
      setFxRate('');
      setFxReason('');
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignedTo }: { id: string; assignedTo: string }) => assignComplianceFlag(id, assignedTo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complianceFlags'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution, approved }: { id: string; resolution: string; approved: boolean }) => resolveComplianceFlag(id, resolution, approved),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['complianceFlags'] }),
  });

  const providerColumns = [
    { key: 'name', header: 'Provider', render: (p: RemittanceProvider) => p.name },
    { key: 'corridors', header: 'Corridors', render: (p: RemittanceProvider) => p.corridors.map(c => <Badge key={c} variant="outline" className="mr-1">{c}</Badge>) },
    { key: 'feeStructure', header: 'Fee Type', render: (p: RemittanceProvider) => p.feeStructure.type },
    { key: 'fxMargin', header: 'FX Margin', render: (p: RemittanceProvider) => `${(p.fxMargin * 100).toFixed(2)}%` },
    { key: 'etaMinutes', header: 'ETA', render: (p: RemittanceProvider) => `${p.etaMinutes}m` },
    { key: 'isActive', header: 'Active', render: (p: RemittanceProvider) => <Switch checked={p.isActive} /> },
    { key: 'reliabilityScore', header: 'Reliability', render: (p: RemittanceProvider) => (
      <Badge variant={p.reliabilityScore > 0.95 ? 'success' : p.reliabilityScore > 0.8 ? 'warning' : 'destructive'}>
        {(p.reliabilityScore * 100).toFixed(0)}%
      </Badge>
    )},
  ];

  const quoteColumns = [
    { key: 'corridorFrom', header: 'From', render: (q: MarketQuote) => q.corridorFrom },
    { key: 'corridorTo', header: 'To', render: (q: MarketQuote) => q.corridorTo },
    { key: 'fxRate', header: 'FX Rate', render: (q: MarketQuote) => q.fxRate.toFixed(4) },
    { key: 'spread', header: 'Spread', render: (q: MarketQuote) => `${(q.spread * 100).toFixed(2)}%` },
    { key: 'isOverridden', header: 'Override', render: (q: MarketQuote) => q.isOverridden ? <Badge variant="warning">Manual</Badge> : <Badge variant="outline">Auto</Badge> },
    { key: 'actions', header: '', render: (q: MarketQuote) => (
      <Button variant="ghost" size="sm" onClick={() => setSelectedQuote(q.id)}>Override</Button>
    )},
  ];

  const flagColumns = [
    { key: 'userId', header: 'User', render: (f: ComplianceFlag) => <span className="font-mono text-xs">{f.userId.slice(0, 8)}</span> },
    { key: 'type', header: 'Type', render: (f: ComplianceFlag) => <Badge variant="outline">{f.type}</Badge> },
    { key: 'severity', header: 'Severity', render: (f: ComplianceFlag) => (
      <Badge variant={f.severity === 'critical' ? 'destructive' : f.severity === 'high' ? 'warning' : 'secondary'}>{f.severity}</Badge>
    )},
    { key: 'description', header: 'Description', render: (f: ComplianceFlag) => <span className="text-sm">{f.description}</span> },
    { key: 'actions', header: '', render: (f: ComplianceFlag) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => assignMutation.mutate({ id: f.id, assignedTo: 'admin-1' })}><UserCheck className="h-3 w-3" /></Button>
        <Button variant="ghost" size="sm" onClick={() => resolveMutation.mutate({ id: f.id, resolution: 'Approved', approved: true })}><CheckCircle className="h-3 w-3 text-felo-emerald-600" /></Button>
        <Button variant="ghost" size="sm" onClick={() => resolveMutation.mutate({ id: f.id, resolution: 'Rejected', approved: false })}><XCircle className="h-3 w-3 text-red-500" /></Button>
      </div>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Send className="h-6 w-6" />
          Remittance Ops
        </h1>
        <p className="text-sm text-muted-foreground">Manage providers, FX rates, and compliance flags</p>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="fx">FX Rates</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Queue {flags && flags.length > 0 && `(${flags.length})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <DataTable columns={providerColumns} data={providers || []} keyExtractor={(p) => p.id} loading={providersLoading} />
        </TabsContent>

        <TabsContent value="fx" className="space-y-4">
          {selectedQuote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> FX Override</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-3">
                  <Input placeholder="New rate" type="number" value={fxRate} onChange={(e) => setFxRate(e.target.value)} />
                  <Input placeholder="Reason for override" value={fxReason} onChange={(e) => setFxReason(e.target.value)} />
                  <Button onClick={() => overrideMutation.mutate()} loading={overrideMutation.isPending} disabled={!fxRate || !fxReason}>
                    Submit Override
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Requires two-person approval if amount exceeds threshold</p>
              </CardContent>
            </Card>
          )}
          <DataTable columns={quoteColumns} data={quotes || []} keyExtractor={(q) => q.id} />
        </TabsContent>

        <TabsContent value="compliance">
          <DataTable columns={flagColumns} data={flags || []} keyExtractor={(f) => f.id} emptyMessage="No open compliance flags" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
