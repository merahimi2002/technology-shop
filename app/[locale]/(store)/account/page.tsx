import { Suspense } from 'react';
import { AccountPanel } from '@/components/store/account-panel';

export default function AccountPage() {
  const recoveryEnabled = Boolean(
    process.env.RESEND_API_KEY?.trim() &&
    process.env.RECOVERY_EMAIL_FROM?.trim() &&
    process.env.NEXTAUTH_URL?.trim(),
  );
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-start px-4 py-6 sm:px-8 sm:py-10 md:items-center">
      <Suspense>
        <AccountPanel recoveryEnabled={recoveryEnabled} />
      </Suspense>
    </main>
  );
}
