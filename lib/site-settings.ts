import 'server-only';
import { cache } from 'react';
import { connection } from 'next/server';
import { getDb } from '@/lib/db';
import { DEFAULT_SITE_THEMES, isThemeSelection } from '@/lib/site-theme';
export const getSiteThemes = cache(async () => {
  await connection();
  const settings = await getDb().siteSettings.findUnique({
    where: { id: 'site' },
    select: { themes: true },
  });
  return isThemeSelection(settings?.themes)
    ? settings.themes
    : DEFAULT_SITE_THEMES;
});
