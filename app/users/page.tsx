'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { listUsers } from '@/lib/api';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { Search, User, Users } from 'lucide-react';
import type { Profile } from '@/types/admin';

const TIER_COLORS: Record<string, string> = {
  free: 'secondary',
  basic: 'info',
  pro: 'success',
  elite: 'warning',
};

const CORRIDORS = ['ALL', 'PK', 'AE', 'SA', 'BH', 'KW', 'QA', 'OM', 'GB', 'US', 'CA'];
const TIERS = ['ALL', 'free', 'basic', 'pro', 'elite'];

export default function UsersPage() {
  const router = useRouter();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [corridor, setCorridor] = React.useState('ALL');
  const [tier, setTier] = React.useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, corridor, tier],
    queryFn: () => listUsers({ page, limit: 20, corridor: corridor === 'ALL' ? undefined : corridor, tier: tier === 'ALL' ? undefined : tier }),
  });

  const columns = [
    {
      key: 'id',
      header: 'ID',
      className: 'w-24 font-mono text-xs',
      render: (row: Profile) => <span className="font-mono text-xs">{row.id.slice(0, 8)}</span>,
    },
    { key: 'email', header: 'Email', render: (row: Profile) => row.email },
    { key: 'displayName', header: 'Name', render: (row: Profile) => row.displayName || '—' },
    {
      key: 'corridor',
      header: 'Corridor',
      render: (row: Profile) => <Badge variant="outline">{row.corridor}</Badge>,
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (row: Profile) => (
        <Badge variant={(TIER_COLORS[row.tier] as 'default' | 'secondary' | 'success' | 'warning' | 'info') || 'default'}>
          {row.tier}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: Profile) => formatDate(row.createdAt, { relative: true }),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20',
      render: (row: Profile) => (
        <Button variant="ghost" size="sm" onClick={() => router.push(`/users/${row.id}`)}>
          View
        </Button>
      ),
    },
  ];

  const filteredItems = React.useMemo(() => {
    if (!data?.items) return [];
    if (!search) return data.items;
    const q = search.toLowerCase();
    return data.items.filter(
      (u) => u.email.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6" />
          Users
        </h1>
        <p className="text-sm text-muted-foreground">Manage and view all platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search email, name, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={corridor} onValueChange={setCorridor}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Corridor" />
          </SelectTrigger>
          <SelectContent>
            {CORRIDORS.map((c) => (
              <SelectItem key={c} value={c}>{c === 'ALL' ? 'All Corridors' : c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tier} onValueChange={setTier}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Tier" />
          </SelectTrigger>
          <SelectContent>
            {TIERS.map((t) => (
              <SelectItem key={t} value={t}>{t === 'ALL' ? 'All Tiers' : t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredItems}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyMessage="No users found"
        onRowClick={(row) => router.push(`/users/${row.id}`)}
        pagination={
          data
            ? { page, pageSize: 20, total: data.total, onPageChange: setPage }
            : undefined
        }
      />
    </div>
  );
}
