'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type KeyboardEvent,
} from 'react';
import Image from 'next/image';
import { ArrowLeft, Store, X } from 'lucide-react';
import { Subtitle } from '@/components/subtitle';
import { Title } from '@/components/title';
import { GradientButton } from '@/components/gradient-button';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const products = [
  {
    id: 'airpods',
    name: 'Apple AirPods Max',
    title: 'هدفون اپل ایرپاد مکس',
    label: 'ایرپاد مکس',
    category: 'دنیای صدا',
    description:
      'گاهی فقط باید پلی کنی و از همه‌چیز فاصله بگیری. با ایرپاد مکس، برای لحظه‌های خودت جا باز کن.',
    image: '/products/airpods-max-midnight.png',
    alt: 'هدفون ایرپاد مکس میدنایت',
    caption: 'میدنایت؛ در مرکز توجه.',
  },
  {
    id: 'mouse',
    name: 'Logitech MX Master 3S',
    title: 'ماوس لاجیتک ام‌ایکس مستر ۳ اس',
    label: 'ماوس MX Master 3S',
    category: 'میز کار تو',
    description:
      'از اولین کلیک تا آخرین جزئیات؛ برای ساعت‌هایی که غرق ساختن می‌شوی، یک همراه روی میزت داشته باش.',
    image: '/products/mx-master-3s.png',
    alt: 'ماوس لاجیتک MX Master 3S گرافیتی',
    caption: 'گرافیتی؛ همراه ایده‌هایت.',
  },
  {
    id: 'keyboard',
    name: 'Logitech MX Keys S',
    title: 'کیبورد لاجیتک ام‌ایکس کیز اس',
    label: 'کیبورد MX Keys S',
    category: 'دنیای خلاقیت',
    description:
      'داستان بعدی، پروژه بعدی، ایده بعدی. همه از همین‌جا شروع می‌شوند؛ از میز تو و اولین کلمه.',
    image: '/products/mx-keys-s.png',
    alt: 'کیبورد لاجیتک MX Keys S گرافیتی',
    caption: 'جای ایده‌های تازه روی میز تو.',
  },
];

