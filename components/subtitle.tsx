'use client';

import { useRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useTextReveal } from '@/hooks/use-text-reveal';

type SubtitleProps = ComponentPropsWithoutRef<'p'> & {
  icon: ReactNode;
  active?: boolean;
  delay?: number;
};

export function Subtitle({
  icon,
  children,
  className,
  active = true,
  delay = 0,
  ...props
}: SubtitleProps) {
  const root = useRef<HTMLParagraphElement>(null);
  useTextReveal(root, { active, delay, children, mode: 'special' });
  return (
    <p
      ref={root}
      className={cn(
        'flex items-center gap-2 text-sm text-secondary',
        className,
      )}
      {...props}
    >
      <span
        className="inline-flex size-4 shrink-0 items-center justify-center [&>svg]:size-full"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span
        key={typeof children === 'string' ? children : undefined}
        data-text-content
        className="min-w-0"
      >
        {children}
      </span>
    </p>
  );
}
