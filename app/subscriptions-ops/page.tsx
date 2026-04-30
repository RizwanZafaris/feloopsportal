'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { listTiers, listCoupons, listRefundRequests, listFailedPayments, listWebhookEvents } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreditCard, Tag, RotateCcw, Webhook } from 'lucide-react';
import type { SubscriptionTier, Coupon, RefundRequest } from '@/types/admin';

export default function SubscriptionsOpsPage() {
  const { data: tiers } = useQuery({ queryKey: ['tiers'], queryFn: listTiers });
  const { data: coupons } = useQuery({ queryKey: ['coupons'], queryFn: listCoupons });
  const { data: refunds } = useQuery({ queryKey: ['refunds'], queryFn: () => listRefundRequests('pending') });
  const { data: failedPayments } = useQuery({ queryKey: ['failedPayments'], queryFn: listFailedPayments });
  const { data: webhooks } = useQuery({ queryKey: ['webhooks'], queryFn: () => listWebhookEvents('stripe') });

  const tierColumns = [
    { key: 'label', header: 'Tier', render: (t: SubscriptionTier) => <Badge variant="outline" className="font-semibold">{t.label}</Badge> },
    { key: 'displayName', header: 'Name', render: (t: SubscriptionTier) => t.displayName.en },
    { key: 'priceMonthly', header: 'Monthly', render: (t: SubscriptionTier) => formatCurrency(t.priceMonthly, t.currency) },
    { key: 'priceYearly', header: 'Yearly', render: (t: SubscriptionTier) => formatCurrency(t.priceYearly, t.currency) },
    { key: 'entitlements', header: 'Key Features', render: (t: SubscriptionTier) => (
      <div className="flex gap-1 flex-wrap">
        {Object.entries(t.entitlements).filter(([, v]) => v).slice(0, 4).map(([k]) => (
          <Badge key={k} variant="secondary" className="text-[10px]">{k}</Badge>
        ))}
      </div>
    )},
    { key: 'isActive', header: 'Status', render: (t: SubscriptionTier) => <Badge variant={t.isActive ? 'success' : 'secondary'}>{t.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const couponColumns = [
    { key: 'code', header: 'Code', render: (c: Coupon) => <code className="bg-muted px-1 rounded text-xs font-bold">{c.code}</code> },
    { key: 'discountType', header: 'Type', render: (c: Coupon) => c.discountType },
    { key: 'discountValue', header: 'Value', render: (c: Coupon) => c.discountType === 'percentage' ? `${c.discountValue}%` : formatCurrency(c.discountValue, 'USD') },
    { key: 'redemptionCount', header: 'Redeemed', render: (c: Coupon) => `${c.redemptionCount}${c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}` },
    { key: 'validFrom', header: 'Valid From', render: (c: Coupon) => formatDate(c.validFrom) },
    { key: 'isActive', header: 'Status', render: (c: Coupon) => <Badge variant={c.isActive ? 'success' : 'secondary'}>{c.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  const refundColumns = [
    { key: 'userId', header: 'User', render: (r: RefundRequest) => <span className="font-mono text-xs">{r.userId.slice(0, 8)}</span> },
    { key: 'amount', header: 'Amount', render: (r: RefundRequest) => formatCurrency(r.amount, r.currency) },
    { key: 'reason', header: 'Reason', render: (r: RefundRequest) => <span className="text-sm">{r.reason}</span> },
    { key: 'status', header: 'Status', render: (r: RefundRequest) => <Badge variant={r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'destructive'}>{r.status}</Badge> },
    { key: 'requiresTwoPerson', header: '2PA', render: (r: RefundRequest) => r.requiresTwoPerson ? <Badge variant="destructive">Required</Badge> : <Badge variant="outline">No</Badge> },
    { key: 'createdAt', header: 'Requested', render: (r: RefundRequest) => formatDate(r.createdAt, { relative: true }) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Subscriptions & Billing
        </h1>
        <p className="text-sm text-muted-foreground">Tiers, coupons, refunds, and payment monitoring</p>
      </div>

      <Tabs defaultValue="tiers">
        <TabsList>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="refunds">Refund Queue {refunds && refunds.length > 0 && `(${refunds.length})`}</TabsTrigger>
          <TabsTrigger value="failed">Failed Payments</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="tiers">
          <DataTable columns={tierColumns} data={tiers || []} keyExtractor={(t) => t.id} emptyMessage="No tiers configured" />
        </TabsContent>

        <TabsContent value="coupons">
          <DataTable columns={couponColumns} data={coupons || []} keyExtractor={(c) => c.id} emptyMessage="No coupons" />
        </TabsContent>

        <TabsContent value="refunds">
          <DataTable columns={refundColumns} data={refunds || []} keyExtractor={(r) => r.id} emptyMessage="No pending refunds" />
        </TabsContent>

        <TabsContent value="failed">
          <DataTable
            columns={[
              { key: 'userId', header: 'User', render: (f: { userId: string; amount: number; reason: string; retryCount: number; createdAt: string }) => <span className="font-mono text-xs">{f.userId.slice(0, 8)}</span> },
              { key: 'amount', header: 'Amount', render: (f: { userId: string; amount: number; reason: string; retryCount: number; createdAt: string }) => formatCurrency(f.amount, 'USD') },
              { key: 'reason', header: 'Reason', render: (f: { userId: string; amount: number; reason: string; retryCount: number; createdAt: string }) => <Badge variant="destructive" className="text-xs">{f.reason}</Badge> },
              { key: 'retryCount', header: 'Retries', render: (f: { userId: string; amount: number; reason: string; retryCount: number; createdAt: string }) => f.retryCount },
              { key: 'createdAt', header: 'Date', render: (f: { userId: string; amount: number; reason: string; retryCount: number; createdAt: string }) => formatDate(f.createdAt, { relative: true }) },
            ]}
            data={failedPayments || []}
            keyExtractor={(f) => f.id}
            emptyMessage="No failed payments"
          />
        </TabsContent>

        <TabsContent value="webhooks">
          <div className="space-y-2">
            {webhooks?.map((w) => (
              <Card key={w.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{w.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={w.status === 'delivered' ? 'success' : w.status === 'failed' ? 'destructive' : 'warning'}>{w.status}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(w.createdAt, { relative: true })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
