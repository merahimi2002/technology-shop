import type { UserRole } from '@/generated/prisma/enums';

export function canAccessAdmin(role: UserRole) {
  return role === 'ADMIN' || role === 'OWNER';
}
