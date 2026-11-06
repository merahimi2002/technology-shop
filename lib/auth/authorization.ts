import 'server-only';
import type { UserRole } from '@/generated/prisma/enums';

// Call only with roles read from the database-backed server session.
// OWNER provisioning/recovery is deliberately excluded from application APIs.
export function canManageUserRole(
  actorRole: UserRole,
  targetRole: UserRole,
  nextRole: UserRole,
): boolean {
  return (
    actorRole === 'OWNER' && targetRole !== 'OWNER' && nextRole !== 'OWNER'
  );
}
