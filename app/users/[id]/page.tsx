'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getUser, forceLogoutUser, softDeleteUser, logPiiAccess } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateConfirmId, formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import * as React from 'react';
import { User, LogOut, Trash2, Shield, Mail, Phone, MapPin, Calendar } from 'lucide-react';

const TIER_COLORS: Record<string, string> = { free: 'secondary', basic: 'info', pro: 'success', elite: 'warning' };

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showDelete, setShowDelete] = React.useState(false);
  const [confirmId] = React.useState(() => generateConfirmId());

  const { data: user, isLoading } = useQuery({ queryKey: ['user', id], queryFn: () => getUser(id) });

  const logoutMutation = useMutation({
    mutationFn: () => forceLogoutUser(id),
    onSuccess: () => {
      toast({ title: 'User logged out', variant: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => softDeleteUser(id),
    onSuccess: () => {
      toast({ title: 'User deleted', variant: 'success' });
      setShowDelete(false);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  React.useEffect(() => {
    logPiiAccess(id, 'View user detail page');
  }, [id]);

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

  if (!user) return <div>User not found</div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Users</span>
        <span>/</span>
        <span className="font-mono text-xs">{id.slice(0, 8)}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <User className="h-6 w-6" />
            {user.displayName || user.email}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => logoutMutation.mutate()} loading={logoutMutation.isPending}>
            <LogOut className="mr-1 h-4 w-4" />
            Force Logout
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="mr-1 h-4 w-4" />
            Soft Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                  {user.isEmailVerified && <Badge variant="success" className="text-[10px]">Verified</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{user.phone || '—'}</span>
                  {user.phone && user.isPhoneVerified && <Badge variant="success" className="text-[10px]">Verified</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Corridor: <Badge variant="outline">{user.corridor}</Badge></span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Tier: <Badge variant={TIER_COLORS[user.tier] as 'default'}>{user.tier}</Badge></span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Timestamps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Created: {formatDate(user.createdAt, { withTime: true })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Updated: {formatDate(user.updatedAt, { withTime: true })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Last Login: {formatDate(user.lastLoginAt, { withTime: true }) || 'Never'}</span>
                </div>
                {user.deletedAt && (
                  <div className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-4 w-4" />
                    <span>Deleted: {formatDate(user.deletedAt, { withTime: true })}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="rounded-lg bg-muted p-3 text-xs overflow-auto max-h-48">
                  {JSON.stringify(user.metadata, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Timeline</CardTitle>
              <CardDescription>Recent events for this user (integrate with traceability API)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Connect to <code>/admin/traceability/user/{id}</code> for full timeline.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Available actions for this user account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Force Logout</p>
                  <p className="text-sm text-muted-foreground">Immediately terminate all active sessions</p>
                </div>
                <Button variant="outline" onClick={() => logoutMutation.mutate()} loading={logoutMutation.isPending}>
                  <LogOut className="mr-1 h-4 w-4" />
                  Execute
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Soft Delete</p>
                  <p className="text-sm text-muted-foreground">Mark account as deleted (recoverable)</p>
                </div>
                <Button variant="destructive" onClick={() => setShowDelete(true)}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Execute
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Soft Delete User"
        description={`This will mark user ${user.email} as deleted. They will lose access but data is preserved. Type the confirmation code to proceed.`}
        confirmId={confirmId}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
