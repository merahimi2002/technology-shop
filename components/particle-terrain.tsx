'use client';

import { useEffect, useRef } from 'react';

// Sample a regular grid in depth; perspective compresses the distant rows.
const terrainRows = 39;
const terrainColumns = 75;
const terrain = Array.from({ length: terrainRows }, (_, row) => {
  const depth = row / (terrainRows - 1);
  const perspective = 0.27 + 0.9 * depth ** 1.5;
  // Keep distant rows beyond both edges so the wave fills the upper corners.
  const span = 0.56 + 0.61 * depth ** 1.5;
  return Array.from({ length: terrainColumns }, (_, column) => {
    const u = (column / (terrainColumns - 1)) * 2 - 1;
    const ridge =
      0.066 * Math.sin(8 * u + 10 * depth) +
      0.038 * Math.cos(12 * u - 7 * depth) +
      0.021 * Math.sin(18 * depth + 5 * u);
    return {
      index: row * terrainColumns + column,
      x: 0.5 + u * span,
      y: -0.045 + 1.23 * depth ** 1.34 + ridge * perspective,
      size: 0.85 + depth * 0.85,
      phase: 5 * u + 5 * depth,
      amplitude: 0.009 + 0.025 * perspective,
      light: Math.min(
        7,
        Math.max(0, Math.floor((0.8 + 4.4 * depth + 14 * ridge) * 1.2)),
      ),
    };
  });
}).flat();
const terrainByLight = Array.from({ length: 8 }, (_, light) =>
  terrain.filter((dot) => dot.light === light),
);

type Point = { x: number; y: number };
type TerrainDot = (typeof terrain)[number];
type Flight = {
  from: Point;
  size: number;
};

const morphDuration = 1000;

