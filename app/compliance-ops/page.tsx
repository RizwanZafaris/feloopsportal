'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDsrRequests, resolveDsr } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Shield, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ComplianceOpsPage() {
  const qc = useQueryClient();
  const { data: dsrRequests } = useQuery({ queryKey: ['dsrRequests'], queryFn: () => getDsrRequests() });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) => resolveDsr(id, resolution),
    onSuccess: () => {
      toast({ title: 'DSR resolved', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['dsrRequests'] });
    },
  });

  const dsrColumns = [
    { key: 'userId', header: 'User', render: (r: { userId: string; type: string; status: string; slaDeadline: string; createdAt: string }) => <span className="font-mono text-xs">{r.userId.slice(0, 8)}</span> },
    { key: 'type', header: 'Type', render: (r: { userId: string; type: string; status: string; slaDeadline: string; createdAt: string }) => <Badge variant="outline">{r.type}</Badge> },
    { key: 'status', header: 'Status', render: (r: { userId: string; type: string; status: string; slaDeadline: string; createdAt: string }) => (
      <Badge variant={r.status === 'completed' ? 'success' : r.status === 'overdue' ? 'destructive' : 'warning'}>{r.status}</Badge>
    )},
    { key: 'slaDeadline', header: 'SLA Deadline', render: (r: { userId: string; type: string; status: string; slaDeadline: string; createdAt: string }) => (
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 text-muted-foreground" />
        <span className={new Date(r.slaDeadline) < new Date() ? 'text-destructive font-medium' : ''}>{formatDate(r.slaDeadline)}</span>
      </div>
    )},
    { key: 'createdAt', header: 'Requested', render: (r: { userId: string; type: string; status: string; slaDeadline: string; createdAt: string }) => formatDate(r.createdAt, { relative: true }) },
    { key: 'actions', header: '', render: (r: { id: string; userId: string; type: string; status: string; slaDeadline: string; createdAt: string }) => (
      <Button variant="ghost" size="sm" onClick={() => resolveMutation.mutate({ id: r.id, resolution: 'Resolved by admin' })}>Resolve</Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Compliance
        </h1>
        <p className="text-sm text-muted-foreground">DSR queue, PII access logs, and retention management</p>
      </div>

      <div className="flex gap-2">
        <Link href="/compliance-ops/pii-access"><Button variant="outline">PII Access Log</Button></Link>
        <Link href="/compliance-ops/retention"><Button variant="outline">Retention Dashboard</Button></Link>
      </div>

      <Tabs defaultValue="dsr">
        <TabsList>
          <TabsTrigger value="dsr">DSR Queue {dsrRequests && dsrRequests.length > 0 && `(${dsrRequests.length})`}</TabsTrigger>
        </TabsList>
        <TabsContent value="dsr">
          <DataTable columns={dsrColumns} data={dsrRequests || []} keyExtractor={(r) => r.id} emptyMessage="No DSR requests" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
