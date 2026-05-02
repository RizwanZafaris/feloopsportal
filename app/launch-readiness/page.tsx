'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { toast } from '@/hooks/use-toast';
import {
  getLaunchReadinessSummary,
  listLaunchReadinessItems,
  updateLaunchReadinessStatus,
} from '@/lib/api';
import type {
  LaunchReadinessItem,
  LaunchReadinessStatus,
} from '@/types/admin';

const STATUS_LABEL: Record<LaunchReadinessStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked',
};

const STATUS_COLOUR: Record<LaunchReadinessStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200',
  in_progress: 'bg-blue-100 text-blue-900 border-blue-200',
  done: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  blocked: 'bg-rose-100 text-rose-900 border-rose-200',
};

export default function LaunchReadinessPage() {
  const qc = useQueryClient();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [target, setTarget] = useState<LaunchReadinessItem | null>(null);
  const [pendingStatus, setPendingStatus] =
    useState<LaunchReadinessStatus | null>(null);
  const [notes, setNotes] = useState('');

  const itemsQ = useQuery({
    queryKey: ['launch-readiness', filterCategory],
    queryFn: () =>
      listLaunchReadinessItems(
        filterCategory ? { category: filterCategory } : {},
      ),
  });

  const summaryQ = useQuery({
    queryKey: ['launch-readiness-summary'],
    queryFn: getLaunchReadinessSummary,
    refetchInterval: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: number;
      status: LaunchReadinessStatus;
      notes: string;
    }) => updateLaunchReadinessStatus(id, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['launch-readiness'] });
      qc.invalidateQueries({ queryKey: ['launch-readiness-summary'] });
      toast({ title: 'Updated', description: 'Status saved + audit-logged.' });
      setTarget(null);
      setPendingStatus(null);
      setNotes('');
    },
    onError: (err: Error) =>
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' }),
  });

  const categories = useMemo(() => {
    const uniq = new Set<string>();
    (itemsQ.data ?? []).forEach((i) => uniq.add(i.category));
    return Array.from(uniq).sort();
  }, [itemsQ.data]);

  const grouped = useMemo(() => {
    const map = new Map<string, LaunchReadinessItem[]>();
    for (const item of itemsQ.data ?? []) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [itemsQ.data]);

  const blockingPending = summaryQ.data?.blockingPending ?? 0;
  const readyToLaunch = summaryQ.data?.readyToLaunch ?? false;
  const total = itemsQ.data?.length ?? 0;
  const done = (itemsQ.data ?? []).filter((i) => i.status === 'done').length;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Launch readiness</h1>
          <p className="text-sm text-muted-foreground">
            One row per credential / config / vendor account. Soft-launch goes
            live when every <strong>blocking</strong> row is{' '}
            <span className="font-medium text-emerald-700">done</span>.
          </p>
        </div>
        <Badge
          className={
            readyToLaunch
              ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
              : 'bg-amber-100 text-amber-900 border-amber-200'
          }
        >
          {readyToLaunch ? 'Ready to launch' : `${blockingPending} blocking`}
        </Badge>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total items"
          value={String(total)}
          subtitle={total ? `${done} done` : 'loading...'}
        />
        <StatCard
          title="Blocking remaining"
          value={String(blockingPending)}
          subtitle={
            blockingPending === 0
              ? 'All blockers cleared'
              : 'Soft-launch is held until 0'
          }
        />
        <StatCard
          title="FELO_LAUNCH_READY"
          value={readyToLaunch ? '1' : '0'}
          subtitle={
            readyToLaunch
              ? 'Backend will boot in production'
              : 'Backend refuses to boot until clear'
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filterCategory === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterCategory(null)}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={filterCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      {itemsQ.isLoading ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </CardContent>
        </Card>
      ) : itemsQ.isError ? (
        <Card>
          <CardContent className="p-4 text-sm text-rose-700">
            Failed to load — {(itemsQ.error as Error).message}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-start justify-between gap-2 py-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{item.title}</span>
                        {item.blocking ? (
                          <Badge className="bg-rose-50 text-rose-800 border-rose-100">
                            Blocking
                          </Badge>
                        ) : null}
                        {item.rotationPeriodDays ? (
                          <Badge className="bg-slate-50 text-slate-700 border-slate-100">
                            Rotates {item.rotationPeriodDays}d
                          </Badge>
                        ) : null}
                      </div>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Owner: {item.owner ?? 'unassigned'} · Key: <code>{item.key}</code>
                        {item.notes ? ` · ${item.notes}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLOUR[item.status]}>
                        {STATUS_LABEL[item.status]}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setTarget(item);
                          setPendingStatus(item.status);
                          setNotes(item.notes ?? '');
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setPendingStatus(null);
            setNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update {target?.title}</DialogTitle>
            <DialogDescription>
              Changes are audit-logged with the actor + timestamp. Bumping
              status to <strong>done</strong> on a blocking row reduces the
              blocking count toward zero.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              {(['pending', 'in_progress', 'done', 'blocked'] as const).map(
                (s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={pendingStatus === s ? 'default' : 'outline'}
                    onClick={() => setPendingStatus(s)}
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                ),
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Notes (optional)
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Rotated key on 2026-05-03"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (target && pendingStatus) {
                  mutation.mutate({ id: target.id, status: pendingStatus, notes });
                }
              }}
              disabled={mutation.isPending || !pendingStatus}
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