function sampleWord(word: string) {
  const mask = document.createElement('canvas');
  mask.width = 240;
  mask.height = 100;
  const ctx = mask.getContext('2d');
  if (!ctx) return [];
  ctx.font = '700 48px Vazirmatn, sans-serif';
  ctx.textAlign = 'center';
  const metrics = ctx.measureText(word);
  const baseline =
    50 +
    (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;
  ctx.fillText(word, 120, baseline, 208);
  const pixels = ctx.getImageData(0, 0, mask.width, mask.height).data;
  const points: Point[] = [];
  for (let y = 2; y < mask.height; y += 3) {
    for (let x = 2; x < mask.width; x += 3) {
      if (pixels[(y * mask.width + x) * 4 + 3] > 145)
        points.push({ x: x - 120, y: y - 50 });
    }
  }
  if (!points.length) return points;
  const left = Math.min(...points.map(({ x }) => x));
  const right = Math.max(...points.map(({ x }) => x));
  const top = points[0].y;
  const bottom = points[points.length - 1].y;
  return points.map(({ x, y }) => ({
    x: x - (left + right) / 2,
    y: y - (top + bottom) / 2,
  }));
}

export function ParticleTerrain({
  className = '',
  word,
}: {
  className?: string;
  word: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const surface = canvas.parentElement;
    if (!surface) return;

    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const desktop = matchMedia('(min-width: 48rem)');
    const target = { x: 0, y: 0, strength: 0 };
    const pointer = { ...target };
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let phase = 0;
    let visible = true;
    let activeWord = '';
    let inkMoving = false;
    let rtl = false;
    let started = 0;
    let destinations = new Map<number, Point>();
    let infill = new Map<number, TerrainDot>();
    let flights = new Map<number, Flight>();
    const lastX = new Float32Array(terrain.length);
    const lastY = new Float32Array(terrain.length);
    const lastSize = new Float32Array(terrain.length);
    let ink = getComputedStyle(canvas).color;

    function anchor() {
      return desktop.matches
        ? { x: width * (rtl ? 0.25 : 0.75), y: height / 2 + 28 }
        : { x: width / 2, y: height - 35 };
    }

    function retarget(word: string, force = false) {
      if (!width || !height || (!force && word === activeWord)) return;
      activeWord = word;
      const center = anchor();
      const next = new Map<number, Point>();
      const nextInfill = new Map<number, TerrainDot>();
      if (word) {
        const points = sampleWord(word);
        const candidates = terrain
          .filter((dot) => {
            const x = dot.x * width;
            const y = dot.y * height;
            return (
              x >= 0 &&
              x <= width &&
              y >= 0 &&
              y <= height &&
              (desktop.matches
                ? rtl
                  ? x < width / 2
                  : x > width / 2
                : y > height * 0.55)
            );
          })
          .map((dot) => ({
            index: dot.index,
            x: dot.x * width,
            y: dot.y * height,
          }))
          .sort(
            (a, b) =>
              (a.x - center.x) ** 2 +
              (a.y - center.y) ** 2 -
              ((b.x - center.x) ** 2 + (b.y - center.y) ** 2),
          )
          .slice(0, points.length * 3);
        const cellUse = new Map<string, number>();
        const cell = (point: Point) =>
          `${Math.floor(point.x / 24)}:${Math.floor(point.y / 24)}`;
        for (const point of points) {
          let closest = -1;
          let distance = Infinity;
          for (const [index, candidate] of candidates.entries()) {
            const score =
              (candidate.x - center.x - point.x) ** 2 +
              (candidate.y - center.y - point.y) ** 2 +
              700 * (cellUse.get(cell(candidate)) ?? 0);
            if (score >= distance) continue;
            closest = index;
            distance = score;
          }
          if (closest < 0) break;
          const [candidate] = candidates.splice(closest, 1);
          const key = cell(candidate);
          cellUse.set(key, (cellUse.get(key) ?? 0) + 1);
          next.set(candidate.index, point);
        }

        // Borrow nearby wave particles to spread the vacancies instead of
        // leaving a single empty patch where the letters gathered.
        const occupiedCells = new Set<string>();
        for (const index of next.keys()) {
          const vacancy = terrain[index];
          const vacancyX = vacancy.x * width;
          const vacancyY = vacancy.y * height;
          const key = `${Math.floor(vacancyX / 11)}:${Math.floor(vacancyY / 11)}`;
          if (occupiedCells.has(key)) continue;
          let closest = -1;
          let distance = 64 ** 2;
          for (const [position, candidate] of candidates.entries()) {
            const score =
              (candidate.x - vacancyX) ** 2 + (candidate.y - vacancyY) ** 2;
            if (score >= distance) continue;
            closest = position;
            distance = score;
          }
          if (closest < 0) continue;
          const [candidate] = candidates.splice(closest, 1);
          occupiedCells.add(key);
          nextInfill.set(candidate.index, vacancy);
        }
      }

      const moving = new Map<number, Flight>();
      for (const index of new Set([
        ...flights.keys(),
        ...destinations.keys(),
        ...next.keys(),
        ...infill.keys(),
        ...nextInfill.keys(),
      ])) {
        const dot = terrain[index];
        moving.set(index, {
          from: lastSize[index]
            ? { x: lastX[index], y: lastY[index] }
            : { x: dot.x, y: dot.y },
          size: lastSize[index] || dot.size,
        });
      }
      destinations = next;
      infill = nextInfill;
      flights = moving;
      started = performance.now();
      if (motion.matches) draw(started);
      else schedule();
    }

    function draw(now = performance.now()) {
      if (!ctx || !canvas || !width || !height) return;
      ctx.save();
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      const radius = Math.max(65, Math.min(width, height) * 0.36);
      ctx.fillStyle = ink;
      const center = anchor();
      const scale = Math.min(1, (desktop.matches ? width / 2 : width) / 232);
      const progress = motion.matches
        ? 1
        : Math.min(1, (now - started) / morphDuration);
      const blend = progress ** 2 * (3 - 2 * progress);
      if (progress === 1 && flights.size) flights.clear();

      for (const [light, dots] of terrainByLight.entries()) {
        const alpha = 0.27 + light * 0.078;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        const letters: { x: number; y: number; size: number }[] = [];
        for (const dot of dots) {
          const vacancy = infill.get(dot.index);
          const waveDot = vacancy ?? dot;
          let x = waveDot.x * width;
          let y =
            waveDot.y * height +
            Math.sin(waveDot.phase - phase) *
              Math.min(18, waveDot.amplitude * height);
          const flight = flights.get(dot.index);
          const destination = destinations.get(dot.index);
          if (
            !flight &&
            !destination &&
            (x < -2 || x > width + 2 || y > height + 24)
          )
            continue;
          let displacement = 0;
          if (pointer.strength > 0.001) {
            const distance = Math.hypot(x - pointer.x, y - pointer.y);
            const weight = Math.max(0, 1 - distance / radius);
            displacement = 23 * pointer.strength * weight ** 2;
          }
          y -= displacement;
          let size = dot.size;
          if (destination) {
            x = center.x + destination.x * scale;
            y = center.y + destination.y * scale;
            size = 2.15 * scale;
          }
          if (flight) {
            const fromX = flight.from.x * width;
            const fromY = flight.from.y * height;
            const delay = vacancy ? (dot.index % 5) * 0.022 : 0;
            const time = Math.max(0, (progress - delay) / (1 - delay));
            const travel = vacancy ? time ** 2 * (3 - 2 * time) : blend;
            if (vacancy) {
              const ripple = Math.sin(travel * Math.PI) * 0.22;
              const dx = x - fromX;
              const dy = y - fromY;
              x += dy * ripple;
              y -= dx * ripple;
            }
            x = fromX + (x - fromX) * travel;
            y = fromY + (y - fromY) * travel;
            size = flight.size + (size - flight.size) * travel;
          }
          lastX[dot.index] = x / width;
          lastY[dot.index] = y / height;
          lastSize[dot.index] = size;
          if (destination) letters.push({ x, y, size });
          else ctx.rect(x - size / 2, y - size / 2, size, size);
        }
        ctx.fill();
        if (letters.length) {
          ctx.globalAlpha = alpha + (0.9 - alpha) * blend;
          ctx.beginPath();
          for (const { x, y, size } of letters)
            ctx.rect(x - size / 2, y - size / 2, size, size);
          ctx.fill();
        }
      }
    }

    function tick(now: number) {
      frame = 0;
      const elapsed = Math.min(now - previous, 50);
      const blend = 1 - Math.exp(-elapsed / 58);
      previous = now;
      phase = (phase + elapsed * 0.00165) % (Math.PI * 2);
      pointer.x += (target.x - pointer.x) * blend;
      pointer.y += (target.y - pointer.y) * blend;
      pointer.strength += (target.strength - pointer.strength) * blend;
      const moving =
        Math.abs(target.strength - pointer.strength) > 0.002 ||
        (target.strength > 0 &&
          Math.hypot(target.x - pointer.x, target.y - pointer.y) > 0.3);
      if (!moving) Object.assign(pointer, target);
      if (inkMoving) updateInk();
      draw(now);
      if (visible && !motion.matches) frame = requestAnimationFrame(tick);
    }

    function schedule() {
      if (frame || motion.matches || !visible || document.hidden) return;
      previous = performance.now();
      frame = requestAnimationFrame(tick);
    }

    function follow(event: PointerEvent) {
      if (!canvas || motion.matches || !event.isPrimary) return;
      if (
        event.type === 'pointermove' &&
        event.pointerType !== 'mouse' &&
        !event.buttons
      )
        return;
      const rect = canvas.getBoundingClientRect();
      target.x = event.clientX - rect.left;
      target.y = event.clientY - rect.top;
      if (pointer.strength < 0.01) {
        pointer.x = target.x;
        pointer.y = target.y;
      }
      target.strength = 1;
      schedule();
    }

    function release(event: PointerEvent) {
      if (
        !event.isPrimary ||
        (event.type === 'pointerup' && event.pointerType === 'mouse')
      )
        return;
      target.strength = 0;
      schedule();
    }

    function reset() {
      cancelAnimationFrame(frame);
      frame = 0;
      target.strength = pointer.strength = 0;
      if (motion.matches) phase = 0;
      draw();
      schedule();
    }

    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const ratio = Math.min(devicePixelRatio || 1, 1.75);
      const pixelWidth = Math.round(width * ratio);
      const pixelHeight = Math.round(height * ratio);
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
      retarget(canvas.dataset.word ?? '');
      schedule();
    });

    function updateInk() {
      if (!canvas) return;
      ink = getComputedStyle(canvas).color;
    }

    function startInk(event: TransitionEvent) {
      if (event.propertyName !== 'color') return;
      inkMoving = true;
      schedule();
    }

    function stopInk(event: TransitionEvent) {
      if (event.propertyName !== 'color') return;
      inkMoving = false;
      updateInk();
      draw();
    }

    function sync() {
      if (!canvas) return;
      updateInk();
      const direction = getComputedStyle(canvas).direction === 'rtl';
      const changed = direction !== rtl;
      rtl = direction;
      retarget(canvas.dataset.word ?? '', changed);
      if (!frame) draw();
    }

    const theme = new MutationObserver(sync);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'dir'],
    });
    theme.observe(canvas, {
      attributes: true,
      attributeFilter: ['class', 'data-word'],
    });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    intersection.observe(canvas);
    function reflow() {
      retarget(canvas?.dataset.word ?? '', true);
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        sync();
        schedule();
      }
    }
    sync();
    document.fonts.addEventListener('loadingdone', reflow);
    document.addEventListener('visibilitychange', visibility);
    desktop.addEventListener('change', reflow);
    canvas.addEventListener('transitionrun', startInk);
    canvas.addEventListener('transitionend', stopInk);
    canvas.addEventListener('transitioncancel', stopInk);
    resize.observe(canvas);
    motion.addEventListener('change', reset);
    const followEvents = ['pointermove', 'pointerdown'] as const;
    const releaseEvents = [
      'pointerleave',
      'pointerup',
      'pointercancel',
    ] as const;
    for (const event of followEvents)
      surface.addEventListener(event, follow, { passive: true });
    for (const event of releaseEvents)
      surface.addEventListener(event, release, { passive: true });

    return () => {
      resize.disconnect();
      theme.disconnect();
      intersection.disconnect();
      cancelAnimationFrame(frame);
      document.fonts.removeEventListener('loadingdone', reflow);
      document.removeEventListener('visibilitychange', visibility);
      desktop.removeEventListener('change', reflow);
      canvas.removeEventListener('transitionrun', startInk);
      canvas.removeEventListener('transitionend', stopInk);
      canvas.removeEventListener('transitioncancel', stopInk);
      motion.removeEventListener('change', reset);
      for (const event of followEvents)
        surface.removeEventListener(event, follow);
      for (const event of releaseEvents)
        surface.removeEventListener(event, release);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      data-word={word}
      aria-hidden="true"
      className={`absolute inset-0 size-full ${className}`}
    />
  );
}