export function ProductHero() {
  const [selected, setSelected] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const product = products[selected];
  const root = useRef<HTMLElement>(null);
  const details = useRef<HTMLDialogElement>(null);
  const contactShadow = useRef<HTMLDivElement>(null);
  const updateDragPose = (node: HTMLDivElement, x: number, y: number) => {
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const lift = Math.max(0, -y);
    gsap.set(node, {
      x,
      y,
      rotation: reduced ? 0 : gsap.utils.clamp(-6, 6, x * 0.12),
      transformOrigin: '50% 85%',
    });
    gsap.set(contactShadow.current, {
      x: x * 0.55,
      y: y * 0.1,
      scaleX: 1 + lift * 0.004,
      scaleY: 1 + lift * 0.006,
      opacity: gsap.utils.clamp(0.13, 0.36, 0.32 - lift * 0.0025),
      rotation: x * 0.03,
    });
  };
  const [interacting, setInteracting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{
    pointer: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (switching.current || !event.isPrimary || event.button !== 0) return;
    event.preventDefault();
    gsap.killTweensOf(event.currentTarget);
    gsap.killTweensOf(contactShadow.current);
    drag.current = {
      pointer: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: Number(gsap.getProperty(event.currentTarget, 'x')),
      y: Number(gsap.getProperty(event.currentTarget, 'y')),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    const limit = Math.min(event.currentTarget.clientWidth * 0.1, 48);
    updateDragPose(
      event.currentTarget,
      gsap.utils.clamp(
        -limit,
        limit,
        current.x + event.clientX - current.startX,
      ),
      gsap.utils.clamp(-70, 45, current.y + event.clientY - current.startY),
    );
  };
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    gsap.to(event.currentTarget, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 0.8,
      ease: 'power3.out',
      overwrite: true,
    });
    gsap.to(contactShadow.current, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 0.32,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 0.8,
      ease: 'power3.out',
      overwrite: true,
    });
  };
  const moveWithKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      ![
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'Escape',
      ].includes(event.key) ||
      switching.current
    )
      return;
    event.preventDefault();
    gsap.killTweensOf(event.currentTarget);
    const limit = Math.min(event.currentTarget.clientWidth * 0.1, 48);
    const reset = event.key === 'Home' || event.key === 'Escape';
    gsap.set(event.currentTarget, {
      x: reset
        ? 0
        : gsap.utils.clamp(
            -limit,
            limit,
            Number(gsap.getProperty(event.currentTarget, 'x')) +
              (event.key === 'ArrowLeft'
                ? -12
                : event.key === 'ArrowRight'
                  ? 12
                  : 0),
          ),
      y: reset
        ? 0
        : gsap.utils.clamp(
            -70,
            45,
            Number(gsap.getProperty(event.currentTarget, 'y')) +
              (event.key === 'ArrowUp'
                ? -12
                : event.key === 'ArrowDown'
                  ? 12
                  : 0),
          ),
    });
    gsap.killTweensOf(contactShadow.current);
    updateDragPose(
      event.currentTarget,
      Number(gsap.getProperty(event.currentTarget, 'x')),
      Number(gsap.getProperty(event.currentTarget, 'y')),
    );
  };

  const switching = useRef(false);
  const pending = useRef(0);
  const autoplay = useRef<gsap.core.Tween | null>(null);
  const selectProduct = useRef<(index: number, keyboard?: boolean) => void>(
    () => {},
  );
  const openDetails = () => {
    setDetailsOpen(true);
    details.current?.showModal();
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const ring = root.current?.querySelector(
      '.hero-dot[aria-pressed="true"] .hero-progress-value',
    );
    if (!ring) return;
    const timer = gsap.fromTo(
      ring,
      { strokeDashoffset: 100 },
      {
        strokeDashoffset: 0,
        duration: 6,
        ease: 'none',
        paused: true,
        onComplete: () =>
          selectProduct.current((selected + 1) % products.length),
      },
    );
    autoplay.current = timer;
    return () => {
      timer.kill();
      autoplay.current = null;
    };
  }, [selected]);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncPlayback = () => {
      autoplay.current?.paused(
        interacting ||
          focused ||
          dragging ||
          !visible ||
          detailsOpen ||
          document.hidden ||
          reduced.matches,
      );
    };
    syncPlayback();
    document.addEventListener('visibilitychange', syncPlayback);
    reduced.addEventListener('change', syncPlayback);
    return () => {
      document.removeEventListener('visibilitychange', syncPlayback);
      reduced.removeEventListener('change', syncPlayback);
    };
  }, [selected, interacting, focused, dragging, visible, detailsOpen]);
  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        const incoming = `.hero-product[data-product="${selected}"]`;
        const stage = root.current?.querySelector('.hero-stage');
        const travelX = Math.min((stage?.clientWidth ?? 400) * 0.45, 230);
        const travelY = Math.min((stage?.clientHeight ?? 520) * 0.55, 280);
        gsap.set('.hero-product-crop', { x: 0, y: 0, rotation: 0 });
        gsap.set(contactShadow.current, {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 0.32,
        });
        const swap = gsap.timeline({
          onComplete: () => {
            switching.current = false;
            setOutgoing(null);
            if (pending.current !== selected)
              selectProduct.current(pending.current);
          },
        });
        swap.fromTo(
          incoming,
          { x: -travelX, y: -travelY, opacity: 0 },
          { x: 0, y: 0, opacity: 1, duration: 1.65, ease: 'power2.inOut' },
          0,
        );
        const incomingText = `.hero-copy[data-copy="${selected}"] > :not([data-animated-title])`;
        gsap.set(
          `.hero-copy[data-copy="${selected}"] > [data-animated-title]`,
          {
            x: 0,
            y: 0,
            autoAlpha: 1,
          },
        );
        const textX = Math.min(travelX * 0.32, 60);
        const textY = Math.min(travelY * 0.18, 42);
        gsap.set(incomingText, { x: textX, y: -textY, autoAlpha: 0 });
        swap.to(
          incomingText,
          {
            x: 0,
            y: 0,
            autoAlpha: 1,
            duration: 0.75,
            stagger: 0.06,
            ease: 'power3.out',
          },
          outgoing === null ? 0.12 : 0.52,
        );
        if (outgoing !== null) {
          swap.fromTo(
            `.hero-product[data-product="${outgoing}"]`,
            { x: 0, y: 0, opacity: 1 },
            {
              x: -travelX,
              y: travelY,
              opacity: 0,
              duration: 1.65,
              ease: 'power2.inOut',
            },
            0,
          );
          swap.fromTo(
            `.hero-copy[data-copy="${outgoing}"] > *`,
            { x: 0, y: 0, autoAlpha: 1 },
            {
              x: textX,
              y: textY,
              autoAlpha: 0,
              duration: 0.28,
              stagger: 0.06,
              ease: 'power2.inOut',
            },
            0,
          );
        }
      });
      return () => media.revert();
    },
    { scope: root, dependencies: [selected], revertOnUpdate: true },
  );

  useEffect(() => {
    selectProduct.current = (index: number) => {
      pending.current = index;
      if (switching.current || index === selected) return;
      const reduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      switching.current = !reduced;
      setOutgoing(reduced ? null : selected);
      setSelected(index);
    };
  }, [selected]);
  return (
    <section
      ref={root}
      className="product-hero relative isolate w-full [margin:-172px_auto_54px] [padding:196px_0_0] rounded-[0_0_40px_40px] overflow-clip [@media(max-width:700px)]:w-full [@media(max-width:700px)]:-mt-[158px] [@media(max-width:700px)]:pt-45 [@media(min-width:701px)_and_(max-width:1023px)]:w-full [@media(min-width:701px)_and_(max-width:1023px)]:-mt-[158px] [@media(min-width:701px)_and_(max-width:1023px)]:pt-45"
      aria-labelledby="hero-title"
      aria-roledescription="اسلایدر محصولات"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(false);
      }}
    >
      <div
        className="hero-photo absolute inset-0 z-[-2] rounded-[inherit]"
        aria-hidden="true"
      />
      <div className="hero-paper relative grid grid-cols-[0.95fr_1.05fr] gap-x-10 items-center min-h-[610px] [padding:48px_64px_30px] rounded-[inherit] isolate overflow-hidden [@media(min-width:701px)_and_(max-width:1050px)]:px-8 [@media(min-width:701px)_and_(max-width:1050px)]:min-h-[550px] [@media(max-width:700px)]:grid-cols-1 [@media(max-width:700px)]:[padding:30px_24px_22px]">
        <div className="hero-copy-slot grid min-w-0">
          {products.map((item, index) => (
            <div
              key={item.id}
              className="hero-copy col-start-1 row-start-1 relative z-[2] pb-[35px] [@media(max-width:700px)]:pb-0"
              data-copy={index}
              hidden={selected !== index && outgoing !== index}
              aria-hidden={selected !== index}
              inert={selected !== index}
            >
              <Subtitle
                icon={<Store />}
                active={selected === index}
                delay={0.52}
                className="hero-intro mb-[27px] [@media(max-width:700px)]:mb-4 [@media(max-width:700px)]:text-xs"
              >
                {`انتخاب تک‌شاپ / ${item.category}`}
              </Subtitle>
              <Title
                data-animated-title
                as="h1"
                id={selected === index ? 'hero-title' : undefined}
                active={selected === index}
                delay={0.58}
                className="max-w-[540px] text-right"
              >
                {item.title}
              </Title>
              <p className="hero-description max-w-[350px] mt-[22px] text-base leading-[2] [@media(max-width:700px)]:text-sm [@media(max-width:700px)]:mt-[14px]">
                {item.description}
              </p>
              <div className="hero-actions mt-[30px] flex flex-col items-start gap-3 [@media(max-width:700px)]:mt-5">
                <GradientButton icon={<ArrowLeft />} onClick={openDetails}>
                  کشف محصول
                </GradientButton>
              </div>
            </div>
          ))}
        </div>

        <div className="hero-stage relative min-w-0 h-130 -mt-[35px] [@media(min-width:701px)_and_(max-width:1050px)]:h-[410px] [@media(max-width:700px)]:h-auto [@media(max-width:700px)]:aspect-[0.9] [@media(max-width:700px)]:mt-[30px] [@media(max-width:700px)]:mb-5">
          <div
            className="hero-podium absolute inset-0 z-[0] pointer-events-none"
            aria-hidden="true"
          >
            <div className="hero-podium-light absolute w-[90%] h-40 left-[5%] bottom-[78px]" />
            <div className="hero-podium-top absolute z-[1] w-[94%] h-16 left-[3%] bottom-18 rounded-[50%]" />
            <div
              ref={contactShadow}
              className="hero-contact-shadow absolute z-[2] w-[44%] h-[22px] left-[28%] bottom-[91px] rounded-[50%] opacity-[0.32] pointer-events-none"
            />
            <div className="hero-podium-base absolute w-[94%] h-[58px] left-[3%] bottom-[46px] rounded-[0_0_50%_50%]" />
          </div>
          {products.map((item, index) => (
            <div
              key={item.id}
              data-product={index}
              className={`hero-product absolute z-[1] inset-[12px_0_100px] hero-product-${item.id}`}
              hidden={selected !== index && outgoing !== index}
              aria-hidden={selected !== index}
            >
              <div
                className="hero-product-crop active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-secondary absolute inset-0 overflow-visible cursor-grab touch-none select-none outline-offset-[6px]"
                role="group"
                aria-label={`جابه‌جایی ${item.label}؛ با کشیدن یا کلیدهای جهت؛ Home برای بازگشت`}
                tabIndex={selected === index ? 0 : -1}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
                onKeyDown={moveWithKeyboard}
              >
                <Image
                  src={item.image}
                  alt={item.alt}
                  draggable={false}
                  width={1200}
                  height={1200}
                  loading="eager"
                  preload={index === 0}
                  sizes="(max-width: 700px) 100vw, 780px"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="hero-bottom col-start-2 flex justify-center items-center gap-4 mt-0 text-xs [&>_span]:hidden [@media(max-width:700px)]:col-start-1 [@media(max-width:700px)]:items-center [@media(max-width:700px)]:text-[10px] [@media(max-width:700px)]:mt-[-6px]">
          <span>تکنولوژی، به سلیقهٔ تو.</span>
          <div
            className="hero-picker flex flex-wrap gap-0.5 [@media(max-width:700px)]:gap-0.5"
            role="group"
            aria-label="انتخاب محصول"
          >
            {products.map((item, index) => (
              <button
                key={item.id}
                className="btn btn-circle btn-ghost hero-dot group [&>span]:-translate-x-1/2 [&>span]:-translate-y-1/2 [&>span]:transition-[opacity,background-color] [&>span]:duration-180 [&>span]:ease-[ease] aria-pressed:[&>span]:bg-secondary aria-pressed:[&>span]:opacity-100 relative w-7 h-7 min-h-7 p-0 [&>_span]:absolute [&>_span]:top-[50%] [&>_span]:left-[50%] [&>_span]:w-[9px] [&>_span]:h-[9px] [&>_span]:rounded-full [&>_span]:bg-base-content [&>_span]:opacity-[0.35]"
                aria-label={`نمایش ${item.label}`}
                aria-pressed={selected === index}
                onClick={(event) =>
                  selectProduct.current(index, event.detail === 0)
                }
              >
                <svg
                  className="hero-progress fill-none stroke-[1.7] -translate-x-1/2 -translate-y-1/2 -rotate-90 group-aria-pressed:opacity-100 absolute top-[50%] left-[50%] w-7 h-7 opacity-[0] pointer-events-none"
                  viewBox="0 0 40 40"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle
                    className="hero-progress-track stroke-base-content opacity-[0.15]"
                    cx="20"
                    cy="20"
                    r="15"
                  />
                  <circle
                    className="hero-progress-value stroke-secondary [stroke-linecap:round]"
                    cx="20"
                    cy="20"
                    r="15"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset="100"
                  />
                </svg>
                <span aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <dialog
        ref={details}
        className="modal"
        onClose={() => setDetailsOpen(false)}
      >
        <div className="modal-box bg-base-100">
          <form method="dialog">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute left-3 top-3"
              aria-label="بستن"
            >
              <X size={20} />
            </button>
          </form>
          <p className="text-secondary">انتخاب تک‌شاپ</p>
          <h2 className="mt-3 text-2xl font-bold" dir="ltr">
            {product.name}
          </h2>
          <p className="mt-4 leading-8">
            {product.description} این بخش معرفی محصول است؛ قیمت و موجودی پس از
            اتصال کاتالوگ فروشگاه نمایش داده می‌شود.
          </p>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>بستن</button>
        </form>
      </dialog>
    </section>
  );
}
