import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let client: PrismaClient | undefined;

export function getDb(): PrismaClient {
  if (client) return client;
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for database operations.');
  }

  const url = new URL(connectionString);
  if (url.searchParams.get('sslmode') !== 'verify-full') {
    throw new Error('DATABASE_URL must use sslmode=verify-full.');
  }

  client = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    }),
    // Avoid including query parameters or connection details in logs.
    errorFormat: 'minimal',
    log: [],
  });

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
  return client;
}
