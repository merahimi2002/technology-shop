import 'server-only';

import { notFound, redirect } from 'next/navigation';
import { canAccessAdmin } from './admin-access';
import { getCurrentUser } from './session';

export async function requireAdminUser(locale: string, section = '') {
  if (locale !== 'fa' && locale !== 'en') notFound();

  const user = await getCurrentUser();
  const accountPath = `/${locale}/account`;
  if (!user) {
    const query = new URLSearchParams({
      callbackUrl: `/${locale}/admin${section}`,
    });
    redirect(`${accountPath}?${query}`);
  }
  if (!canAccessAdmin(user.role)) redirect(accountPath);
  return user;
}
