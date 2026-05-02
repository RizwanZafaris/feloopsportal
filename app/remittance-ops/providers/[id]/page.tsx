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
import { ArrowLeft, Save, AlertTriangle, Globe, CreditCard, Wallet, Landmark, Banknote, Shield } from 'lucide-react';

const PROVIDER_TYPES = [
  { code: 'paymob', name: 'Paymob Payouts', region: 'Egypt', icon: CreditCard },
  { code: 'samsara', name: 'Samsara Remit', region: 'Malaysia', icon: Globe },
  { code: 'khalti', name: 'Khalti Wallet', region: 'Nepal', icon: Wallet },
  { code: 'safepay_raast', name: 'Safepay RAAST', region: 'Pakistan', icon: Landmark },
  { code: '8b', name: '8B Payout', region: 'Uzbekistan/Kazakhstan', icon: Banknote },
  { code: 'hrc_ubl', name: 'HRC (UBL)', region: 'Pakistan', icon: Landmark },
  { code: 'habib_metro', name: 'HabibMetro', region: 'Pakistan', icon: Banknote },
];

const AUTH_TYPES = [
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'apikey', label: 'API Key' },
  { value: 'hmac', label: 'HMAC Signature' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'otp_token', label: 'OTP Token' },
];

const PAYOUT_METHODS = [
  'bank_transfer',
  'cash_pickup',
  'mobile_wallet',
  'card',
];

interface ProviderFormData {
  name: string;
  providerCode: string;
  baseUrl: string;
  authType: string;
  enabled: boolean;
  credentials: Record<string, string>;
  supportedCorridors: string[];
  supportedCurrencies: string[];
  payoutMethods: string[];
  rateLimitPerMin: number;
  ipWhitelist: string[];
}

const DEFAULT_CREDENTIALS: Record<string, Record<string, string>> = {
  paymob: { clientId: '', clientSecret: '' },
  samsara: { appId: '', appSecret: '' },
  khalti: { apiKey: '' },
  safepay_raast: { secretKey: '', aggregatorId: '' },
  '8b': { serviceId: '', secretKey: '' },
  hrc_ubl: { custLoginId: '', custPassword: '', authenCode: '' },
  habib_metro: { companyId: '', agentId: '', companyName: '', preVerifiedToken: '' },
};

const DEFAULT_URLS: Record<string, string> = {
  paymob: 'https://stagingpayouts.paymobsolutions.com/api/secure/',
  samsara: 'https://uatsamsara.iremit.com.my/SendApi/api/webservice/',
  khalti: 'https://a.khalti.com/api/v2/',
  safepay_raast: 'https://api.getsafepay.com/raastwire',
  '8b': 'https://secure-test.8b.world/',
  hrc_ubl: 'https://dpgwtdl.ubl.com.pk/tdl/sandbox/',
  habib_metro: 'https://api.habibmetro.com/',
};

