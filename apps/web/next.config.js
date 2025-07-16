/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now the default in Next.js 14
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Output for Vercel
  output: 'standalone',
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
    return config;
  },
};

module.exports = nextConfig;
