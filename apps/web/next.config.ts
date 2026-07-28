import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow subdomains in dev (HMR & dev resources)
  allowedDevOrigins: ['*.lvh.me:3000', 'lvh.me:3000', 'localhost:3000', '*.lvh.me', 'lvh.me'],

  // Allow images from the API and Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'http',
        hostname: '**.lvh.me',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
