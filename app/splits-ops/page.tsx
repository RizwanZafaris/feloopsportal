'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSplits, getSplit, forceSettleSplit, cancelSplit } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Split, Search, Users, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';
import type { Split as SplitType } from '@/types/admin';

export default function SplitsOpsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [selectedSplit, setSelectedSplit] = React.useState<SplitType | null>(null);
  const [showDetailDialog, setShowDetailDialog] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState('');

  const { data: splitsData, isLoading } = useQuery({
    queryKey: ['splits', search, statusFilter],
    queryFn: () => listSplits({ status: statusFilter || undefined, limit: 50 }),
  });

  const settleMutation = useMutation({
    mutationFn: ({ id, participantId }: { id: string; participantId: string }) => forceSettleSplit(id, participantId, 'Admin force settle'),
    onSuccess: () => {
      toast({ title: 'Participant settled', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['splits'] });
      if (selectedSplit) {
        qc.invalidateQueries({ queryKey: ['split', selectedSplit.id] });
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => cancelSplit(id, reason),
    onSuccess: () => {
      toast({ title: 'Split cancelled', variant: 'success' });
      setShowCancelDialog(false);
      qc.invalidateQueries({ queryKey: ['splits'] });
    },
  });

  const { data: splitDetail } = useQuery({
    queryKey: ['split', selectedSplit?.id],
    queryFn: () => selectedSplit ? getSplit(selectedSplit.id) : null,
    enabled: !!selectedSplit,
  });

  const columns = [
    {
      key: 'title',
      header: 'Split',
      render: (s: SplitType) => (
        <div>
          <span className="font-medium text-sm">{s.title}</span>
          {s.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{s.description}</p>}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (s: SplitType) => <span className="font-medium text-sm">{formatCurrency(s.totalAmountMinor, s.currency)}</span>,
    },
    {
      key: 'participants',
      header: 'Participants',
      render: (s: SplitType) => (
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{s.participants.length}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: SplitType) => (
        <Badge
          variant={
            s.status === 'settled'
              ? 'success'
              : s.status === 'partially_settled'
              ? 'warning'
              : s.status === 'open'
              ? 'default'
              : 'secondary'
          }
        >
          {s.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (s: SplitType) => <span className="text-sm text-muted-foreground">{formatDate(s.createdAt, { relative: true })}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (s: SplitType) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedSplit(s); setShowDetailDialog(true); }}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {s.status !== 'cancelled' && s.status !== 'settled' && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectedSplit(s); setShowCancelDialog(true); }}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filteredSplits =
    splitsData?.items.filter((s) =>
      search ? s.title.toLowerCase().includes(search.toLowerCase()) || s.creatorUserId.includes(search) : true
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Split className="h-6 w-6" />
            Splits Admin
          </h1>
          <p className="text-sm text-muted-foreground">Manage group payments, bill splits, and settlements</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search splits or creator ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="partially_settled">Partially Settled</option>
          <option value="settled">Settled</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredSplits} keyExtractor={(s) => s.id} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Split Details</DialogTitle>
            <DialogDescription>{selectedSplit?.title}</DialogDescription>
          </DialogHeader>
          {splitDetail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(splitDetail.totalAmountMinor, splitDetail.currency)}</p>
                </div>
                <Badge variant={splitDetail.status === 'settled' ? 'success' : splitDetail.status === 'open' ? 'default' : 'warning'}>
                  {splitDetail.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Participants</p>
                <div className="space-y-2">
                  {splitDetail.participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{p.displayName}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(p.shareAmountMinor, splitDetail.currency)} share</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={p.status === 'paid' ? 'success' : p.status === 'overdue' ? 'destructive' : 'warning'}>
                          {p.status}
                        </Badge>
                        <p className="text-sm font-medium">
                          {formatCurrency(p.paidAmountMinor, splitDetail.currency)} / {formatCurrency(p.shareAmountMinor, splitDetail.currency)}
                        </p>
                        {p.status !== 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => settleMutation.mutate({ id: splitDetail.id, participantId: p.id })}
                            loading={settleMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Force Settle
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Cancel Split
            </DialogTitle>
            <DialogDescription>{selectedSplit?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Reason (required)</label>
              <Input value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Why are you cancelling this split?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedSplit && cancelMutation.mutate({ id: selectedSplit.id, reason: cancelReason })}
              disabled={!cancelReason}
              loading={cancelMutation.isPending}
            >
              Cancel Split
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
