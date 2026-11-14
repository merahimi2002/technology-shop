import { AccountPanel } from '@/components/store/account-panel';

export default function AccountPage() {
  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 items-start px-4 py-6 sm:px-8 sm:py-10 md:items-center">
      <AccountPanel />
    </main>
  );
}
