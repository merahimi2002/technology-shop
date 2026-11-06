import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function main() {
  if (
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes('YOUR-PASSWORD')
  ) {
    console.error('DATABASE_URL is not configured. Complete .env.local first.');
    process.exitCode = 1;
    return;
  }
  // Import after loading the same env files as Next.js.
  const { getDb } = await import('../lib/db');
  const db = getDb();
  try {
    const result = await db.$queryRaw<{ ok: number }[]>`SELECT 1::int AS ok`;
    if (result[0]?.ok !== 1) throw new Error('Unexpected database response.');
    console.info('Database connection: OK (Prisma / PostgreSQL).');
  } finally {
    await db.$disconnect();
  }
}

main().catch(() => {
  // Driver errors may contain credentials. Do not print the original error.
  console.error(
    'Database connection failed. Check local env, TLS, and network access.',
  );
  process.exitCode = 1;
});
