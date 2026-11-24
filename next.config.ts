import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Bundle the Prisma runtime to avoid Turbopack's unresolved external alias.
  transpilePackages: ['@prisma/client'],
  // The database CA path comes from DATABASE_URL and cannot be traced statically.
  outputFileTracingIncludes: {
    '/*': ['./certs/supabase-prod-ca-2021.crt'],
  },
  experimental: {
    agentFeedback: true,
    serverActions: { bodySizeLimit: '3mb' },
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
