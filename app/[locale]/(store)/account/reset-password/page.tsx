import { PasswordRecovery } from '@/components/store/password-recovery';

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-8">
      <PasswordRecovery reset />
    </main>
  );
}
