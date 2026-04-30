'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getTransactionLineage } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ArrowLeft, GitBranch, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function TransactionLineagePage() {
  const { id } = useParams<{ id: string }>();
  const { data: lineage, isLoading } = useQuery({ queryKey: ['transactionLineage', id], queryFn: () => getTransactionLineage(id) });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/traceability">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6" />
            Transaction Lineage
          </h1>
          <p className="text-sm text-muted-foreground font-mono">{id}</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {lineage && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-semibold">{formatCurrency(lineage.amount, lineage.currency)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge>{lineage.status}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Source</p>
                <p className="font-medium">{lineage.sourceSystem}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(lineage.createdAt, { withTime: true })}</p>
              </div>
            </CardContent>
          </Card>

          <div className="relative space-y-4 pl-6 border-l-2 border-muted">
            {lineage.events.map((event) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-felo-amber-100 border-2 border-background">
                  <GitBranch className="h-3 w-3 text-felo-amber-600" />
                </div>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{event.action}</Badge>
                      <span className="text-xs text-muted-foreground">{event.actorType}:{event.actorId.slice(0, 8)}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatDate(event.timestamp, { relative: true })}</span>
                    </div>
                    {event.diff && (
                      <div className="mt-2 rounded-lg bg-muted p-3 text-xs font-mono space-y-1">
                        {Object.entries(event.diff).map(([key, val]) => (
                          <div key={key} className="flex gap-2">
                            <span className="text-muted-foreground w-24 shrink-0">{key}:</span>
                            <span className="text-red-600 line-through">{JSON.stringify(val.old)}</span>
                            <span>→</span>
                            <span className="text-felo-emerald-700 font-semibold">{JSON.stringify(val.new)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
