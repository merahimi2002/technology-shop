'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getDb } from '@/lib/db';
import { categorySchema } from '@/lib/admin/product-input';
import type { ProductResult } from '../products/actions';
import { isCategoryImagePath, removeCategoryImage } from '@/lib/category-image';

const identity = categorySchema.extend({
  id: z.string().min(1).max(100),
  imagePath: z.string().refine(isCategoryImagePath).nullable().default(null),
});
export type CategoryResult = ProductResult | 'hasProducts';

export async function updateCategory(input: unknown): Promise<CategoryResult> {
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role)) return 'forbidden';
    const parsed = z
      .object({ previous: identity, data: categorySchema })
      .safeParse(input);
    if (!parsed.success) return 'invalid';
    const changed = await getDb().category.updateMany({
      where: parsed.data.previous,
      data: parsed.data.data,
    });
    if (changed.count !== 1) return 'conflict';
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2002'
    )
      return 'duplicate';
    return 'unavailable';
  }
  revalidatePath('/[locale]/admin/categories', 'layout');
  revalidatePath('/[locale]/admin/products', 'layout');
  return 'saved';
}

export async function deleteCategory(input: unknown): Promise<CategoryResult> {
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role)) return 'forbidden';
    const parsed = identity.safeParse(input);
    if (!parsed.success) return 'invalid';
    const db = getDb();
    const current = await db.category.findUnique({
      where: { id: parsed.data.id },
      select: { imagePath: true },
    });
    // The foreign key also protects against a product being added during deletion.
    const changed = await db.category.deleteMany({
      where: { ...parsed.data, products: { none: {} } },
    });
    if (changed.count !== 1) {
      const category = await db.category.findUnique({
        where: { id: parsed.data.id },
        include: { _count: { select: { products: true } } },
      });
      return category?._count.products ? 'hasProducts' : 'conflict';
    }
    if (current?.imagePath) await removeCategoryImage(current.imagePath);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      error.code === 'P2003'
    )
      return 'hasProducts';
    return 'unavailable';
  }
  revalidatePath('/[locale]/admin/categories', 'layout');
  revalidatePath('/[locale]/admin/products', 'layout');
  return 'saved';
}
