'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { Globe, CreditCard, Wallet, Landmark, Banknote, Smartphone, ArrowRightLeft, RefreshCw, Plus, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface RemittanceProvider {
  id: string;
  name: string;
  providerCode: string;
  enabled: boolean;
  baseUrl: string;
  authType: string;
  supportedCorridors: string[];
  supportedCurrencies: string[];
  payoutMethods: string[];
  rateLimitPerMin: number;
  createdAt: string;
}

interface RemittanceRoute {
  id: string;
  name: string;
  corridor: string;
  sourceCurrency: string;
  targetCurrency: string;
  providerId: string;
  providerName: string;
  payoutMethod: string;
  feeBps: number;
  fxMarkupBps: number;
  minAmount: string;
  maxAmount: string;
  estimatedMinutes: number;
  enabled: boolean;
}

const PROVIDER_ICONS: Record<string, any> = {
  paymob: CreditCard,
  samsara: Globe,
  khalti: Wallet,
  safepay_raast: Landmark,
  '8b': Banknote,
  hrc_ubl: Landmark,
  habib_metro: Banknote,
};

const METHOD_COLORS: Record<string, string> = {
  bank_transfer: 'bg-blue-100 text-blue-800',
  cash_pickup: 'bg-green-100 text-green-800',
  mobile_wallet: 'bg-purple-100 text-purple-800',
  card: 'bg-orange-100 text-orange-800',
};

const AUTH_TYPE_LABELS: Record<string, string> = {
  oauth2: 'OAuth 2.0',
  apikey: 'API Key',
  hmac: 'HMAC Signature',
  basic: 'Basic Auth',
  otp_token: 'OTP Token',
};

export default function RemittanceOpsPage() {
  const [providers, setProviders] = React.useState<RemittanceProvider[]>([]);
  const [routes, setRoutes] = React.useState<RemittanceRoute[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('providers');
  const [validatingProvider, setValidatingProvider] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [providersRes, routesRes] = await Promise.all([
        api.get('/admin/remittance/providers'),
        api.get('/admin/remittance/routes'),
      ]);
      setProviders(providersRes.data || []);
      setRoutes(routesRes.data || []);
    } catch (err) {
      toast({ title: 'Failed to load remittance data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (id: string, enabled: boolean) => {
    try {
      await api.patch(`/admin/remittance/providers/${id}`, { enabled });
      setProviders(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
      toast({ title: `Provider ${enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed to update provider', variant: 'destructive' });
    }
  };

  const toggleRoute = async (id: string, enabled: boolean) => {
    try {
      await api.patch(`/admin/remittance/routes/${id}`, { enabled });
      setRoutes(prev => prev.map(r => r.id === id ? { ...r, enabled } : r));
      toast({ title: `Route ${enabled ? 'enabled' : 'disabled'}`, variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed to update route', variant: 'destructive' });
    }
  };

  const deleteProvider = async (id: string) => {
    if (!confirm('Delete this provider? All associated routes will be affected.')) return;
    try {
      await api.delete(`/admin/remittance/providers/${id}`);
      setProviders(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Provider deleted', variant: 'success' });
    } catch (err) {
      toast({ title: 'Failed to delete provider', variant: 'destructive' });
    }
  };

  const validateCredentials = async (id: string) => {
    setValidatingProvider(id);
    try {
      const res = await api.post(`/admin/remittance/providers/${id}/validate`);
      toast({ 
        title: res.data.valid ? 'Credentials Valid ✓' : 'Credentials Invalid ✗',
        description: res.data.message,
        variant: res.data.valid ? 'success' : 'destructive',
      });
    } catch (err) {
      toast({ title: 'Validation failed', variant: 'destructive' });
    } finally {
      setValidatingProvider(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Remittance Operations</h1>
          <p className="text-muted-foreground">Manage payout providers, corridors, and routes for remittance disbursements</p>
        </div>
        <Button onClick={() => router.push('/remittance-ops/providers/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Provider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.filter(p => p.enabled).length}</div>
            <p className="text-xs text-muted-foreground">of {providers.length} configured</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routes.filter(r => r.enabled).length}</div>
            <p className="text-xs text-muted-foreground">of {routes.length} configured</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Corridors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(routes.map(r => r.corridor)).size}</div>
            <p className="text-xs text-muted-foreground">unique corridors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payout Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(routes.map(r => r.payoutMethod)).size}</div>
            <p className="text-xs text-muted-foreground">available methods</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {providers.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No providers configured yet</p>
                <Button className="mt-4" onClick={() => router.push('/remittance-ops/providers/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Provider
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {providers.map(provider => {
                const Icon = PROVIDER_ICONS[provider.providerCode] || Globe;
                return (
                  <Card key={provider.id} className={!provider.enabled ? 'opacity-60' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${provider.enabled ? 'bg-felo-purple-100' : 'bg-gray-100'}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{provider.name}</h3>
                              <Badge variant={provider.enabled ? 'default' : 'secondary'}>
                                {provider.enabled ? 'Active' : 'Inactive'}
                              </Badge>
                              <Badge variant="outline">{AUTH_TYPE_LABELS[provider.authType] || provider.authType}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{provider.providerCode}</p>
                            <p className="text-xs text-muted-foreground font-mono">{provider.baseUrl}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {provider.supportedCorridors.map(c => (
                                <Badge key={c} variant="outline" className="text-xs">
                                  <ArrowRightLeft className="mr-1 h-3 w-3" />
                                  {c}
                                </Badge>
                              ))}
                              {provider.payoutMethods.map(m => (
                                <Badge key={m} variant="outline" className={`text-xs ${METHOD_COLORS[m] || ''}`}>
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => validateCredentials(provider.id)}
                            disabled={validatingProvider === provider.id}
                          >
                            {validatingProvider === provider.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Switch
                            checked={provider.enabled}
                            onCheckedChange={(v) => toggleProvider(provider.id, v)}
                          />
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/remittance-ops/providers/${provider.id}`)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteProvider(provider.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          {routes.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No routes configured yet</p>
                <Button className="mt-4" onClick={() => router.push('/remittance-ops/routes/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Route
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Corridor</th>
                    <th className="px-4 py-3 text-left font-medium">Provider</th>
                    <th className="px-4 py-3 text-left font-medium">Method</th>
                    <th className="px-4 py-3 text-left font-medium">Fee</th>
                    <th className="px-4 py-3 text-left font-medium">FX Markup</th>
                    <th className="px-4 py-3 text-left font-medium">Min/Max</th>
                    <th className="px-4 py-3 text-left font-medium">ETA</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map(route => (
                    <tr key={route.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <Badge variant="outline">{route.corridor}</Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {route.sourceCurrency} → {route.targetCurrency}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{route.providerName}</td>
                      <td className="px-4 py-3">
                        <Badge className={METHOD_COLORS[route.payoutMethod] || ''}>
                          {route.payoutMethod}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{(route.feeBps / 100).toFixed(2)}%</td>
                      <td className="px-4 py-3">{(route.fxMarkupBps / 100).toFixed(2)}%</td>
                      <td className="px-4 py-3">{route.minAmount} - {route.maxAmount}</td>
                      <td className="px-4 py-3">{route.estimatedMinutes}m</td>
                      <td className="px-4 py-3">
                        <Switch
                          checked={route.enabled}
                          onCheckedChange={(v) => toggleRoute(route.id, v)}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/remittance-ops/routes/${route.id}`)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>View and manage remittance transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Transaction history will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
