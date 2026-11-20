'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { canAccessAdmin } from '@/lib/auth/admin-access';
import { getDb } from '@/lib/db';
import { isThemeSelection } from '@/lib/site-theme';
export async function saveSiteThemes(
  themes: unknown,
): Promise<'saved' | 'error'> {
  try {
    const actor = await getCurrentUser();
    if (!actor || !canAccessAdmin(actor.role) || !isThemeSelection(themes))
      return 'error';
    await getDb().siteSettings.upsert({
      where: { id: 'site' },
      create: { id: 'site', themes },
      update: { themes },
    });
  } catch {
    return 'error';
  }
  revalidatePath('/', 'layout');
  return 'saved';
}
