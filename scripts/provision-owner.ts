import { loadEnvConfig } from '@next/env';
import { registerSchema } from '../lib/auth/validation';
import { hashPassword, verifyPassword } from '../lib/auth/password';

loadEnvConfig(process.cwd());

async function main() {
  const input = registerSchema.safeParse({
    name: 'Owner',
    email: process.env.OWNER_EMAIL,
    password: process.env.OWNER_PASSWORD,
  });
  if (!input.success) {
    console.error(
      'Configure valid OWNER_EMAIL and OWNER_PASSWORD (8–128 characters) in local env.',
    );
    process.exitCode = 1;
    return;
  }
  const { email, password } = input.data;
  const { getDb } = await import('../lib/db');
  const db = getDb();
  try {
    const owner = await db.user.findFirst({ where: { role: 'OWNER' } });
    const existing = await db.user.findUnique({ where: { email } });
    if (owner && owner.email !== email) throw new Error('OWNER_EXISTS');
    if (
      existing &&
      (existing.disabledAt ||
        !(await verifyPassword(password, existing.passwordHash)))
    ) {
      throw new Error('EXISTING_ACCOUNT_NOT_VERIFIED');
    }
    console.info('Owner preflight: OK. No credentials were printed.');
    if (process.argv.includes('--check')) return;

    const passwordHash = existing ? undefined : await hashPassword(password);
    const result = await db.$transaction(
      async (tx) => {
        // Serialize provisioning attempts; the unique index also guards other writers.
        await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(76910243)`;
        const currentOwner = await tx.user.findFirst({
          where: { role: 'OWNER' },
        });
        if (currentOwner) {
          if (
            currentOwner.email !== email ||
            currentOwner.disabledAt ||
            !(await verifyPassword(password, currentOwner.passwordHash))
          ) {
            throw new Error('OWNER_EXISTS');
          }
          return {
            id: currentOwner.id,
            action: 'already exists; credentials verified',
          };
        }
        const current = await tx.user.findUnique({ where: { email } });
        if (current) {
          if (
            current.disabledAt ||
            !(await verifyPassword(password, current.passwordHash))
          ) {
            throw new Error('EXISTING_ACCOUNT_NOT_VERIFIED');
          }
          const promoted = await tx.user.update({
            where: { id: current.id },
            data: { role: 'OWNER', sessionVersion: { increment: 1 } },
          });
          return {
            id: promoted.id,
            action:
              'existing verified account promoted; old sessions invalidated',
          };
        }
        if (!passwordHash) throw new Error('ACCOUNT_CHANGED');
        const created = await tx.user.create({
          data: { email, passwordHash, role: 'OWNER' },
        });
        return { id: created.id, action: 'created' };
      },
      { isolationLevel: 'Serializable', timeout: 15_000, maxWait: 10_000 },
    );

    const saved = await db.user.findUniqueOrThrow({ where: { id: result.id } });
    if (
      saved.role !== 'OWNER' ||
      saved.disabledAt ||
      !(await verifyPassword(password, saved.passwordHash)) ||
      (await db.user.count({ where: { role: 'OWNER' } })) !== 1
    ) {
      throw new Error('VERIFICATION_FAILED');
    }
    console.info(`Owner account: ${result.action}.`);
    console.info(
      'Verified: exactly one OWNER, active account, matching password hash.',
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  const safeMessages: Record<string, string> = {
    OWNER_EXISTS:
      'A different owner already exists. No ownership or credentials were overwritten.',
    EXISTING_ACCOUNT_NOT_VERIFIED:
      'The existing account is disabled or its password does not match. No account was overwritten.',
    ACCOUNT_CHANGED:
      'Account state changed during provisioning. Rerun after reviewing it.',
    VERIFICATION_FAILED:
      'Owner verification failed. Review account state before retrying.',
  };
  console.error(
    error instanceof Error && safeMessages[error.message]
      ? safeMessages[error.message]
      : 'Owner provisioning failed. No credentials or raw database errors were printed.',
  );
  process.exitCode = 1;
});
