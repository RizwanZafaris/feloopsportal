'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScoreFormula, listFormulaVersions, listScoreOverrides, getScoreDistribution, createFormulaVersion } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Award, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { FeloScoreOverride } from '@/types/admin';

const DEFAULT_WEIGHTS = { savingsRate: 25, diversification: 20, expenseControl: 20, consistency: 20, goalAchievement: 15 };

export default function FeloScorePage() {
  const qc = useQueryClient();
  const [weights, setWeights] = React.useState(DEFAULT_WEIGHTS);
  const { data: formula } = useQuery({ queryKey: ['scoreFormula'], queryFn: getScoreFormula });
  const { data: versions } = useQuery({ queryKey: ['formulaVersions'], queryFn: listFormulaVersions });
  const { data: overrides } = useQuery({ queryKey: ['scoreOverrides'], queryFn: listScoreOverrides });
  const { data: distribution } = useQuery({ queryKey: ['scoreDistribution'], queryFn: getScoreDistribution });

  React.useEffect(() => {
    if (formula) setWeights(formula.weights);
  }, [formula]);

  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const createMutation = useMutation({
    mutationFn: () => createFormulaVersion(weights),
    onSuccess: () => {
      toast({ title: 'Formula version created', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['formulaVersions'] });
    },
  });

  const overrideColumns = [
    { key: 'userId', header: 'User', render: (o: FeloScoreOverride) => <span className="font-mono text-xs">{o.userId.slice(0, 8)}</span> },
    { key: 'originalScore', header: 'Original', render: (o: FeloScoreOverride) => o.originalScore },
    { key: 'overrideScore', header: 'Override', render: (o: FeloScoreOverride) => <Badge variant="warning">{o.overrideScore}</Badge> },
    { key: 'reason', header: 'Reason', render: (o: FeloScoreOverride) => <span className="text-sm">{o.reason}</span> },
    { key: 'overriddenBy', header: 'By', render: (o: FeloScoreOverride) => o.overriddenBy },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Award className="h-6 w-6" />
          Felo Score Admin
        </h1>
        <p className="text-sm text-muted-foreground">Configure scoring formula, view distribution, manage overrides</p>
      </div>

      <Tabs defaultValue="weights">
        <TabsList>
          <TabsTrigger value="weights">Weight Editor</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="weights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score Weights (Total: {total}%)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(weights).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-bold">{value}%</span>
                  </div>
                  <Slider value={[value]} onValueChange={([v]) => setWeights((w) => ({ ...w, [key]: v }))} max={100} step={1} />
                </div>
              ))}
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-felo-sage-500 transition-all" style={{ width: `${Math.min(total, 100)}%` }} />
              </div>
              {total !== 100 && (
                <p className={`text-sm ${total === 100 ? 'text-felo-emerald-600' : 'text-felo-amber-600'}`}>
                  Weights must sum to 100% (currently {total}%)
                </p>
              )}
              <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={total !== 100}>
                <Save className="mr-1 h-4 w-4" />
                Create Version
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions">
          <div className="space-y-2">
            {versions?.map((v) => (
              <Card key={v.id} className={v.isActive ? 'border-felo-sage-300' : ''}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Version {v.version}</span>
                      {v.isActive && <Badge variant="success">Active</Badge>}
                    </div>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {Object.entries(v.weights).map(([k, val]) => (
                        <span key={k}>{k}: {val}%</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {v.createdBy} — {new Date(v.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overrides">
          <DataTable columns={overrideColumns} data={overrides || []} keyExtractor={(o) => o.id} emptyMessage="No overrides" />
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader><CardTitle>Score Distribution</CardTitle></CardHeader>
            <CardContent>
              {distribution ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distribution}>
                    <XAxis dataKey="score" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4d7a4d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-[300px]" />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
