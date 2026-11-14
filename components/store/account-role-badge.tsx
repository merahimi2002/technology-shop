'use client';

import type { Session } from 'next-auth';
import { useTranslations } from 'next-intl';

export function AccountRoleBadge({
  role,
}: {
  role: NonNullable<Session['user']>['role'];
}) {
  const t = useTranslations('account');
  return (
    <span className="badge badge-soft badge-primary w-fit">
      {t('roleLabel', { role: t(`roles.${role}`) })}
    </span>
  );
}
