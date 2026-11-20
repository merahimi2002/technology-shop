'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { canManageUserRole } from '@/lib/auth/authorization';
import { getCurrentUser } from '@/lib/auth/session';
import { getDb } from '@/lib/db';

type Result =
  'saved' | 'forbidden' | 'invalid' | 'conflict' | 'unavailable' | 'hasOrders';

const changes = z.object({
  id: z.string().min(1).max(128),
  version: z.iso.datetime(),
  role: z.enum(['CUSTOMER', 'ADMIN']),
  status: z.enum(['active', 'disabled']),
});

export async function updateUser(
  id: string,
  version: string,
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  try {
    const actor = await getCurrentUser();
    if (actor?.role !== 'OWNER' || id === actor.id) return 'forbidden';

    const parsed = changes.safeParse({
      id,
      version,
      role: form.get('role'),
      status: form.get('status'),
    });
    if (!parsed.success) return 'invalid';
    const { role, status } = parsed.data;

    const users = getDb().user;
    const target = await users.findUnique({
      where: { id },
      select: { role: true, disabledAt: true, updatedAt: true },
    });
    if (!target || !canManageUserRole(actor.role, target.role, role))
      return 'forbidden';
    if (target.updatedAt.toISOString() !== parsed.data.version)
      return 'conflict';

    const disable = status === 'disabled';
    if (role !== target.role || disable !== Boolean(target.disabledAt)) {
      const result = await users.updateMany({
        where: { id, role: target.role, updatedAt: target.updatedAt },
        data: {
          role,
          disabledAt: disable ? (target.disabledAt ?? new Date()) : null,
          sessionVersion: { increment: 1 },
        },
      });
      if (result.count !== 1) return 'conflict';
    }
  } catch {
    return 'unavailable';
  }
  refresh();
  return 'saved';
}

export async function deleteUser(
  id: string,
  version: string,
  _previous: Result | null,
  form: FormData,
): Promise<Result> {
  try {
    const actor = await getCurrentUser();
    if (actor?.role !== 'OWNER' || id === actor.id) return 'forbidden';
    const parsed = changes
      .pick({ id: true, version: true })
      .safeParse({ id, version });
    if (!parsed.success || form.get('confirmation') !== 'delete')
      return 'invalid';
    const users = getDb().user;
    const target = await users.findUnique({
      where: { id },
      select: { role: true, updatedAt: true },
    });
    if (!target || !canManageUserRole(actor.role, target.role, target.role))
      return 'forbidden';
    if (target.updatedAt.toISOString() !== parsed.data.version)
      return 'conflict';
    const result = await users.deleteMany({
      where: { id, role: target.role, updatedAt: target.updatedAt },
    });
    if (result.count !== 1) return 'conflict';
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2003'
    )
      return 'hasOrders';
    return 'unavailable';
  }
  refresh();
  return 'saved';
}
