'use client';

const selector =
  '.hero-copy-slot, .hero-stage, .hero-bottom, .brand-link, .header-nav, .header-actions, [data-locale-motion]';
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
    const offsets = new Map(
      snapshot.positions.map(({ node, rect }) => {
        const next = node.getBoundingClientRect();
        return [
          node,
          {
            x: rect.left - next.left,
            y: rect.top - next.top,
            visible: Boolean(rect.width && next.width),
          },
        ] as const;
      }),
    );
    for (const { node } of snapshot.positions) {
      const offset = offsets.get(node)!;
      if (!offset.visible || !node.isConnected) continue;
      // A nested target already travels with its animated ancestor.
      let ancestor = node.parentElement;
      while (ancestor && !offsets.get(ancestor)?.visible)
        ancestor = ancestor.parentElement;
      const parentOffset = ancestor ? offsets.get(ancestor) : undefined;
      const x = offset.x - (parentOffset?.x ?? 0);
      const y = offset.y - (parentOffset?.y ?? 0);
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
