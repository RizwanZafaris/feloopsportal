'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listGoals, updateGoalStatus, overrideGoalTarget } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Target, Search, TrendingUp, Pause, CheckCircle, XCircle, Edit3 } from 'lucide-react';
import type { Goal } from '@/types/admin';

export default function GoalsOpsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [selectedGoal, setSelectedGoal] = React.useState<Goal | null>(null);
  const [showStatusDialog, setShowStatusDialog] = React.useState(false);
  const [showTargetDialog, setShowTargetDialog] = React.useState(false);
  const [newTarget, setNewTarget] = React.useState('');
  const [statusReason, setStatusReason] = React.useState('');
  const [newStatus, setNewStatus] = React.useState('');

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ['goals', search, statusFilter],
    queryFn: () => listGoals({ status: statusFilter || undefined, limit: 50 }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason: string }) => updateGoalStatus(id, status, reason),
    onSuccess: () => {
      toast({ title: 'Goal status updated', variant: 'success' });
      setShowStatusDialog(false);
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const targetMutation = useMutation({
    mutationFn: ({ id, target }: { id: string; target: number }) => overrideGoalTarget(id, target, 'Admin override'),
    onSuccess: () => {
      toast({ title: 'Goal target updated', variant: 'success' });
      setShowTargetDialog(false);
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const progressPercent = (g: Goal) =>
    g.targetAmountMinor > 0 ? Math.round((g.currentAmountMinor / g.targetAmountMinor) * 100) : 0;

  const columns = [
    {
      key: 'userId',
      header: 'User',
      render: (g: Goal) => <span className="font-mono text-xs">{g.userId.slice(0, 8)}</span>,
    },
    {
      key: 'title',
      header: 'Goal',
      render: (g: Goal) => (
        <div>
          <span className="font-medium text-sm">{g.title}</span>
          {g.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{g.description}</p>}
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (g: Goal) => {
        const pct = progressPercent(g);
        return (
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span>{formatCurrency(g.currentAmountMinor, g.currency)}</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${pct >= 100 ? 'bg-felo-emerald-500' : pct >= 75 ? 'bg-felo-amber-500' : 'bg-felo-sage-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">of {formatCurrency(g.targetAmountMinor, g.currency)}</p>
          </div>
        );
      },
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (g: Goal) =>
        g.deadline ? (
          <span className={new Date(g.deadline) < new Date() && g.status === 'active' ? 'text-destructive text-sm' : 'text-sm'}>
            {formatDate(g.deadline)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (g: Goal) => (
        <Badge
          variant={
            g.status === 'completed'
              ? 'success'
              : g.status === 'active'
              ? 'default'
              : g.status === 'paused'
              ? 'warning'
              : 'secondary'
          }
        >
          {g.status}
        </Badge>
      ),
    },
    {
      key: 'autoContribute',
      header: 'Auto',
      render: (g: Goal) =>
        g.autoContribute ? (
          <Badge variant="outline" className="text-[10px]">
            {g.autoContributeFrequency}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      render: (g: Goal) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedGoal(g); setNewStatus(g.status); setStatusReason(''); setShowStatusDialog(true); }}
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelectedGoal(g); setNewTarget(String(g.targetAmountMinor / 100)); setShowTargetDialog(true); }}
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredGoals =
    goalsData?.items.filter((g) =>
      search ? g.title.toLowerCase().includes(search.toLowerCase()) || g.userId.includes(search) : true
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Target className="h-6 w-6" />
            Goals Admin
          </h1>
          <p className="text-sm text-muted-foreground">Manage user savings goals, progress, and targets</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search goals or user ID..."
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
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={filteredGoals} keyExtractor={(g) => g.id} loading={isLoading} />
        </CardContent>
      </Card>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Goal Status</DialogTitle>
            <DialogDescription>{selectedGoal?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">New Status</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (required)</label>
              <Input value={statusReason} onChange={(e) => setStatusReason(e.target.value)} placeholder="Why are you changing this?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>Cancel</Button>
            <Button
              onClick={() => selectedGoal && statusMutation.mutate({ id: selectedGoal.id, status: newStatus, reason: statusReason })}
              disabled={!statusReason || !newStatus}
              loading={statusMutation.isPending}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Target Dialog */}
      <Dialog open={showTargetDialog} onOpenChange={setShowTargetDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Override Goal Target</DialogTitle>
            <DialogDescription>{selectedGoal?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">New Target Amount</label>
              <Input
                type="number"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="e.g. 50000"
              />
              <p className="text-xs text-muted-foreground mt-1">Current: {selectedGoal ? formatCurrency(selectedGoal.targetAmountMinor, selectedGoal.currency) : '—'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTargetDialog(false)}>Cancel</Button>
            <Button
              onClick={() => selectedGoal && newTarget && targetMutation.mutate({ id: selectedGoal.id, target: Math.round(parseFloat(newTarget) * 100) })}
              loading={targetMutation.isPending}
            >
              Override Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
