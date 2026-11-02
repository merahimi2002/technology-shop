import type { SVGProps } from 'react';

type LogoProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  label?: string;
  primaryColor?: string;
  secondaryColor?: string;
};

export function Logo({
  label = 'Tech Shop',
  primaryColor,
  secondaryColor,
  style,
  ...props
}: LogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 240"
      fill="none"
      role="img"
      aria-label={label}
      style={{
        ...style,
        ...(primaryColor ? { '--logo-primary': primaryColor } : {}),
        ...(secondaryColor ? { '--logo-secondary': secondaryColor } : {}),
      }}
      {...props}
    >
      <g
        fill="none"
        stroke="var(--logo-primary, #142D4E)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M65 91 99 44m76 47-34-47"
          stroke="var(--logo-secondary, #008879)"
        />
        <path d="M44 95l18 77q4 18 22 18h72q18 0 22-18l18-77" />
        <path d="M37 91h166" strokeWidth="12" />
        <path d="M91 92v69" />
        <path
          d="M191 116h-46c-14 0-22 6-22 16s9 14 21 16l9 2c13 3 16 11 12 22s-12 18-25 18h-21"
          stroke="var(--logo-secondary, #008879)"
        />
      </g>
    </svg>
  );
}
