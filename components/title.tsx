'use client';

import { useRef, type ComponentPropsWithoutRef } from 'react';
import { useTextReveal } from '@/hooks/use-text-reveal';
import { cn } from '@/lib/utils';

type TitleProps = ComponentPropsWithoutRef<'h2'> & {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  active?: boolean;
  delay?: number;
};

export function Title({
  as: Heading = 'h2',
  active = true,
  delay = 0,
  children,
  className,
  dir = 'auto',
  ...props
}: TitleProps) {
  const root = useRef<HTMLHeadingElement>(null);

  useTextReveal(root, {
    active,
    delay,
    children,
    mode: 'scatter',
    gradient: true,
  });

  return (
    <Heading
      ref={root}
      dir={dir}
      className={cn(
        'font-sans text-[clamp(1.5rem,2.5vw,2.25rem)] leading-[1.6] font-bold tracking-normal text-balance text-base-content ltr:leading-[1.25] ltr:tracking-[-0.025em] ltr:[font-family:Arial,sans-serif]',
        className,
      )}
      {...props}
    >
      <span
        key={typeof children === 'string' ? children : undefined}
        data-text-content
        className="block data-[text-split]:bg-none bg-linear-to-l from-[color-mix(in_srgb,var(--color-primary)_65%,black)] to-[color-mix(in_srgb,var(--color-primary)_45%,white)] bg-clip-text text-transparent [&_.title-word]:bg-linear-to-l [&_.title-word]:from-[color-mix(in_srgb,var(--color-primary)_65%,black)] [&_.title-word]:to-[color-mix(in_srgb,var(--color-primary)_45%,white)] [&_.title-word]:bg-clip-text [&_.title-word]:text-transparent [&_.title-word]:[background-size:var(--title-gradient-width)_100%] [&_.title-word]:[background-position:var(--title-gradient-x)_0]"
      >
        {children}
      </span>
    </Heading>
  );
}
