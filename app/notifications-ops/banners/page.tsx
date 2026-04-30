'use client';

import { useQuery } from '@tanstack/react-query';
import { listBanners } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Megaphone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BannersPage() {
  const { data: banners } = useQuery({ queryKey: ['banners'], queryFn: listBanners });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/notifications-ops">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            Announcement Banners
          </h1>
          <p className="text-sm text-muted-foreground">Manage in-app announcement banners</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {banners?.map((banner) => (
          <Card key={banner.id} className={banner.isActive ? 'border-felo-sage-300' : ''}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{banner.title.en}</h3>
                    <Badge variant={banner.isActive ? 'success' : 'secondary'}>{banner.isActive ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{banner.body.en}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Priority: {banner.priority}</span>
                    <span>Audience: {banner.audience}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatDate(banner.startsAt)} — {formatDate(banner.expiresAt)}
                  </div>
                  {banner.ctaText && (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">CTA: {banner.ctaText.en}</Badge>
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{banner.impressions.toLocaleString()} impressions</p>
                  <p>{banner.clicks.toLocaleString()} clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!banners || banners.length === 0) && (
          <Card className="lg:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">No banners configured</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
