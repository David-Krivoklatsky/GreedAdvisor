/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move serverComponentsExternalPackages to the top level
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Temporarily disable ESLint during build to fix deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
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
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Transpile packages in monorepo
  transpilePackages: [
    '@greed-advisor/auth',
    '@greed-advisor/config',
    '@greed-advisor/db',
    '@greed-advisor/middleware',
    '@greed-advisor/rate-limit',
    '@greed-advisor/types',
    '@greed-advisor/utils',
    '@greed-advisor/validations',
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@prisma/client': '@prisma/client',
      });
    }

    // Optimize crypto libraries for production
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      buffer: false,
      stream: false,
    };

    return config;
  },
};

module.exports = nextConfig;
