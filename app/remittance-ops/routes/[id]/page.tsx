'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { ArrowLeft, Save, ArrowRightLeft } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  providerCode: string;
  supportedCurrencies: string[];
  payoutMethods: string[];
}

interface RouteFormData {
  name: string;
  corridor: string;
  sourceCurrency: string;
  targetCurrency: string;
  providerId: string;
  payoutMethod: string;
  feeBps: number;
  fxMarkupBps: number;
  minAmount: number;
  maxAmount: number;
  estimatedMinutes: number;
  priority: number;
  enabled: boolean;
}

const COMMON_CORRIDORS = [
  'AE-PK', 'AE-BD', 'AE-NP', 'AE-EG', 'AE-MY', 'AE-UZ', 'AE-KZ',
  'SA-PK', 'SA-BD', 'SA-NP',
  'US-PK', 'US-BD', 'US-NP',
  'GB-PK', 'GB-BD', 'GB-NP',
  'CA-PK', 'CA-NP',
];

const CURRENCIES = ['AED', 'PKR', 'BDT', 'NPR', 'EGP', 'MYR', 'UZS', 'KZT', 'USD', 'GBP', 'SAR', 'CAD'];

const PAYOUT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash_pickup', label: 'Cash Pickup' },
  { value: 'mobile_wallet', label: 'Mobile Wallet' },
  { value: 'card', label: 'Card' },
];

export default function RouteFormPage() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;
  const isNew = routeId === 'new';

  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [providers, setProviders] = React.useState<Provider[]>([]);
  const [form, setForm] = React.useState<RouteFormData>({
    name: '',
    corridor: '',
    sourceCurrency: 'AED',
    targetCurrency: 'PKR',
    providerId: '',
    payoutMethod: 'bank_transfer',
    feeBps: 50,
    fxMarkupBps: 100,
    minAmount: 10,
    maxAmount: 10000,
    estimatedMinutes: 30,
    priority: 0,
    enabled: true,
  });

  React.useEffect(() => {
    loadProviders();
    if (!isNew) loadRoute();
  }, [routeId]);

  const loadProviders = async () => {
    try {
      const res = await api.get('/admin/remittance/providers');
      setProviders(res.data || []);
    } catch (err) {
      toast({ title: 'Failed to load providers', variant: 'destructive' });
    }
  };

  const loadRoute = async () => {
    try {
      const res = await api.get(`/admin/remittance/routes/${routeId}`);
      setForm({
        ...res.data,
        feeBps: res.data.feeBps || 50,
        fxMarkupBps: res.data.fxMarkupBps || 100,
        minAmount: parseFloat(res.data.minAmount) || 10,
        maxAmount: parseFloat(res.data.maxAmount) || 10000,
        estimatedMinutes: res.data.estimatedMinutes || 30,
        priority: res.data.priority || 0,
      });
    } catch (err) {
      toast({ title: 'Failed to load route', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/remittance/routes', form);
        toast({ title: 'Route created successfully', variant: 'success' });
      } else {
        await api.put(`/admin/remittance/routes/${routeId}`, form);
        toast({ title: 'Route updated successfully', variant: 'success' });
      }
      router.push('/remittance-ops');
    } catch (err: any) {
      toast({ title: err.response?.data?.message || 'Failed to save route', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectedProvider = providers.find(p => p.id === form.providerId);

  const availablePayoutMethods = selectedProvider?.payoutMethods || PAYOUT_METHODS.map(m => m.value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/remittance-ops')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {isNew ? 'Add Route' : 'Edit Route'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Route Configuration</CardTitle>
          <CardDescription>
            Configure a remittance corridor with fee structure and provider routing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Route Name</Label>
            <Input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. UAE to Pakistan - Bank Transfer"
            />
          </div>

          <div className="space-y-2">
            <Label>Corridor</Label>
            <Select value={form.corridor} onValueChange={v => setForm(prev => ({ ...prev, corridor: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select corridor" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CORRIDORS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="mt-2"
              placeholder="Or enter custom corridor (e.g. AE-MY)"
              value={!COMMON_CORRIDORS.includes(form.corridor) ? form.corridor : ''}
              onChange={e => setForm(prev => ({ ...prev, corridor: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Source Currency</Label>
              <Select value={form.sourceCurrency} onValueChange={v => setForm(prev => ({ ...prev, sourceCurrency: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Currency</Label>
              <Select value={form.targetCurrency} onValueChange={v => setForm(prev => ({ ...prev, targetCurrency: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={form.providerId} onValueChange={v => setForm(prev => ({ ...prev, providerId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      {p.name}
                      <Badge variant="outline" className="text-xs">{p.providerCode}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payout Method</Label>
            <Select value={form.payoutMethod} onValueChange={v => setForm(prev => ({ ...prev, payoutMethod: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYOUT_METHODS.filter(m => availablePayoutMethods.includes(m.value)).map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fee (basis points)</Label>
              <Input
                type="number"
                value={form.feeBps}
                onChange={e => setForm(prev => ({ ...prev, feeBps: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{(form.feeBps / 100).toFixed(2)}%</p>
            </div>
            <div className="space-y-2">
              <Label>FX Markup (basis points)</Label>
              <Input
                type="number"
                value={form.fxMarkupBps}
                onChange={e => setForm(prev => ({ ...prev, fxMarkupBps: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">{(form.fxMarkupBps / 100).toFixed(2)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Min Amount</Label>
              <Input
                type="number"
                value={form.minAmount}
                onChange={e => setForm(prev => ({ ...prev, minAmount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Amount</Label>
              <Input
                type="number"
                value={form.maxAmount}
                onChange={e => setForm(prev => ({ ...prev, maxAmount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Minutes</Label>
              <Input
                type="number"
                value={form.estimatedMinutes}
                onChange={e => setForm(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority (higher = preferred)</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={e => setForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Switch
              checked={form.enabled}
              onCheckedChange={v => setForm(prev => ({ ...prev, enabled: v }))}
            />
            <Label>Enabled</Label>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push('/remittance-ops')}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-felo-purple-600">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Route'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
