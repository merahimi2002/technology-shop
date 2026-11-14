const fieldStagger = 160;
const revealDuration = 460;

export function revealAccountFields(
  container: HTMLElement | null,
  selector: string,
  start: number,
): Animation[] {
  if (
    !container ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return [];
  const elements = Array.from(container.querySelectorAll(selector));
  return elements.map((element, index) => {
    const isSubmit = element.matches('button[type=submit]');
    const delay = start + index * fieldStagger + (isSubmit ? 100 : 0);

    return element.animate(
      [
        {
          clipPath: 'inset(0 -12px 100% -12px round 4px)',
          opacity: 0,
          transform: 'translateY(14px)',
        },
        {
          clipPath: 'inset(-12px -12px -12px -12px round 4px)',
          opacity: 1,
          transform: 'translateY(0)',
        },
      ],
      {
        duration: revealDuration,
        delay,
        fill: 'backwards',
        easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    );
  });
}
