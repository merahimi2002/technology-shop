import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // The database CA path comes from DATABASE_URL and cannot be traced statically.
  outputFileTracingIncludes: {
    '/*': ['./certs/supabase-prod-ca-2021.crt'],
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
