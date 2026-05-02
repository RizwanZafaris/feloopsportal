'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listBudgets, listEnvelopes, updateBudgetStatus, overrideBudgetLimit } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Wallet, Search, TrendingUp, Edit3, PiggyBank } from 'lucide-react';
import type { Budget, CashEnvelope } from '@/types/admin';

export default function BudgetsOpsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);
  const [showLimitDialog, setShowLimitDialog] = React.useState(false);
  const [newLimit, setNewLimit] = React.useState('');

  const { data: budgetsData, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets', search, statusFilter],
    queryFn: () => listBudgets({ status: statusFilter || undefined, limit: 50 }),
  });

  const { data: envelopesData, isLoading: envelopesLoading } = useQuery({
    queryKey: ['envelopes', search],
    queryFn: () => listEnvelopes({ limit: 50 }),
  });

  const limitMutation = useMutation({
    mutationFn: ({ id, limit }: { id: string; limit: number }) => overrideBudgetLimit(id, limit, 'Admin override'),
    onSuccess: () => {
      toast({ title: 'Budget limit updated', variant: 'success' });
      setShowLimitDialog(false);
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateBudgetStatus(id, status),
    onSuccess: () => {
      toast({ title: 'Budget status updated', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['budgets'] });
    },
  });

  const budgetColumns = [
    {
      key: 'userId',
      header: 'User',
      render: (b: Budget) => <span className="font-mono text-xs">{b.userId.slice(0, 8)}</span>,
    },
    {
      key: 'name',
      header: 'Budget',
      render: (b: Budget) => (
        <div>
          <span className="font-medium text-sm">{b.name}</span>
          <p className="text-xs text-muted-foreground">{b.category}</p>
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (b: Budget) => {
        const pct = b.limitAmountMinor > 0 ? Math.round((b.spentAmountMinor / b.limitAmountMinor) * 100) : 0;
        const isOver = pct >= 100;
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{formatCurrency(b.spentAmountMinor, b.currency)}</span>
              <span className={isOver ? 'text-destructive font-medium' : 'text-muted-foreground'}>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${isOver ? 'bg-red-500' : pct >= 80 ? 'bg-felo-amber-500' : 'bg-felo-sage-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">of {formatCurrency(b.limitAmountMinor, b.currency)} / {b.period}</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (b: Budget) => (
        <Badge variant={b.status === 'active' ? 'default' : b.status === 'paused' ? 'warning' : 'secondary'}>
          {b.status}
        </Badge>
      ),
    },
    {
      key: 'alert',
      header: 'Alert',
      render: (b: Budget) => {
        const pct = b.limitAmountMinor > 0 ? (b.spentAmountMinor / b.limitAmountMinor) * 100 : 0;
        if (pct >= b.alertThreshold) return <Badge variant="destructive" className="text-[10px]">Triggered</Badge>;
        return <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      key: 'actions',
      header: '',
      render: (b: Budget) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedBudget(b); setNewLimit(String(b.limitAmountMinor / 100)); setShowLimitDialog(true); }}>
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => statusMutation.mutate({ id: b.id, status: b.status === 'active' ? 'paused' : 'active' })}
          >
            {b.status === 'active' ? 'Pause' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const envelopeColumns = [
    {
      key: 'userId',
      header: 'User',
      render: (e: CashEnvelope) => <span className="font-mono text-xs">{e.userId.slice(0, 8)}</span>,
    },
    {
      key: 'name',
      header: 'Envelope',
      render: (e: CashEnvelope) => (
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: e.color }} />
          <span className="font-medium text-sm">{e.name}</span>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (e: CashEnvelope) => {
        const pct = e.allocatedAmountMinor > 0 ? Math.round((e.spentAmountMinor / e.allocatedAmountMinor) * 100) : 0;
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{formatCurrency(e.remainingAmountMinor, e.currency)}</span>
              <span className="text-muted-foreground">{pct}% spent</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-felo-sage-500"
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(e.allocatedAmountMinor, e.currency)} allocated</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (e: CashEnvelope) => (
        <Badge variant={e.isArchived ? 'secondary' : 'default'}>
          {e.isArchived ? 'Archived' : 'Active'}
        </Badge>
      ),
    },
  ];

  const filteredBudgets = budgetsData?.items.filter((b) =>
    search ? b.name.toLowerCase().includes(search.toLowerCase()) || b.userId.includes(search) : true
  ) || [];

  const filteredEnvelopes = envelopesData?.items.filter((e) =>
    search ? e.name.toLowerCase().includes(search.toLowerCase()) || e.userId.includes(search) : true
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Budgets & Envelopes
          </h1>
          <p className="text-sm text-muted-foreground">Manage user budgets, spending limits, and cash envelopes</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search budgets, envelopes, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="budgets">
        <TabsList>
          <TabsTrigger value="budgets">Budgets {budgetsData && `(${budgetsData.total})`}</TabsTrigger>
          <TabsTrigger value="envelopes">Envelopes {envelopesData && `(${envelopesData.total})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DataTable columns={budgetColumns} data={filteredBudgets} keyExtractor={(b) => b.id} loading={budgetsLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="envelopes" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DataTable columns={envelopeColumns} data={filteredEnvelopes} keyExtractor={(e) => e.id} loading={envelopesLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Limit Override Dialog */}
      <Dialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Override Budget Limit</DialogTitle>
            <DialogDescription>{selectedBudget?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">New Limit</label>
              <Input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="e.g. 100000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current: {selectedBudget ? formatCurrency(selectedBudget.limitAmountMinor, selectedBudget.currency) : '—'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimitDialog(false)}>Cancel</Button>
            <Button
              onClick={() => selectedBudget && newLimit && limitMutation.mutate({ id: selectedBudget.id, limit: Math.round(parseFloat(newLimit) * 100) })}
              loading={limitMutation.isPending}
            >
              Override Limit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
