'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { getUserTimeline } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { GitCommitHorizontal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserTimelinePage() {
  const { id } = useParams<{ id: string }>();
  const { data: events, isLoading } = useQuery({ queryKey: ['userTimeline', id], queryFn: () => getUserTimeline(id) });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/traceability">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Timeline</h1>
          <p className="text-sm text-muted-foreground font-mono">{id}</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {events && events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No events found for this user</CardContent>
        </Card>
      )}

      {events && events.length > 0 && (
        <div className="relative space-y-4 pl-6 border-l-2 border-muted">
          {events.map((event, i) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-felo-sage-100 border-2 border-background">
                <GitCommitHorizontal className="h-3 w-3 text-felo-sage-600" />
              </div>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{event.action}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(event.timestamp, { withTime: true })}</span>
                  </div>
                  <p className="text-sm font-mono text-muted-foreground">{event.entityType}:{event.entityId.slice(0, 16)}</p>
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <pre className="mt-2 rounded bg-muted p-2 text-xs overflow-auto">{JSON.stringify(event.metadata, null, 2)}</pre>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
