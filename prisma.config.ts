import { loadEnvConfig } from '@next/env';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

loadEnvConfig(process.cwd());

function migrationUrl() {
  const value = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!value) return undefined;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Invalid database URL in local environment.');
  }
  if (url.searchParams.get('sslmode') !== 'verify-full') {
    throw new Error('Migration database URL must use sslmode=verify-full.');
  }

  // The CLI schema engine uses different TLS options from node-postgres.
  const ca = url.searchParams.get('sslrootcert');
  if (ca) url.searchParams.set('sslcert', resolve(ca));
  url.searchParams.delete('sslrootcert');
  url.searchParams.set('sslmode', 'require');
  url.searchParams.set('sslaccept', 'strict');
  return url.toString();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Session pooling is the IPv4 fallback for CLI operations too.
    url: migrationUrl(),
  },
});
