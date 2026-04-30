/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.gravatar.com' },
      { protocol: 'https', hostname: '**.auth0.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    ADMIN_API_BASE: process.env.ADMIN_API_BASE || 'http://localhost:3001',
    WEBAUTHN_RP_NAME: process.env.WEBAUTHN_RP_NAME || 'FELO Ops Portal',
    WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || 'localhost',
  },
};

module.exports = nextConfig;
