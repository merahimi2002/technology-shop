'use client';

import type { ReactNode, RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, SplitText);

export function useTextReveal(
  root: RefObject<HTMLElement | null>,
  {
    active,
    delay,
    children,
    mode,
    gradient = false,
  }: {
    active: boolean;
    delay: number;
    children: ReactNode;
    mode: 'scatter' | 'rotate' | 'special';
    gradient?: boolean;
  },
) {
  useGSAP(
    (_context, contextSafe) => {
      if (
        !active ||
        !root.current ||
        document.documentElement.dataset.localeMoving
      )
        return;
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const observer = new IntersectionObserver(
          contextSafe!(([entry]: IntersectionObserverEntry[]) => {
            if (!entry.isIntersecting) return;
            const content = root.current!.querySelector('[data-text-content]');
            if (!content) return;
            const rotate = mode === 'rotate';
            const special = mode === 'special';
            const direction =
              getComputedStyle(root.current!).direction === 'rtl' ? 1 : -1;
            SplitText.create(content, {
              type: special ? 'chars' : gradient ? 'words,lines' : 'words',
              tag: 'span',
              wordsClass: gradient ? 'title-word inline-block' : 'inline-block',
              charsClass: 'inline-block',
              specialChars: special
                ? [
                    ...new Set(
                      content.textContent?.match(
                        /[\p{Script=Arabic}\p{M}\u200c\u200d]+/gu,
                      ) ?? [],
                    ),
                  ].sort((a, b) => b.length - a.length)
                : undefined,
              aria: 'auto',
              autoSplit: true,
              reduceWhiteSpace: false,
              onRevert() {
                if (gradient) content.removeAttribute('data-text-split');
              },
              onSplit(split) {
                if (gradient) {
                  content.setAttribute('data-text-split', 'true');
                  const bounds = content.getBoundingClientRect();
                  split.words.forEach((word) => {
                    const element = word as HTMLElement;
                    element.style.setProperty(
                      '--title-gradient-width',
                      `${bounds.width}px`,
                    );
                    element.style.setProperty(
                      '--title-gradient-x',
                      `${bounds.left - element.getBoundingClientRect().left}px`,
                    );
                  });
                }
                if (special) {
                  return gsap.fromTo(
                    split.chars,
                    {
                      y: 10,
                      rotation: 25 * direction,
                      opacity: 0,
                    },
                    {
                      y: 0,
                      rotation: 0,
                      opacity: 1,
                      duration: 1.4,
                      stagger: 0.1,
                      delay,
                      ease: 'elastic.out(1, 0.3)',
                      clearProps: 'transform,opacity',
                    },
                  );
                }
                return gsap.fromTo(
                  split.words,
                  rotate
                    ? {
                        rotationX: -65,
                        rotation: -28 * direction,
                        yPercent: 35,
                        transformOrigin: '50% 100%',
                        transformPerspective: 600,
                        opacity: 0.2,
                      }
                    : {
                        x: 'random(-48, 48)',
                        y: 'random(-60, 60)',
                        rotation: 'random(-16, 16)',
                        rotationX: 'random(-65, 65)',
                        transformPerspective: 600,
                        opacity: 0,
                      },
                  {
                    x: 0,
                    y: 0,
                    yPercent: 0,
                    rotation: 0,
                    rotationX: 0,
                    opacity: 1,
                    duration: rotate ? 1.2 : 0.8,
                    stagger: rotate ? 0.28 : { amount: 0.24, from: 'random' },
                    delay,
                    ease: rotate ? 'power2.out' : 'power3.out',
                    clearProps: 'transform,opacity,transformOrigin',
                  },
                );
              },
            });
            observer.disconnect();
          }),
          { threshold: 0.2 },
        );
        observer.observe(root.current!);
        return () => observer.disconnect();
      });
      return () => media.revert();
    },
    {
      scope: root,
      dependencies: [active, delay, children, mode, gradient],
      revertOnUpdate: true,
    },
  );
}
