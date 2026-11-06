import { expect, it, vi } from 'vitest';
import type { UserRole } from '../generated/prisma/enums';
vi.mock('server-only', () => ({}));
import { canManageUserRole } from '../lib/auth/authorization';

const roles: UserRole[] = ['CUSTOMER', 'ADMIN', 'OWNER'];

it.each(['CUSTOMER', 'ADMIN'] as UserRole[])(
  'prevents %s from changing any role',
  (actor) => {
    for (const target of roles)
      for (const next of roles) {
        expect(canManageUserRole(actor, target, next)).toBe(false);
      }
  },
);

it('allows the owner to manage multiple admins while excluding ownership changes', () => {
  expect(canManageUserRole('OWNER', 'CUSTOMER', 'ADMIN')).toBe(true);
  expect(canManageUserRole('OWNER', 'ADMIN', 'CUSTOMER')).toBe(true);
  expect(canManageUserRole('OWNER', 'ADMIN', 'ADMIN')).toBe(true);
  for (const role of roles) {
    expect(canManageUserRole('OWNER', role, 'OWNER')).toBe(false);
    expect(canManageUserRole('OWNER', 'OWNER', role)).toBe(false);
  }
});
