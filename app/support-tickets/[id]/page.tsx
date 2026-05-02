'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getSupportTicket, updateSupportTicket, addTicketMessage, assignTicket, escalateTicket } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { MessageSquare, ChevronLeft, Send, UserCheck, ArrowUpRight, User, Clock, Tag } from 'lucide-react';
import Link from 'next/link';
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

export default function SupportTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [reply, setReply] = React.useState('');
  const [assignee, setAssignee] = React.useState('');

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['supportTicket', id],
    queryFn: () => getSupportTicket(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<SupportTicket>) => updateSupportTicket(id, data),
    onSuccess: () => {
      toast({ title: 'Ticket updated', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['supportTicket', id] });
    },
  });

  const messageMutation = useMutation({
    mutationFn: (content: string) =>
      addTicketMessage(id, {
        sender: 'agent',
        senderName: 'Support Agent',
        content,
        createdAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast({ title: 'Reply sent', variant: 'success' });
      setReply('');
      qc.invalidateQueries({ queryKey: ['supportTicket', id] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (assignee: string) => assignTicket(id, assignee),
    onSuccess: () => {
      toast({ title: 'Ticket assigned', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['supportTicket', id] });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: () => escalateTicket(id, 'Escalated by admin'),
    onSuccess: () => {
      toast({ title: 'Ticket escalated', variant: 'success' });
      qc.invalidateQueries({ queryKey: ['supportTicket', id] });
    },
  });

  React.useEffect(() => {
    if (ticket?.assignee) setAssignee(ticket.assignee);
  }, [ticket?.assignee]);

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

  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/support-tickets" className="hover:text-foreground transition-colors">
          <ChevronLeft className="inline h-3 w-3 mr-1" />
          Support Tickets
        </Link>
        <span>/</span>
        <span className="font-mono text-xs">{id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            {ticket.subject}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant={PRIORITY_COLORS[ticket.priority]} className="capitalize text-sm px-3 py-1">
            {ticket.priority}
          </Badge>
          <Badge variant={STATUS_COLORS[ticket.status]} className="capitalize text-sm px-3 py-1">
            {ticket.status}
          </Badge>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              User Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{ticket.userName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{ticket.userEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{ticket.userId.slice(0, 12)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <Badge variant="outline">{ticket.category}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Timestamps
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDate(ticket.createdAt, { withTime: true })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDate(ticket.updatedAt, { withTime: true })}</span>
            </div>
            {ticket.resolvedAt && (
              <div className="flex justify-between text-success">
                <span className="text-muted-foreground">Resolved</span>
                <span>{formatDate(ticket.resolvedAt, { withTime: true })}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Update Status</label>
              <Select
                value={ticket.status}
                onValueChange={(v) => updateMutation.mutate({ status: v as SupportTicket['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
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
                  onClick={() => assignMutation.mutate(assignee)}
                  loading={assignMutation.isPending}
                >
                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                  Assign
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => escalateMutation.mutate()}
              loading={escalateMutation.isPending}
            >
              <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
              Escalate Ticket
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Conversation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversation History
          </CardTitle>
          <CardDescription>All messages between user and support team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Reply box */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-[80px]"
            />
            <Button
              className="self-end"
              onClick={() => messageMutation.mutate(reply)}
              loading={messageMutation.isPending}
              disabled={!reply.trim()}
            >
              <Send className="mr-1 h-4 w-4" />
              Send
            </Button>
          </div>

          {/* Messages */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
            {ticket.messages?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No messages yet</p>
            ) : (
              ticket.messages?.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg border p-4 ${
                    msg.sender === 'user'
                      ? 'bg-muted/30'
                      : msg.sender === 'agent'
                      ? 'bg-felo-sage-50/50 border-felo-sage-200'
                      : 'bg-blue-50/50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          msg.sender === 'user'
                            ? 'bg-felo-amber-100 text-felo-amber-700'
                            : msg.sender === 'agent'
                            ? 'bg-felo-sage-100 text-felo-sage-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {msg.sender === 'user' ? 'U' : msg.sender === 'agent' ? 'A' : 'S'}
                      </div>
                      <span className="text-sm font-medium">{msg.senderName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {msg.sender}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(msg.createdAt, { withTime: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
