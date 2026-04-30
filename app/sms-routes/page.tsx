'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSmsRoutes, listParserTemplates, testParserTemplate, getFailedMessages, reprocessFailedMessage, getTemplateAccuracy } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Play, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import type { SmsBankRoute, SmsParserTemplate } from '@/types/admin';

export default function SmsRoutesPage() {
  const qc = useQueryClient();
  const [testMessage, setTestMessage] = React.useState('');
  const [selectedTemplate, setSelectedTemplate] = React.useState('');
  const [testResult, setTestResult] = React.useState<Record<string, unknown> | null>(null);

  const { data: routes, isLoading: routesLoading } = useQuery({ queryKey: ['smsRoutes'], queryFn: listSmsRoutes });
  const { data: templates } = useQuery({ queryKey: ['parserTemplates'], queryFn: listParserTemplates });
  const { data: failedMessages } = useQuery({ queryKey: ['failedMessages'], queryFn: getFailedMessages });
  const { data: accuracy } = useQuery({ queryKey: ['templateAccuracy'], queryFn: getTemplateAccuracy });

  const reprocessMutation = useMutation({
    mutationFn: reprocessFailedMessage,
    onSuccess: () => {
      toast({ title: 'Message reprocessed', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['failedMessages'] });
    },
  });

  const handleTest = async () => {
    if (!selectedTemplate || !testMessage) return;
    try {
      const result = await testParserTemplate(selectedTemplate, testMessage);
      setTestResult(result as unknown as Record<string, unknown>);
    } catch {
      toast({ title: 'Test failed', variant: 'destructive' });
    }
  };

  const routeColumns = [
    { key: 'bankName', header: 'Bank', render: (r: SmsBankRoute) => r.bankName },
    { key: 'senderPattern', header: 'Sender Pattern', render: (r: SmsBankRoute) => <code className="text-xs bg-muted px-1 rounded">{r.senderPattern}</code> },
    { key: 'country', header: 'Country', render: (r: SmsBankRoute) => r.country },
    { key: 'isActive', header: 'Active', render: (r: SmsBankRoute) => <Switch checked={r.isActive} /> },
    { key: 'accuracyScore', header: 'Accuracy', render: (r: SmsBankRoute) => (
      <Badge variant={r.accuracyScore > 0.9 ? 'success' : r.accuracyScore > 0.7 ? 'warning' : 'destructive'}>
        {(r.accuracyScore * 100).toFixed(0)}%
      </Badge>
    )},
    { key: 'totalMessages', header: 'Messages', render: (r: SmsBankRoute) => r.totalMessages.toLocaleString() },
  ];

  const failedColumns = [
    { key: 'message', header: 'Message', render: (f: { id: string; message: string; reason: string; createdAt: string }) => (
      <span className="truncate max-w-xs block text-sm">{f.message}</span>
    )},
    { key: 'reason', header: 'Reason', render: (f: { id: string; message: string; reason: string; createdAt: string }) => (
      <Badge variant="destructive" className="text-xs">{f.reason}</Badge>
    )},
    { key: 'actions', header: '', render: (f: { id: string; message: string; reason: string; createdAt: string }) => (
      <Button variant="ghost" size="sm" onClick={() => reprocessMutation.mutate(f.id)} loading={reprocessMutation.isPending}>
        <RotateCcw className="h-3 w-3 mr-1" />
        Reprocess
      </Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          SMS Routes Admin
        </h1>
        <p className="text-sm text-muted-foreground">Manage bank SMS parsing routes and templates</p>
      </div>

      <Tabs defaultValue="routes">
        <TabsList>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="test">Test Bench</TabsTrigger>
          <TabsTrigger value="failed">Replay Queue {failedMessages && failedMessages.length > 0 && `(${failedMessages.length})`}</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <DataTable columns={routeColumns} data={routes || []} keyExtractor={(r) => r.id} loading={routesLoading} />
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Template Test Bench</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Template</label>
                  <select
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">Choose a template...</option>
                    {templates?.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sample SMS</label>
                  <Input
                    placeholder="Paste an SMS message..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleTest} disabled={!selectedTemplate || !testMessage}>
                <Play className="mr-1 h-4 w-4" />
                Run Test
              </Button>

              {testResult && (
                <div className="rounded-lg bg-muted p-4">
                  <h4 className="text-sm font-medium mb-2">Result</h4>
                  <pre className="text-xs overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <DataTable columns={failedColumns} data={failedMessages || []} keyExtractor={(f) => f.id} emptyMessage="No failed messages" />
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {accuracy?.map((a) => (
              <Card key={a.templateId}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{a.name}</span>
                    <Badge variant={a.accuracy > 0.9 ? 'success' : a.accuracy > 0.7 ? 'warning' : 'destructive'}>
                      {(a.accuracy * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{a.total.toLocaleString()} messages processed</p>
                  <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.accuracy > 0.9 ? 'bg-felo-emerald-500' : a.accuracy > 0.7 ? 'bg-felo-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${a.accuracy * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
