'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listCoachPrompts, listGuardrailTrips, getTokenCostDashboard, getCanaryConfig, updateCanaryConfig } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Brain, ShieldAlert, Coins, ArrowRightLeft } from 'lucide-react';
import type { CoachPrompt, CoachGuardrailTrip } from '@/types/admin';

export default function CoachOpsPage() {
  const qc = useQueryClient();
  const { data: prompts, isLoading: promptsLoading } = useQuery({ queryKey: ['coachPrompts'], queryFn: listCoachPrompts });
  const { data: guardrails } = useQuery({ queryKey: ['guardrailTrips'], queryFn: () => listGuardrailTrips() });
  const { data: tokenCosts } = useQuery({ queryKey: ['tokenCosts'], queryFn: getTokenCostDashboard });
  const { data: canary } = useQuery({ queryKey: ['canary'], queryFn: getCanaryConfig });

  const canaryMutation = useMutation({
    mutationFn: (percent: number) => updateCanaryConfig({ trafficPercent: percent }),
    onSuccess: () => {
      toast({ title: 'Canary updated', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['canary'] });
    },
  });

  const [trafficPercent, setTrafficPercent] = React.useState(canary?.trafficPercent ?? 0);

  React.useEffect(() => {
    if (canary) setTrafficPercent(canary.trafficPercent);
  }, [canary]);

  const promptColumns = [
    { key: 'name', header: 'Name', render: (p: CoachPrompt) => <span className="font-medium">{p.name}</span> },
    { key: 'version', header: 'Version', render: (p: CoachPrompt) => <Badge variant="outline">v{p.version}</Badge> },
    { key: 'isActive', header: 'Status', render: (p: CoachPrompt) => <Badge variant={p.isActive ? 'success' : 'secondary'}>{p.isActive ? 'Active' : 'Draft'}</Badge> },
    { key: 'createdBy', header: 'Author', render: (p: CoachPrompt) => <span className="text-sm">{p.createdBy}</span> },
    { key: 'activatedAt', header: 'Activated', render: (p: CoachPrompt) => p.activatedAt ? new Date(p.activatedAt).toLocaleDateString() : '—' },
    { key: 'body', header: 'Preview', render: (p: CoachPrompt) => <span className="text-sm text-muted-foreground truncate max-w-xs block">{p.body.slice(0, 60)}...</span> },
  ];

  const guardrailColumns = [
    { key: 'guardrailType', header: 'Type', render: (g: CoachGuardrailTrip) => <Badge variant="outline">{g.guardrailType}</Badge> },
    { key: 'severity', header: 'Severity', render: (g: CoachGuardrailTrip) => (
      <Badge variant={g.severity === 'critical' ? 'destructive' : g.severity === 'high' ? 'warning' : 'secondary'}>{g.severity}</Badge>
    )},
    { key: 'messagePreview', header: 'Preview', render: (g: CoachGuardrailTrip) => <span className="text-sm truncate max-w-xs block">{g.messagePreview}</span> },
    { key: 'blockedBy', header: 'Blocked By', render: (g: CoachGuardrailTrip) => g.blockedBy },
    { key: 'reviewStatus', header: 'Review', render: (g: CoachGuardrailTrip) => <Badge variant={g.reviewStatus === 'open' ? 'warning' : g.reviewStatus === 'false_positive' ? 'success' : 'secondary'}>{g.reviewStatus}</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6" />
          Coach Ops
        </h1>
        <p className="text-sm text-muted-foreground">Prompt registry, guardrails, token costs, and canary control</p>
      </div>

      <Tabs defaultValue="prompts">
        <TabsList>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="guardrails">Guardrails {guardrails && guardrails.length > 0 && `(${guardrails.length})`}</TabsTrigger>
          <TabsTrigger value="tokens">Token Costs</TabsTrigger>
          <TabsTrigger value="canary">Canary</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts">
          <DataTable columns={promptColumns} data={prompts || []} keyExtractor={(p) => p.id} loading={promptsLoading} />
        </TabsContent>

        <TabsContent value="guardrails">
          <DataTable columns={guardrailColumns} data={guardrails || []} keyExtractor={(g) => g.id} emptyMessage="No guardrail trips" />
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          {tokenCosts ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">This Month</p>
                    <p className="text-2xl font-bold">${tokenCosts.totalThisMonth.toFixed(2)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Daily Avg</p>
                    <p className="text-2xl font-bold">
                      ${tokenCosts.dailyCosts.length > 0 ? (tokenCosts.totalThisMonth / tokenCosts.dailyCosts.length).toFixed(2) : '0.00'}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground uppercase">Total Tokens</p>
                    <p className="text-2xl font-bold">{tokenCosts.dailyCosts.reduce((sum, d) => sum + d.tokens, 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader><CardTitle className="text-base">Daily Breakdown</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                    {tokenCosts.dailyCosts.map((d) => (
                      <div key={d.date} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span>{new Date(d.date).toLocaleDateString()}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{d.tokens.toLocaleString()} tokens</span>
                          <span className="font-medium">${d.cost.toFixed(3)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="canary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Canary Traffic Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Traffic to new prompt</span>
                  <span className="font-bold">{trafficPercent}%</span>
                </div>
                <Slider value={[trafficPercent]} onValueChange={([v]) => setTrafficPercent(v)} max={100} step={1} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => canaryMutation.mutate(trafficPercent)} loading={canaryMutation.isPending}>Update Canary</Button>
                <Button variant="outline" onClick={() => setTrafficPercent(0)}>0%</Button>
                <Button variant="outline" onClick={() => setTrafficPercent(50)}>50%</Button>
                <Button variant="outline" onClick={() => setTrafficPercent(100)}>100%</Button>
              </div>
              {canary && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p><strong>Active Prompt:</strong> {canary.promptId}</p>
                  <p><strong>Baseline:</strong> {canary.baselinePromptId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
