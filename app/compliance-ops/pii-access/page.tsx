'use client';

import { useQuery } from '@tanstack/react-query';
import { getPiiAccessLog } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PiiAccessPage() {
  const { data: logs } = useQuery({ queryKey: ['piiAccessLog'], queryFn: () => getPiiAccessLog() });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/compliance-ops">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="h-6 w-6" />
            PII Access Log
          </h1>
          <p className="text-sm text-muted-foreground">Audit trail of all PII access by admins</p>
        </div>
      </div>

      <div className="space-y-2">
        {logs?.map((log) => (
          <Card key={log.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-felo-amber-100 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-felo-amber-600" />
                </div>
                <div>
                  <p className="font-medium">{log.adminId}</p>
                  <p className="text-xs text-muted-foreground">User: <span className="font-mono">{log.userId.slice(0, 12)}</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm">{log.purpose}</p>
                <p className="text-xs text-muted-foreground">{formatDate(log.accessedAt, { withTime: true })}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!logs || logs.length === 0) && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No PII access recorded</CardContent></Card>
        )}
      </div>
    </div>
  );
}
