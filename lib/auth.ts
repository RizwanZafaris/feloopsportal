// ─── WebAuthn Helpers ──────────────────────────────────────────────

const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'FELO Ops Portal';
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';

/**
 * Generate a random challenge for WebAuthn
 */
export function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Base64URL encode
 */
function base64urlEncode(buffer: ArrayBuffer): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Base64URL decode
 */
function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  return new Uint8Array(binary.split('').map((c) => c.charCodeAt(0)));
}

/**
 * Register a new WebAuthn credential
 */
export async function registerCredential(email: string): Promise<{
  success: boolean;
  credentialId?: string;
  error?: string;
}> {
  try {
    const challenge = generateChallenge();

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: { name: RP_NAME, id: RP_ID },
      user: {
        id: new TextEncoder().encode(email),
        name: email,
        displayName: email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      attestation: 'none',
      timeout: 60000,
    };

    const credential = await navigator.credentials.create({ publicKey: publicKeyOptions });
    if (!credential) {
      return { success: false, error: 'Credential creation was cancelled' };
    }

    const credId = base64urlEncode(credential.rawId);
    return { success: true, credentialId: credId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during registration';
    return { success: false, error: message };
  }
}

/**
 * Authenticate with a WebAuthn credential
 */
export async function authenticateCredential(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  try {
    const challenge = generateChallenge();

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: RP_ID,
      userVerification: 'required',
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
    if (!assertion) {
      return { success: false, error: 'Authentication was cancelled' };
    }

    // In production, the assertion would be sent to the server for verification
    // For now, we generate a mock JWT token
    const mockToken = generateMockToken();
    return { success: true, token: mockToken };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during authentication';
    return { success: false, error: message };
  }
}

/**
 * Generate a mock JWT token for development
 */
function generateMockToken(): string {
  const header = base64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'none', typ: 'JWT' })));
  const payload = base64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({
        sub: 'admin-1',
        email: 'admin@felo.io',
        role: 'super_admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      })
    )
  );
  return `${header}.${payload}.`;
}

// ─── Session Management ────────────────────────────────────────────

const SESSION_KEY = 'felo_admin_session';

export interface AdminSession {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  token: string;
  expiresAt: number;
}

export function saveSession(session: AdminSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AdminSession;
    if (session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const session = getSession();
  return {
    'Content-Type': 'application/json',
    'x-admin-token': session?.token || '',
  };
}
