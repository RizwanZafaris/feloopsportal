'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { listIncidents, createIncident } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, ShieldAlert, ShieldAlertIcon, Search, Plus, Clock, Filter } from 'lucide-react';
import type { Incident } from '@/types/admin';

const SEVERITY_COLORS: Record<string, 'destructive' | 'warning' | 'default' | 'muted'> = {
  critical: 'destructive',
  high: 'warning',
  medium: 'default',
  low: 'muted',
};

const STATUS_COLORS: Record<string, 'destructive' | 'warning' | 'success' | 'info' | 'secondary'> = {
  open: 'destructive',
  investigating: 'warning',
  mitigated: 'info',
  resolved: 'success',
  closed: 'secondary',
};

export default function IncidentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [severityFilter, setSeverityFilter] = React.useState('ALL');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', statusFilter, severityFilter],
    queryFn: () => listIncidents(
      statusFilter === 'ALL' ? undefined : statusFilter,
      severityFilter === 'ALL' ? undefined : severityFilter
    ),
  });

  const createMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      toast({ title: 'Incident created', variant: 'success' });
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    createMutation.mutate({
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      severity: formData.get('severity') as 'critical' | 'high' | 'medium' | 'low',
      affectedServices: (formData.get('services') as string).split(',').map((s) => s.trim()).filter(Boolean),
    });
  };

  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'w-20 font-mono text-xs',
      render: (row: Incident) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    { key: 'title', header: 'Title', render: (row: Incident) => <span className="font-medium">{row.title}</span> },
    {
      key: 'severity',
      header: 'Severity',
      render: (row: Incident) => (
        <Badge variant={SEVERITY_COLORS[row.severity]} className="capitalize">{row.severity}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Incident) => (
        <Badge variant={STATUS_COLORS[row.status]} className="capitalize">{row.status}</Badge>
      ),
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (row: Incident) => row.assignee || <span className="text-muted-foreground italic">Unassigned</span>,
    },
    {
      key: 'affectedServices',
      header: 'Services',
      render: (row: Incident) => (
        <div className="flex flex-wrap gap-1">
          {row.affectedServices.map((svc) => (
            <Badge key={svc} variant="outline" className="text-[10px]">{svc}</Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: Incident) => formatDate(row.createdAt, { relative: true }),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (row: Incident) => (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/incidents/${row.id}`)}>
          View
        </Button>
      ),
    },
  ];

  const filteredItems = React.useMemo(() => {
    if (!incidents) return [];
    if (!search) return incidents;
    const q = search.toLowerCase();
    return incidents.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.assignee?.toLowerCase().includes(q)
    );
  }, [incidents, search]);

  const activeCount = incidents?.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length ?? 0;
  const criticalCount = incidents?.filter((i) => i.severity === 'critical').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Incidents
        </h1>
        <p className="text-sm text-muted-foreground">Monitor and manage platform incidents</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Incidents</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <div className="rounded-lg bg-felo-amber-100 p-2">
                <ShieldAlert className="h-5 w-5 text-felo-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <ShieldAlertIcon className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{incidents?.filter((i) => i.status === 'open').length ?? 0}</p>
              </div>
              <div className="rounded-lg bg-felo-sage-100 p-2">
                <Clock className="h-5 w-5 text-felo-sage-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{incidents?.length ?? 0}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Create */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="mitigated">Mitigated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-1 h-4 w-4" />
              New Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Incident</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required placeholder="Incident title..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Describe the incident..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select name="severity" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="services">Affected Services</Label>
                  <Input id="services" name="services" placeholder="api, db, sms..." />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" loading={createMutation.isPending}>Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyMessage="No incidents found"
        onRowClick={(row) => router.push(`/incidents/${row.id}`)}
      />
    </div>
  );
}
