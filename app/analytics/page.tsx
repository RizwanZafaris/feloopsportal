'use client';

import { useQuery } from '@tanstack/react-query';
import { getCohortRetention, getFunnelAnalytics, getMrrWaterfall, getLtvEstimation, exportAnalytics } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { BarChart3, Download, TrendingUp, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

const CHART_COLORS = ['#4d7a4d', '#6f966f', '#9bb89b', '#c5d8c5', '#e3ebe3', '#d5ccbe', '#bfb09d', '#a89782'];

export default function AnalyticsPage() {
  const { data: cohorts, isLoading: cohortsLoading } = useQuery({ queryKey: ['cohorts'], queryFn: getCohortRetention });
  const { data: funnel } = useQuery({ queryKey: ['funnelAnalytics'], queryFn: getFunnelAnalytics });
  const { data: mrrWaterfall } = useQuery({ queryKey: ['mrrWaterfall'], queryFn: getMrrWaterfall });
  const { data: ltv } = useQuery({ queryKey: ['ltv'], queryFn: getLtvEstimation });

  const handleExport = async (reportType: string) => {
    try {
      await exportAnalytics('csv', reportType);
      toast({ title: 'Export started', variant: 'success' });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground">Cohorts, funnels, MRR waterfall, and LTV estimation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('cohorts')}><Download className="mr-1 h-4 w-4" />Export Cohorts</Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('mrr')}><Download className="mr-1 h-4 w-4" />Export MRR</Button>
        </div>
      </div>

      <Tabs defaultValue="cohorts">
        <TabsList>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="mrr">MRR Waterfall</TabsTrigger>
          <TabsTrigger value="ltv">LTV</TabsTrigger>
        </TabsList>

        <TabsContent value="cohorts" className="space-y-4">
          {cohortsLoading ? (
            <Skeleton className="h-[400px]" />
          ) : cohorts && cohorts.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Cohort Retention Heatmap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Cohort</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Size</th>
                        {cohorts[0]?.periods.map((p) => (
                          <th key={p.period} className="px-3 py-2 text-center font-medium text-muted-foreground">W{p.period}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cohorts.map((c) => (
                        <tr key={c.cohortDate} className="border-b">
                          <td className="px-3 py-2 font-mono text-xs">{new Date(c.cohortDate).toLocaleDateString()}</td>
                          <td className="px-3 py-2 font-medium">{c.cohortSize}</td>
                          {c.periods.map((p) => (
                            <td key={p.period} className="px-3 py-2 text-center">
                              <div
                                className="mx-auto rounded px-2 py-1 text-xs font-medium"
                                style={{
                                  backgroundColor: p.rate > 0.5 ? '#c5d8c5' : p.rate > 0.25 ? '#e8e2d9' : '#f3f0eb',
                                  color: p.rate > 0.5 ? '#2f4d2f' : '#6b5d50',
                                }}
                              >
                                {(p.rate * 100).toFixed(0)}%
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No cohort data</CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="funnel">
          <Card>
            <CardHeader><CardTitle className="text-base">Conversion Funnel</CardTitle></CardHeader>
            <CardContent>
              {funnel ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnel} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4d7a4d" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-[300px]" />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mrr">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" /> MRR Waterfall</CardTitle>
            </CardHeader>
            <CardContent>
              {mrrWaterfall ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mrrWaterfall}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                    <Bar dataKey="newMrr" stackId="a" fill="#4d7a4d" />
                    <Bar dataKey="expansionMrr" stackId="a" fill="#9bb89b" />
                    <Bar dataKey="contractionMrr" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="churnMrr" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-[300px]" />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ltv">
          <div className="grid gap-4 lg:grid-cols-3">
            {ltv?.map((item) => (
              <Card key={item.corridor}>
                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2">{item.corridor}</Badge>
                  <p className="text-2xl font-bold">${item.avgLtv.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Avg LTV ({item.cohortSize} users)</p>
                </CardContent>
              </Card>
            ))}
            {(!ltv || ltv.length === 0) && (
              <Card className="lg:col-span-3"><CardContent className="py-12 text-center text-muted-foreground">No LTV data</CardContent></Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
