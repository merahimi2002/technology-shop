'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getDb } from '@/lib/db';
import { categorySchema } from '@/lib/admin/product-input';
import {
  CategoryImageError,
  encodeCategoryImage,
  uploadCategoryImage,
  removeCategoryImage,
  isCategoryImagePath,
} from '@/lib/category-image';

const previousSchema = categorySchema.extend({
  id: z.string().min(1).max(100),
  imagePath: z.string().refine(isCategoryImagePath).nullable().default(null),
});
export type CategoryImageResult =
  | 'saved'
  | 'forbidden'
  | 'invalid'
  | 'invalidImage'
  | 'storageUnavailable'
  | 'conflict'
  | 'duplicate'
  | 'unavailable';

export async function saveCategoryWithImage(
  previous: unknown,
  form: FormData,
): Promise<CategoryImageResult> {
  let uploaded: string | undefined;
  let oldImage: string | null = null;
  let committed = false;
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role)) return 'forbidden';
    const data = categorySchema.safeParse(Object.fromEntries(form));
    const before =
      previous === null ? null : previousSchema.safeParse(previous);
    if (!data.success || (before && !before.success)) return 'invalid';
    const snapshot = before?.success ? before.data : null;
    const db = getDb();
    if (snapshot) {
      const current = await db.category.findUnique({
        where: { id: snapshot.id },
      });
      if (
        !current ||
        current.nameFa !== snapshot.nameFa ||
        current.nameEn !== snapshot.nameEn ||
        current.slug !== snapshot.slug ||
        current.imagePath !== snapshot.imagePath
      )
        return 'conflict';
      oldImage = current.imagePath;
    }
    const file = form.get('image');
    if (file !== null && !(file instanceof File)) return 'invalidImage';
    if (file instanceof File && file.size) {
      uploaded = await uploadCategoryImage(await encodeCategoryImage(file));
    }
    const imagePath =
      uploaded ?? (form.get('removeImage') === 'true' ? null : oldImage);
    if (snapshot) {
      const changed = await db.category.updateMany({
        where: snapshot,
        data: { ...data.data, imagePath },
      });
      if (changed.count !== 1) {
        if (uploaded) await removeCategoryImage(uploaded);
        return 'conflict';
      }
    } else await db.category.create({ data: { ...data.data, imagePath } });
    committed = true;
    // Cleanup is best effort; only server-loaded, formerly referenced objects are removed.
    if (oldImage && oldImage !== imagePath) await removeCategoryImage(oldImage);
  } catch (error) {
    if (uploaded && !committed) await removeCategoryImage(uploaded);
    if (error instanceof CategoryImageError) return error.reason;
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
