'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { listSupportTickets, assignTicket, escalateTicket } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Search, Filter, UserCheck, ArrowUpRight, Ticket, Clock, CheckCircle } from 'lucide-react';
import type { SupportTicket } from '@/types/admin';

const PRIORITY_COLORS: Record<string, 'destructive' | 'warning' | 'default' | 'muted'> = {
  urgent: 'destructive',
  high: 'warning',
  normal: 'default',
  low: 'muted',
};

const STATUS_COLORS: Record<string, 'destructive' | 'warning' | 'success' | 'info' | 'secondary'> = {
  open: 'destructive',
  pending: 'warning',
  escalated: 'info',
  resolved: 'success',
  closed: 'secondary',
};

export default function SupportTicketsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [priorityFilter, setPriorityFilter] = React.useState('ALL');

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['supportTickets', statusFilter, priorityFilter],
    queryFn: () =>
      listSupportTickets(
        statusFilter === 'ALL' ? undefined : statusFilter,
        priorityFilter === 'ALL' ? undefined : priorityFilter
      ),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, assignee }: { id: string; assignee: string }) => assignTicket(id, assignee),
    onSuccess: () => {
      toast({ title: 'Ticket assigned', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['supportTickets'] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => escalateTicket(id, 'Escalated by admin'),
    onSuccess: () => {
      toast({ title: 'Ticket escalated', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['supportTickets'] });
    },
  });

  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'w-20 font-mono text-xs',
      render: (row: SupportTicket) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row: SupportTicket) => (
        <div>
          <span className="font-medium">{row.subject}</span>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{row.description}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row: SupportTicket) => (
        <div>
          <p className="text-sm">{row.userName}</p>
          <p className="text-xs text-muted-foreground">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row: SupportTicket) => (
        <Badge variant={PRIORITY_COLORS[row.priority]} className="capitalize">{row.priority}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: SupportTicket) => (
        <Badge variant={STATUS_COLORS[row.status]} className="capitalize">{row.status}</Badge>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row: SupportTicket) => <Badge variant="outline">{row.category}</Badge>,
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (row: SupportTicket) =>
        row.assignee || <span className="text-muted-foreground italic">Unassigned</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: SupportTicket) => formatDate(row.createdAt, { relative: true }),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-28',
      render: (row: SupportTicket) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            title="Assign to me"
            onClick={(e) => {
              e.stopPropagation();
              assignMutation.mutate({ id: row.id, assignee: 'admin' });
            }}
          >
            <UserCheck className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Escalate"
            onClick={(e) => {
              e.stopPropagation();
              escalateMutation.mutate(row.id);
            }}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => {
            e.stopPropagation();
            router.push(`/support-tickets/${row.id}`);
          }}>
            View
          </Button>
        </div>
      ),
    },
  ];

  const filteredItems = React.useMemo(() => {
    if (!tickets) return [];
    if (!search) return tickets;
    const q = search.toLowerCase();
    return tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(q) ||
        t.userName.toLowerCase().includes(q) ||
        t.userEmail.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  const openCount = tickets?.filter((t) => t.status === 'open').length ?? 0;
  const escalatedCount = tickets?.filter((t) => t.status === 'escalated').length ?? 0;
  const pendingCount = tickets?.filter((t) => t.status === 'pending').length ?? 0;
  const resolvedToday = tickets?.filter(
    (t) => t.status === 'resolved' && t.resolvedAt && new Date(t.resolvedAt).toDateString() === new Date().toDateString()
  ).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Support Tickets
        </h1>
        <p className="text-sm text-muted-foreground">Manage customer support requests and inquiries</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
              <div className="rounded-lg bg-felo-amber-100 p-2">
                <Ticket className="h-5 w-5 text-felo-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-2">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Escalated</p>
                <p className="text-2xl font-bold">{escalatedCount}</p>
              </div>
              <div className="rounded-lg bg-red-100 p-2">
                <ArrowUpRight className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold">{resolvedToday}</p>
              </div>
              <div className="rounded-lg bg-felo-emerald-100 p-2">
                <CheckCircle className="h-5 w-5 text-felo-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <Filter className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyMessage="No support tickets found"
        onRowClick={(row) => router.push(`/support-tickets/${row.id}`)}
      />
    </div>
  );
}
