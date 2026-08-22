/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', '@prisma/adapter-pg', 'pg'],
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  },
  // Transpile packages in monorepo
  transpilePackages: [
    '@greed-advisor/auth',
    '@greed-advisor/db',
    '@greed-advisor/middleware',
    '@greed-advisor/rate-limit',
    '@greed-advisor/utils',
    '@greed-advisor/validations',
    '@greed-advisor/trading212',
    '@greed-advisor/alpaca',
    '@greed-advisor/market-data',
    '@greed-advisor/ai'
  ]
};

module.exports = nextConfig;
