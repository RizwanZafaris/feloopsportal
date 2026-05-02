'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listWalletBalances, listWalletTransactions, flagTransaction, getTransactionFlags } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CreditCard, Search, ArrowDownLeft, ArrowUpRight, Flag, AlertTriangle } from 'lucide-react';
import type { WalletBalanceAdmin, WalletTransactionAdmin, WalletTransactionFlag } from '@/types/admin';

export default function WalletOpsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [flaggedOnly, setFlaggedOnly] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<WalletTransactionAdmin | null>(null);
  const [showFlagDialog, setShowFlagDialog] = React.useState(false);
  const [flagType, setFlagType] = React.useState('suspicious');
  const [flagReason, setFlagReason] = React.useState('');

  const { data: balancesData, isLoading: balancesLoading } = useQuery({
    queryKey: ['walletBalances', search],
    queryFn: () => listWalletBalances({ search: search || undefined, limit: 50 }),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['walletTransactions', selectedTransaction?.userId, flaggedOnly],
    queryFn: () => listWalletTransactions({
      userId: selectedTransaction?.userId,
      flagged: flaggedOnly || undefined,
      limit: 50,
    }),
    enabled: !!selectedTransaction?.userId || flaggedOnly,
  });

  const { data: flagsData } = useQuery({
    queryKey: ['transactionFlags', selectedTransaction?.id],
    queryFn: () => getTransactionFlags(selectedTransaction?.id),
    enabled: !!selectedTransaction,
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, type, reason }: { id: string; type: string; reason: string }) => flagTransaction(id, type, reason),
    onSuccess: () => {
      toast({ title: 'Transaction flagged', variant: 'success' });
      setShowFlagDialog(false);
      qc.invalidateQueries({ queryKey: ['walletTransactions'] });
      qc.invalidateQueries({ queryKey: ['transactionFlags'] });
    },
  });

  const balanceColumns = [
    {
      key: 'displayName',
      header: 'User',
      render: (b: WalletBalanceAdmin) => (
        <div>
          <span className="font-medium text-sm">{b.displayName}</span>
          <p className="text-xs text-muted-foreground">{b.email}</p>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (b: WalletBalanceAdmin) => (
        <span className="font-medium text-sm">
          {formatCurrency(b.totalBalanceMinor, b.currency)}
        </span>
      ),
    },
    {
      key: 'accounts',
      header: 'Accounts',
      render: (b: WalletBalanceAdmin) => (
        <Badge variant="outline">{b.accountCount} linked</Badge>
      ),
    },
    {
      key: 'lastTransaction',
      header: 'Last Activity',
      render: (b: WalletBalanceAdmin) => (
        <span className="text-sm text-muted-foreground">
          {b.lastTransactionAt ? formatDate(b.lastTransactionAt, { relative: true }) : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (b: WalletBalanceAdmin) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch(b.userId);
            setSelectedTransaction({ userId: b.userId } as WalletTransactionAdmin);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const transactionColumns = [
    {
      key: 'merchant',
      header: 'Transaction',
      render: (t: WalletTransactionAdmin) => (
        <div>
          <span className="font-medium text-sm">{t.merchant || t.category || 'Unknown'}</span>
          <p className="text-xs text-muted-foreground font-mono">{t.id.slice(0, 12)}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (t: WalletTransactionAdmin) => (
        <div className="flex items-center gap-1">
          {t.direction === 'credit' ? (
            <ArrowDownLeft className="h-3.5 w-3.5 text-felo-emerald-500" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={`font-medium text-sm ${t.direction === 'credit' ? 'text-felo-emerald-600' : ''}`}>
            {formatCurrency(t.amountMinor, t.currency)}
          </span>
        </div>
      ),
    },
    {
      key: 'direction',
      header: 'Direction',
      render: (t: WalletTransactionAdmin) => (
        <Badge variant={t.direction === 'credit' ? 'success' : 'default'}>
          {t.direction}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: WalletTransactionAdmin) => (
        <Badge variant={t.status === 'booked' ? 'success' : t.status === 'pending' ? 'warning' : 'secondary'}>
          {t.status}
        </Badge>
      ),
    },
    {
      key: 'flags',
      header: 'Flags',
      render: (t: WalletTransactionAdmin) => (
        t.flags.length > 0 ? (
          <div className="flex gap-1">
            {t.flags.map((f) => (
              <Badge key={f} variant="destructive" className="text-[10px]">{f}</Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
    {
      key: 'bookedAt',
      header: 'Date',
      render: (t: WalletTransactionAdmin) => (
        <span className="text-sm text-muted-foreground">{formatDate(t.bookedAt, { relative: true })}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (t: WalletTransactionAdmin) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSelectedTransaction(t); setShowFlagDialog(true); }}
        >
          <Flag className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  const filteredBalances = balancesData?.items.filter((b) =>
    search ? b.displayName.toLowerCase().includes(search.toLowerCase()) || b.email.includes(search) || b.userId.includes(search) : true
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Wallet Admin
          </h1>
          <p className="text-sm text-muted-foreground">Monitor user balances, transactions, and flag suspicious activity</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users or transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={flaggedOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFlaggedOnly(!flaggedOnly)}
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Flagged Only
        </Button>
      </div>

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Balances {balancesData && `(${balancesData.total})`}</TabsTrigger>
          <TabsTrigger value="transactions">Transactions {transactionsData && `(${transactionsData.total})`}</TabsTrigger>
        </TabsList>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DataTable columns={balanceColumns} data={filteredBalances} keyExtractor={(b) => b.userId} loading={balancesLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <DataTable columns={transactionColumns} data={transactionsData?.items || []} keyExtractor={(t) => t.id} loading={transactionsLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Flag Dialog */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5" />
              Flag Transaction
            </DialogTitle>
            <DialogDescription>
              {selectedTransaction?.merchant || selectedTransaction?.category || 'Transaction'} — {selectedTransaction?.id?.slice(0, 12)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Flag Type</label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm mt-1"
                value={flagType}
                onChange={(e) => setFlagType(e.target.value)}
              >
                <option value="suspicious">Suspicious</option>
                <option value="duplicate">Duplicate</option>
                <option value="manual_review">Manual Review</option>
                <option value="compliance">Compliance</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Reason (required)</label>
              <Input
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Why are you flagging this transaction?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlagDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedTransaction && flagMutation.mutate({ id: selectedTransaction.id, type: flagType, reason: flagReason })}
              disabled={!flagReason}
              loading={flagMutation.isPending}
            >
              Flag Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
