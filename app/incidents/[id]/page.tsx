'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getIncident, updateIncident, addIncidentTimelineEvent } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { AlertTriangle, Clock, User, Server, ChevronLeft, Send, Activity } from 'lucide-react';
import Link from 'next/link';
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

export default function IncidentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [newEvent, setNewEvent] = React.useState('');
  const [assignee, setAssignee] = React.useState('');

  const { data: incident, isLoading } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncident(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Incident>) => updateIncident(id, data),
    onSuccess: () => {
      toast({ title: 'Incident updated', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  const timelineMutation = useMutation({
    mutationFn: (event: string) =>
      addIncidentTimelineEvent(id, {
        actor: 'admin',
        actorType: 'admin',
        event,
        timestamp: new Date().toISOString(),
        details: null,
      }),
    onSuccess: () => {
      toast({ title: 'Timeline updated', variant: 'success' });
      setNewEvent('');
      qc.invalidateQueries({ queryKey: ['incident', id] });
    },
  });

  React.useEffect(() => {
    if (incident?.assignee) setAssignee(incident.assignee);
  }, [incident?.assignee]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!incident) return <div>Incident not found</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/incidents" className="hover:text-foreground transition-colors">
          <ChevronLeft className="inline h-3 w-3 mr-1" />
          Incidents
        </Link>
        <span>/</span>
        <span className="font-mono text-xs">{id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            {incident.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={SEVERITY_COLORS[incident.severity]} className="capitalize text-sm px-3 py-1">
            {incident.severity}
          </Badge>
          <Badge variant={STATUS_COLORS[incident.status]} className="capitalize text-sm px-3 py-1">
            {incident.status}
          </Badge>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reporter</span>
              <span className="font-medium">{incident.reporter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Assignee</span>
              <span className="font-medium">{incident.assignee || 'Unassigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(incident.createdAt, { withTime: true })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(incident.updatedAt, { withTime: true })}</span>
            </div>
            {incident.resolvedAt && (
              <div className="flex justify-between text-success">
                <span className="text-muted-foreground">Resolved</span>
                <span>{formatDate(incident.resolvedAt, { withTime: true })}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              Affected Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {incident.affectedServices.map((svc) => (
                <Badge key={svc} variant="outline">
                  {svc}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Update Status</label>
              <Select
                value={incident.status}
                onValueChange={(v) => updateMutation.mutate({ status: v as Incident['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="mitigated">Mitigated</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Assign To</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Assignee name..."
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={() => updateMutation.mutate({ assignee })}
                  loading={updateMutation.isPending}
                >
                  Assign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Incident Timeline
          </CardTitle>
          <CardDescription>Chronological record of all events and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Add a timeline event..."
              value={newEvent}
              onChange={(e) => setNewEvent(e.target.value)}
              className="min-h-[60px]"
            />
            <Button
              className="self-end"
              onClick={() => timelineMutation.mutate(newEvent)}
              loading={timelineMutation.isPending}
              disabled={!newEvent.trim()}
            >
              <Send className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin pr-2">
            {incident.timeline?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No timeline events yet</p>
            ) : (
              incident.timeline?.map((event, idx) => (
                <div key={event.id} className="flex gap-3 relative">
                  {/* Connector line */}
                  {idx !== (incident.timeline?.length ?? 0) - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-12px] w-px bg-border" />
                  )}
                  <div
                    className={`mt-1 h-5 w-5 shrink-0 rounded-full flex items-center justify-center ${
                      event.actorType === 'system'
                        ? 'bg-felo-sage-100 text-felo-sage-600'
                        : event.actorType === 'automation'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-felo-amber-100 text-felo-amber-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold">
                      {event.actorType === 'system' ? 'S' : event.actorType === 'automation' ? 'A' : 'H'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{event.event}</p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDate(event.timestamp, { relative: true })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {event.actor}
                      </Badge>
                      {event.details && (
                        <p className="text-xs text-muted-foreground">{event.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
