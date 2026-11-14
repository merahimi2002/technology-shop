import type { ReactNode } from 'react';
import { Asterisk } from 'lucide-react';

export function RequiredFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      {children}
      <Asterisk aria-hidden="true" className="size-3 self-center text-primary" />
    </span>
  );
}
