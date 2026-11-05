'use client';

const selector =
  '.hero-copy-slot, .hero-stage, .hero-bottom, .brand-link, .header-nav, .header-actions';
let pending:
  | {
      positions: { node: HTMLElement; rect: DOMRect }[];
      reduced: boolean;
      resolve: () => void;
    }
  | undefined;

export function prepareLocaleMotion(reduced: boolean) {
  document.documentElement.dataset.localeMoving = 'true';
  return new Promise<void>((resolve) => {
    pending = {
      positions: Array.from(
        document.querySelectorAll<HTMLElement>(selector),
      ).map((node) => ({ node, rect: node.getBoundingClientRect() })),
      reduced,
      resolve,
    };
  });
}

/** Called after React commits the translated content and document direction. */
export function finishLocaleMotion() {
  const snapshot = pending;
  pending = undefined;
  if (!snapshot) return;
  const animations: Animation[] = [];
  if (!snapshot.reduced) {
    for (const { node, rect } of snapshot.positions) {
      const next = node.getBoundingClientRect();
      if (!rect.width || !next.width) continue;
      const x = rect.left - next.left;
      const y = rect.top - next.top;
      if (Math.abs(x) + Math.abs(y) < 1) continue;
      animations.push(
        node.animate(
          [
            { transform: `translate(${x}px, ${y}px)` },
            ...(Math.abs(x) > 100 &&
            (node.matches('.hero-stage') || node.matches('.hero-copy-slot'))
              ? [
                  {
                    transform: `translate(${x * 0.5}px, ${y * 0.5 + (node.matches('.hero-stage') ? 110 : -90)}px)`,
                    offset: 0.5,
                  },
                ]
              : []),
            { transform: 'translate(0px, 0px)' },
          ],
          { duration: 620, easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
        ),
      );
    }
  }
  void Promise.allSettled(
    animations.map((animation) => animation.finished),
  ).then(() => {
    animations.forEach((animation) => animation.cancel());
    delete document.documentElement.dataset.localeMoving;
    snapshot.resolve();
  });
}
