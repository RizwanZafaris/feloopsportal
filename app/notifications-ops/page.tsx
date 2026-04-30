'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTemplates, listCampaigns, getCampaignMetrics } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDate, formatPercent } from '@/lib/utils';
import { Bell, Megaphone, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { NotificationTemplate, EngagementCampaign } from '@/types/admin';

export default function NotificationsOpsPage() {
  const { data: templates } = useQuery({ queryKey: ['templates'], queryFn: listTemplates });
  const { data: campaigns } = useQuery({ queryKey: ['campaigns'], queryFn: listCampaigns });

  const templateColumns = [
    { key: 'key', header: 'Key', render: (t: NotificationTemplate) => <code className="text-xs bg-muted px-1 rounded font-bold">{t.key}</code> },
    { key: 'channel', header: 'Channel', render: (t: NotificationTemplate) => <Badge variant="outline">{t.channel}</Badge> },
    { key: 'subject', header: 'Subject (EN)', render: (t: NotificationTemplate) => <span className="text-sm">{t.subject.en}</span> },
    { key: 'variables', header: 'Vars', render: (t: NotificationTemplate) => t.variables.join(', ') },
    { key: 'isActive', header: 'Status', render: (t: NotificationTemplate) => <Badge variant={t.isActive ? 'success' : 'secondary'}>{t.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'updatedAt', header: 'Updated', render: (t: NotificationTemplate) => formatDate(t.updatedAt, { relative: true }) },
  ];

  const campaignColumns = [
    { key: 'name', header: 'Campaign', render: (c: EngagementCampaign) => <span className="font-medium">{c.name}</span> },
    { key: 'schedule', header: 'Type', render: (c: EngagementCampaign) => <Badge variant="outline">{c.schedule}</Badge> },
    { key: 'status', header: 'Status', render: (c: EngagementCampaign) => (
      <Badge variant={c.status === 'completed' ? 'success' : c.status === 'sending' ? 'warning' : c.status === 'cancelled' ? 'destructive' : 'secondary'}>
        {c.status}
      </Badge>
    )},
    { key: 'sentCount', header: 'Sent', render: (c: EngagementCampaign) => c.sentCount.toLocaleString() },
    { key: 'deliveredCount', header: 'Delivered', render: (c: EngagementCampaign) => c.deliveredCount.toLocaleString() },
    { key: 'openedCount', header: 'Opened', render: (c: EngagementCampaign) => c.openedCount.toLocaleString() },
    { key: 'createdAt', header: 'Created', render: (c: EngagementCampaign) => formatDate(c.createdAt, { relative: true }) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notification Studio
        </h1>
        <p className="text-sm text-muted-foreground">Templates, campaigns, and engagement metrics</p>
      </div>

      <div className="flex gap-2">
        <Link href="/notifications-ops/banners">
          <Button variant="outline"><Megaphone className="mr-1 h-4 w-4" /> Banners</Button>
        </Link>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <DataTable columns={templateColumns} data={templates || []} keyExtractor={(t) => t.id} emptyMessage="No templates" />
        </TabsContent>

        <TabsContent value="campaigns">
          <DataTable columns={campaignColumns} data={campaigns || []} keyExtractor={(c) => c.id} emptyMessage="No campaigns" />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {campaigns && campaigns.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              {campaigns.slice(0, 6).map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <p className="font-medium text-sm">{c.name}</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{c.sentCount > 0 ? ((c.deliveredCount / c.sentCount) * 100).toFixed(0) : 0}%</p>
                        <p className="text-[10px] text-muted-foreground">Delivery</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{c.sentCount > 0 ? ((c.openedCount / c.sentCount) * 100).toFixed(0) : 0}%</p>
                        <p className="text-[10px] text-muted-foreground">Open</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{c.sentCount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Sent</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No campaign data</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