export default function ProviderFormPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id as string;
  const isNew = providerId === 'new';

  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<ProviderFormData>({
    name: '',
    providerCode: '',
    baseUrl: '',
    authType: 'oauth2',
    enabled: true,
    credentials: {},
    supportedCorridors: [],
    supportedCurrencies: [],
    payoutMethods: [],
    rateLimitPerMin: 60,
    ipWhitelist: [],
  });

  React.useEffect(() => {
    if (!isNew) {
      loadProvider();
    }
  }, [providerId]);

  const loadProvider = async () => {
    try {
      const res = await api.get(`/admin/remittance/providers/${providerId}`);
      setForm({
        ...res.data,
        credentials: res.data.credentials || {},
        supportedCorridors: res.data.supportedCorridors || [],
        supportedCurrencies: res.data.supportedCurrencies || [],
        payoutMethods: res.data.payoutMethods || [],
        ipWhitelist: res.data.ipWhitelist || [],
      });
    } catch (err) {
      toast({ title: 'Failed to load provider', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleProviderTypeChange = (code: string) => {
    const provider = PROVIDER_TYPES.find(p => p.code === code);
    if (provider) {
      setForm(prev => ({
        ...prev,
        providerCode: code,
        name: provider.name,
        baseUrl: DEFAULT_URLS[code] || '',
        credentials: DEFAULT_CREDENTIALS[code] || {},
        authType: code === 'paymob' ? 'oauth2' : 
                  code === 'khalti' ? 'apikey' : 
                  code === 'safepay_raast' ? 'apikey' :
                  code === 'habib_metro' ? 'otp_token' : 'hmac',
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        await api.post('/admin/remittance/providers', form);
        toast({ title: 'Provider created successfully', variant: 'success' });
      } else {
        await api.put(`/admin/remittance/providers/${providerId}`, form);
        toast({ title: 'Provider updated successfully', variant: 'success' });
      }
      router.push('/remittance-ops');
    } catch (err: any) {
      toast({ title: err.response?.data?.message || 'Failed to save provider', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateCredential = (key: string, value: string) => {
    setForm(prev => ({
      ...prev,
      credentials: { ...prev.credentials, [key]: value },
    }));
  };

  const toggleArrayItem = (field: keyof ProviderFormData, item: string) => {
    setForm(prev => {
      const arr = [...(prev[field] as string[])];
      const idx = arr.indexOf(item);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(item);
      return { ...prev, [field]: arr };
    });
  };

  const renderCredentialFields = () => {
    switch (form.providerCode) {
      case 'paymob':
        return (
          <>
            <div className="space-y-2">
              <Label>Client ID</Label>
              <Input type="password" value={form.credentials.clientId || ''} onChange={e => updateCredential('clientId', e.target.value)} placeholder="X8Ce824zp0uyfQO1txZzkvOGlrZP8o3JMXIGbJls" />
            </div>
            <div className="space-y-2">
              <Label>Client Secret</Label>
              <Input type="password" value={form.credentials.clientSecret || ''} onChange={e => updateCredential('clientSecret', e.target.value)} placeholder="P05F9iDz1BcIW28wfd3MwIrHNbmUfS5SxA9ETd3LZcEWIZ1XZgdcCyc5ID6KKhi7y2kRoPIK5SOTs57a87JHMwyhZTtiw7Sshe2kjZH0Sz6Hs36VzXG5gN2c4qjcQioq" />
            </div>
          </>
        );
      case 'samsara':
        return (
          <>
            <div className="space-y-2">
              <Label>App ID</Label>
              <Input value={form.credentials.appId || ''} onChange={e => updateCredential('appId', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>App Secret (HMAC Key)</Label>
              <Input type="password" value={form.credentials.appSecret || ''} onChange={e => updateCredential('appSecret', e.target.value)} />
            </div>
          </>
        );
      case 'khalti':
        return (
          <div className="space-y-2">
            <Label>API Key</Label>
            <Input type="password" value={form.credentials.apiKey || ''} onChange={e => updateCredential('apiKey', e.target.value)} placeholder="6184d776a2ed45d3baef3f119025205b" />
          </div>
        );
      case 'safepay_raast':
        return (
          <>
            <div className="space-y-2">
              <Label>Aggregator Secret Key</Label>
              <Input type="password" value={form.credentials.secretKey || ''} onChange={e => updateCredential('secretKey', e.target.value)} placeholder="18108aad30da06075e6f02fab3166926827538363842185faf6e3e694ea5d481" />
            </div>
            <div className="space-y-2">
              <Label>Aggregator ID</Label>
              <Input value={form.credentials.aggregatorId || ''} onChange={e => updateCredential('aggregatorId', e.target.value)} placeholder="agg_2288490a-2176-4de5-b373-0ffb6f8e2e6e" />
            </div>
          </>
        );
      case '8b':
        return (
          <>
            <div className="space-y-2">
              <Label>Service ID</Label>
              <Input value={form.credentials.serviceId || ''} onChange={e => updateCredential('serviceId', e.target.value)} placeholder="2044 (UZS) or 2043 (KZT)" />
            </div>
            <div className="space-y-2">
              <Label>Secret Key (HMAC)</Label>
              <Input type="password" value={form.credentials.secretKey || ''} onChange={e => updateCredential('secretKey', e.target.value)} placeholder="8WfjIEmzwk6P5GSX0N75" />
            </div>
          </>
        );
      case 'hrc_ubl':
        return (
          <>
            <div className="space-y-2">
              <Label>Cust Login ID</Label>
              <Input value={form.credentials.custLoginId || ''} onChange={e => updateCredential('custLoginId', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cust Password</Label>
              <Input type="password" value={form.credentials.custPassword || ''} onChange={e => updateCredential('custPassword', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Authentication Code</Label>
              <Input type="password" value={form.credentials.authenCode || ''} onChange={e => updateCredential('authenCode', e.target.value)} />
            </div>
          </>
        );
      case 'habib_metro':
        return (
          <>
            <div className="space-y-2">
              <Label>Company ID</Label>
              <Input value={form.credentials.companyId || ''} onChange={e => updateCredential('companyId', e.target.value)} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label>Agent ID</Label>
              <Input value={form.credentials.agentId || ''} onChange={e => updateCredential('agentId', e.target.value)} placeholder="2" />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={form.credentials.companyName || ''} onChange={e => updateCredential('companyName', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Pre-Verified Token (optional)</Label>
              <Input type="password" value={form.credentials.preVerifiedToken || ''} onChange={e => updateCredential('preVerifiedToken', e.target.value)} placeholder="Leave empty to use OTP flow" />
            </div>
          </>
        );
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Select a provider type to see credential fields
          </div>
        );
    }
  };

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
          {isNew ? 'Add Provider' : 'Edit Provider'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
          <CardDescription>
            Configure payout provider credentials and settings. All credentials are encrypted at rest.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isNew && (
            <div className="space-y-2">
              <Label>Provider Type</Label>
              <Select onValueChange={handleProviderTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider type" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map(p => (
                    <SelectItem key={p.code} value={p.code}>
                      <div className="flex items-center gap-2">
                        <p.icon className="h-4 w-4" />
                        {p.name}
                        <Badge variant="outline" className="ml-2">{p.region}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input value={form.baseUrl} onChange={e => setForm(prev => ({ ...prev, baseUrl: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Auth Type</Label>
            <Select value={form.authType} onValueChange={v => setForm(prev => ({ ...prev, authType: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_TYPES.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-felo-purple-600" />
              <h3 className="font-semibold">Credentials</h3>
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Encrypted at rest
              </Badge>
            </div>
            <div className="space-y-4">
              {renderCredentialFields()}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold">Supported Corridors</h3>
            <div className="flex flex-wrap gap-2">
              {['AE-PK', 'AE-BD', 'AE-NP', 'AE-EG', 'SA-PK', 'SA-BD', 'US-PK', 'GB-BD', 'AE-UZ', 'AE-KZ'].map(c => (
                <Badge
                  key={c}
                  variant={form.supportedCorridors.includes(c) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('supportedCorridors', c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Add custom corridor (e.g. AE-MY)"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val && !form.supportedCorridors.includes(val)) {
                    setForm(prev => ({ ...prev, supportedCorridors: [...prev.supportedCorridors, val] }));
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Supported Currencies</h3>
            <div className="flex flex-wrap gap-2">
              {['AED', 'PKR', 'BDT', 'NPR', 'EGP', 'MYR', 'UZS', 'KZT', 'USD', 'GBP', 'SAR'].map(c => (
                <Badge
                  key={c}
                  variant={form.supportedCurrencies.includes(c) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('supportedCurrencies', c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Payout Methods</h3>
            <div className="flex flex-wrap gap-2">
              {PAYOUT_METHODS.map(m => (
                <Badge
                  key={m}
                  variant={form.payoutMethods.includes(m) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleArrayItem('payoutMethods', m)}
                >
                  {m}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rate Limit (requests/minute)</Label>
            <Input type="number" value={form.rateLimitPerMin} onChange={e => setForm(prev => ({ ...prev, rateLimitPerMin: parseInt(e.target.value) || 60 }))} />
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
              {saving ? 'Saving...' : 'Save Provider'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
