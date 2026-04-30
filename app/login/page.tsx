'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { registerCredential, authenticateCredential, saveSession } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';
import { Shield, Fingerprint, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [mode, setMode] = React.useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await authenticateCredential();
      if (result.success && result.token) {
        saveSession({
          userId: 'admin-1',
          email: email || 'admin@felo.io',
          displayName: 'Admin User',
          role: 'super_admin',
          token: result.token,
          expiresAt: Date.now() + 86400000,
        });
        toast({ title: 'Welcome back', variant: 'success' });
        router.push('/dashboard');
      } else {
        toast({ title: 'Authentication failed', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Authentication failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email) {
      toast({ title: 'Email required', description: 'Please enter your admin email', variant: 'warning' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await registerCredential(email);
      if (result.success && result.credentialId) {
        toast({
          title: 'Credential registered',
          description: 'You can now log in with WebAuthn',
          variant: 'success',
        });
        setMode('login');
      } else {
        toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Registration failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-felo-warm-50 p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-felo-sage-600 text-white shadow-lg">
            <Shield className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">FELO Ops Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Internal operations dashboard</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{mode === 'login' ? 'Sign In' : 'Register Credential'}</CardTitle>
            <CardDescription>
              {mode === 'login'
                ? 'Authenticate with your WebAuthn credential'
                : 'Register a new WebAuthn credential for your device'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@felo.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={mode === 'login' ? handleLogin : handleRegister}
              loading={isLoading}
            >
              <Fingerprint className="mr-2 h-5 w-5" />
              {mode === 'login' ? 'Authenticate with Passkey' : 'Register Passkey'}
            </Button>

            {mode === 'login' && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => {
                  saveSession({
                    userId: 'admin-1',
                    email: 'admin@felo.io',
                    displayName: 'Admin User',
                    role: 'super_admin',
                    token: 'mock-token',
                    expiresAt: Date.now() + 86400000,
                  });
                  toast({ title: 'Dev login successful', variant: 'success' });
                  router.push('/dashboard');
                }}
              >
                <Lock className="mr-2 h-4 w-4" />
                Dev Bypass (Mock)
              </Button>
            )}

            <div className="text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-sm text-primary hover:underline"
              >
                {mode === 'login' ? 'Register new credential' : 'Back to sign in'}
              </button>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Secured with WebAuthn. No passwords stored.
        </p>
      </div>
    </div>
  );
}
