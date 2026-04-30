'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchTraceability } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import { Search, GitCommitHorizontal, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TraceabilityPage() {
  const [query, setQuery] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['traceability', searchTerm],
    queryFn: () => searchTraceability(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const handleSearch = () => setSearchTerm(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Traceability Center</h1>
        <p className="text-sm text-muted-foreground">Search across all entities and events</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Search by user ID, transaction ID, email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="mr-1 h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {results && results.length === 0 && searchTerm && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No results found for &quot;{searchTerm}&quot;
          </CardContent>
        </Card>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((event) => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-felo-sage-100">
                    <GitCommitHorizontal className="h-5 w-5 text-felo-sage-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.entityType}</Badge>
                      <span className="text-sm font-medium">{event.action}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDate(event.timestamp, { relative: true })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono text-xs">{event.entityId.slice(0, 12)}...</span>
                      <span>by {event.actorType}:{event.actorId.slice(0, 8)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {event.entityType === 'user' && (
                      <Link href={`/traceability/user/${event.entityId}`}>
                        <Button variant="ghost" size="sm"><User className="h-4 w-4" /></Button>
                      </Link>
                    )}
                    {event.entityType === 'transaction' && (
                      <Link href={`/traceability/transaction/${event.entityId}`}>
                        <Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
