'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listFeatureFlags, createFeatureFlag, updateFeatureFlag, killFeatureFlag } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { generateConfirmId } from '@/lib/utils';
import { ToggleLeft, Power, AlertTriangle } from 'lucide-react';
import type { FeatureFlag } from '@/types/admin';

export default function FeatureFlagsPage() {
  const qc = useQueryClient();
  const { data: flags, isLoading } = useQuery({ queryKey: ['featureFlags'], queryFn: listFeatureFlags });
  const [showKill, setShowKill] = React.useState(false);
  const [killTarget, setKillTarget] = React.useState<FeatureFlag | null>(null);
  const [confirmId] = React.useState(() => generateConfirmId());
  const [confirmInput, setConfirmInput] = React.useState('');
  const [showNew, setShowNew] = React.useState(false);
  const [newFlag, setNewFlag] = React.useState({ key: '', description: '' });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateFeatureFlag(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['featureFlags'] }),
  });

  const killMutation = useMutation({
    mutationFn: (id: string) => killFeatureFlag(id),
    onSuccess: () => {
      toast({ title: 'Feature flag killed', variant: 'success' });
      setShowKill(false);
      qc.invalidateQueries({ queryKey: ['featureFlags'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: () => createFeatureFlag({ key: newFlag.key, description: newFlag.description, enabled: false, targeting: { percentRollout: 0, corridors: null, tiers: null, userIds: null } }),
    onSuccess: () => {
      toast({ title: 'Flag created', variant: 'success' });
      setShowNew(false);
      setNewFlag({ key: '', description: '' });
      qc.invalidateQueries({ queryKey: ['featureFlags'] });
    },
  });

  const columns = [
    { key: 'key', header: 'Key', render: (f: FeatureFlag) => <code className="text-xs bg-muted px-1 rounded font-bold">{f.key}</code> },
    { key: 'description', header: 'Description', render: (f: FeatureFlag) => <span className="text-sm">{f.description}</span> },
    { key: 'enabled', header: 'Enabled', render: (f: FeatureFlag) => (
      <Switch checked={f.enabled} onCheckedChange={(v) => toggleMutation.mutate({ id: f.id, enabled: v })} />
    )},
    { key: 'targeting', header: 'Rollout', render: (f: FeatureFlag) => (
      <Badge variant="outline">{f.targeting.percentRollout}%</Badge>
    )},
    { key: 'killSwitch', header: 'Kill Switch', render: (f: FeatureFlag) => f.killSwitchAvailable ? (
      <Button variant="destructive" size="sm" onClick={() => { setKillTarget(f); setShowKill(true); }}>
        <Power className="h-3 w-3 mr-1" />
        Kill
      </Button>
    ) : <Badge variant="secondary">N/A</Badge> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ToggleLeft className="h-6 w-6" />
            Feature Flags
          </h1>
          <p className="text-sm text-muted-foreground">Manage feature toggles, targeting, and kill switches</p>
        </div>
        <Button onClick={() => setShowNew(true)}>New Flag</Button>
      </div>

      <DataTable columns={columns} data={flags || []} keyExtractor={(f) => f.id} loading={isLoading} />

      {/* Kill Dialog */}
      <Dialog open={showKill} onOpenChange={setShowKill}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Kill Feature Flag
            </DialogTitle>
            <DialogDescription>
              This will immediately disable <code className="font-mono font-bold">{killTarget?.key}</code> for all users. No caching — instant effect.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Type <code className="font-mono font-bold bg-muted px-1">{confirmId}</code> to confirm:</p>
            <Input value={confirmInput} onChange={(e) => setConfirmInput(e.target.value)} placeholder={confirmId} className="font-mono" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKill(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={confirmInput !== confirmId}
              onClick={() => killTarget && killMutation.mutate(killTarget.id)}
              loading={killMutation.isPending}
            >
              Kill Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Flag Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Feature Flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Key</label>
              <Input placeholder="e.g. new_onboarding_flow" value={newFlag.key} onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input placeholder="What does this flag control?" value={newFlag.description} onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!newFlag.key}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
