'use client';

import type { Session } from 'next-auth';
import { useTranslations } from 'next-intl';

export function AccountRoleBadge({
  role,
  showLabel = true,
}: {
  role: NonNullable<Session['user']>['role'];
  showLabel?: boolean;
}) {
  const t = useTranslations('account');
  return (
    <span
      className={`badge w-fit ${
        role === 'OWNER'
          ? 'border-0 bg-linear-to-r from-primary to-secondary text-primary-content'
          : role === 'ADMIN'
            ? 'badge-soft badge-primary'
            : 'badge-soft badge-info'
      }`}
    >
      {showLabel
        ? t('roleLabel', { role: t(`roles.${role}`) })
        : t(`roles.${role}`)}
    </span>
  );
}
