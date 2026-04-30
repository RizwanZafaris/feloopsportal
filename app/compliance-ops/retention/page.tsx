'use client';

import { useQuery } from '@tanstack/react-query';
import { getRetentionMetrics } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Database, ArrowLeft, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RetentionPage() {
  const { data: metrics, isLoading } = useQuery({ queryKey: ['retentionMetrics'], queryFn: getRetentionMetrics });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/compliance-ops">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-6 w-6" />
            Retention Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Data retention status and pending deletions</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : metrics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Records</span>
                </div>
                <p className="text-2xl font-bold mt-1">
                  {metrics.retentionByDataType.reduce((sum, d) => sum + d.recordCount, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <span className="text-sm text-muted-foreground">Deletions Pending</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-destructive">{metrics.deletionsPending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-felo-amber-500" />
                  <span className="text-sm text-muted-foreground">Exports Pending</span>
                </div>
                <p className="text-2xl font-bold mt-1 text-felo-amber-600">{metrics.exportsPending}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Retention by Data Type</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics.retentionByDataType.map((d) => (
                  <div key={d.dataType} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{d.dataType}</Badge>
                      <span className="text-muted-foreground">Oldest: {formatDate(d.oldestRecord)}</span>
                    </div>
                    <span className="font-medium">{d.recordCount.toLocaleString()} records</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
