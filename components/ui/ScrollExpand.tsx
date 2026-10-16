'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { CSSProperties, ReactNode } from 'react';

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

type ConfigKey =
  | 'startWidth'
  | 'startHeight'
  | 'startRadius'
  | 'endRadius'
  | 'mediaZoom'
  | 'scrollDistance'
  | 'holdDistance'
  | 'smoothing'
  | 'overlayScrim'
  | 'useWindowScroll'
  | 'enabled';

export interface ScrollExpandProps {
  src?: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  alt?: string;
  title?: string;
  titleClassName?: string;
  scrollHint?: string;
  startWidth?: number;
  startHeight?: number;
  startRadius?: number;
  endRadius?: number;
  mediaZoom?: number;
  /** CSS object-position for the media (e.g. '50% 20%') to choose which part stays in frame. */
  mediaObjectPosition?: string;
  /** Extra classes for the media element (e.g. a blur). */
  mediaClassName?: string;
  scrollDistance?: number;
  holdDistance?: number;
  smoothing?: number;
  overlayScrim?: number;
  useWindowScroll?: boolean;
  enabled?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

const ScrollExpand: React.FC<ScrollExpandProps> = ({
  src = '',
  mediaType = 'image',
  poster = '',
  alt = '',
  title = '',
  titleClassName = '',
  scrollHint = '',
  startWidth = 42,
  startHeight = 58,
  startRadius = 24,
  endRadius = 0,
  mediaZoom = 1.35,
  mediaObjectPosition,
  mediaClassName = '',
  scrollDistance = 1.2,
  holdDistance = 0.35,
  smoothing = 0.1,
  overlayScrim = 0.45,
  useWindowScroll = false,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}: ScrollExpandProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLImageElement & HTMLVideoElement>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrimRef = useRef<HTMLDivElement | null>(null);
  const hintRef = useRef<HTMLDivElement | null>(null);

  const propsRef = useRef<Required<Pick<ScrollExpandProps, ConfigKey>>>(
    {} as Required<Pick<ScrollExpandProps, ConfigKey>>
  );
  propsRef.current = {
    startWidth,
    startHeight,
    startRadius,
    endRadius,
    mediaZoom,
    scrollDistance,
    holdDistance,
    smoothing,
    overlayScrim,
    useWindowScroll,
    enabled,
  };

  const applyProgress = useCallback((p: number) => {
    const frame = frameRef.current;
    const media = mediaRef.current;
    if (!frame || !media) return;
    const c = propsRef.current;

    // p is already eased by the caller, so use it directly (no second slow-start curve)
    const e = p;

    // Frame fades in on scroll so initially ONLY the word/title appears without any box/div
    const frameOpacity = smoothstep(0, 0.06, p);
    frame.style.opacity = `${frameOpacity}`;

    const w = c.startWidth + (100 - c.startWidth) * e;
    const h = c.startHeight + (100 - c.startHeight) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = c.startRadius + (c.endRadius - c.startRadius) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${c.mediaZoom + (1 - c.mediaZoom) * e})`;

    if (scrimRef.current) scrimRef.current.style.opacity = `${c.overlayScrim * e}`;

    if (titleRef.current) {
      const out = smoothstep(0.2, 0.7, p);
      titleRef.current.style.opacity = `${1 - out}`;
      titleRef.current.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }

    if (hintRef.current) {
      const gone = smoothstep(0, 0.15, p);
      hintRef.current.style.opacity = `${1 - gone}`;
      hintRef.current.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    if (overlayRef.current) {
      const inn = smoothstep(0.5, 0.95, p);
      overlayRef.current.style.opacity = `${inn}`;
      overlayRef.current.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
      overlayRef.current.style.pointerEvents = inn > 0.4 ? 'auto' : 'none';
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let current = 0;
    let target = 0;
    let stageH = 0;
    let running = false;

    const measure = () => {
      const c = propsRef.current;
      stageH = c.useWindowScroll ? window.innerHeight : root.clientHeight;
      if (stageH <= 0) return;
      stage.style.height = `${stageH}px`;
      track.style.height = `${stageH * (1 + Math.max(0, c.scrollDistance) + Math.max(0, c.holdDistance))}px`;

      const w = root.clientWidth || stageH;
      stage.style.setProperty('--se-title-size', `${clamp(w * 0.075, 24, 88)}px`);
    };

    const readProgress = () => {
      const c = propsRef.current;
      if (!c.enabled) return 1;
      const span = stageH * Math.max(0.01, c.scrollDistance);
      if (c.useWindowScroll) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    let isCompleted = false;
    let animStartTime = 0;
    let animStartVal = 0;
    const ANIM_DURATION = 1100; // ms

    // Ease-out: moves the instant you scroll, then settles softly
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      if (isCompleted) {
        if (!animStartTime) animStartTime = now;
        const elapsed = now - animStartTime;
        const progress = clamp(elapsed / ANIM_DURATION, 0, 1);
        current = animStartVal + (1 - animStartVal) * easeOutCubic(progress);
        applyProgress(current);

        if (progress < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          running = false;
          current = 1;
          applyProgress(1);
        }
        return;
      }

      const c = propsRef.current;
      const k = c.smoothing <= 0 ? 1 : 1 - Math.exp(-1 / (60 * (c.smoothing || 0.1)));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) {
        current = target;
        running = false;
      }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (running) return;
      running = true;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const complete = () => {
      if (isCompleted) return;
      isCompleted = true;
      animStartTime = 0;
      animStartVal = current;
      if (reduceMotion) {
        current = 1;
        applyProgress(1);
        return;
      }
      kick();
    };

    const onScroll = () => {
      if (isCompleted) {
        // Once completed, lock at full completion — never undo on scroll up (only on page refresh)
        return;
      }

      const p = readProgress();
      // Any slight scroll (a couple of pixels) glides the animation to 100% full completion
      if (p > 0.004) {
        complete();
        return;
      }

      target = p;
      if (propsRef.current.smoothing <= 0 || reduceMotion) {
        current = target;
        applyProgress(current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      if (!isCompleted) {
        target = readProgress();
        current = target;
        applyProgress(current);
      }
    };

    measure();
    target = readProgress();
    current = target;
    applyProgress(current);

    // A downward wheel / swipe expands immediately, even before the page has moved a single pixel
    let touchY = 0;
    const onWheel = (e: WheelEvent) => {
      if (propsRef.current.enabled && e.deltaY > 0) complete();
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (propsRef.current.enabled && touchY - (e.touches[0]?.clientY ?? touchY) > 6) complete();
    };
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) complete();
    };
    if (useWindowScroll) window.addEventListener('keydown', onKey);
    const scroller = useWindowScroll ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    scroller.addEventListener('wheel', onWheel as EventListener, { passive: true });
    scroller.addEventListener('touchstart', onTouchStart as EventListener, { passive: true });
    scroller.addEventListener('touchmove', onTouchMove as EventListener, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      scroller.removeEventListener('wheel', onWheel as EventListener);
      scroller.removeEventListener('touchstart', onTouchStart as EventListener);
      scroller.removeEventListener('touchmove', onTouchMove as EventListener);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [applyProgress, useWindowScroll]);

  const media =
    mediaType === 'video' ? (
      <video
        ref={mediaRef}
        className={`absolute inset-0 w-full h-full object-cover origin-center select-none [will-change:transform] ${mediaClassName}`}
        style={mediaObjectPosition ? { objectPosition: mediaObjectPosition } : undefined}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={mediaRef}
        className={`absolute inset-0 w-full h-full object-cover origin-center select-none [will-change:transform] ${mediaClassName}`}
        style={mediaObjectPosition ? { objectPosition: mediaObjectPosition } : undefined}
        src={src}
        alt={alt}
        draggable={false}
      />
    );

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full ${useWindowScroll ? '' : 'overflow-y-auto overflow-x-hidden overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div ref={trackRef} className="relative w-full">
        <div ref={stageRef} className="sticky top-0 w-full overflow-hidden [--se-title-size:4rem]">
          <div
            ref={frameRef}
            className="absolute inset-0 opacity-0 [will-change:clip-path,opacity]"
          >
            {media}
            <div
              ref={scrimRef}
              className="absolute inset-0 opacity-0 pointer-events-none bg-[linear-gradient(to_top,rgba(11,16,32,0.72),rgba(11,16,32,0.25)_45%,rgba(11,16,32,0.45))]"
            />
            {children ? (
              <div
                ref={overlayRef}
                className="absolute inset-0 flex flex-col items-center justify-center text-center p-[6%] opacity-0 pointer-events-none [will-change:opacity,transform]"
              >
                {children}
              </div>
            ) : null}
          </div>
          {title ? (
            <div
              ref={titleRef}
              className={`absolute inset-0 flex items-center justify-center m-0 px-[6%] text-center font-bold leading-none tracking-[-0.03em] ${
                titleClassName || 'text-slate-900 drop-shadow-[0_2px_18px_rgba(255,255,255,0.9)]'
              } [font-size:var(--se-title-size)] pointer-events-none [will-change:opacity,transform]`}
            >
              {title}
            </div>
          ) : null}
          {scrollHint ? (
            <div
              ref={hintRef}
              className="absolute inset-x-0 bottom-6 text-center text-xs sm:text-sm font-semibold tracking-wider text-slate-800 uppercase bg-white/70 backdrop-blur-xs py-1 px-3 rounded-full mx-auto w-fit shadow-xs pointer-events-none [will-change:opacity,transform]"
            >
              {scrollHint}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ScrollExpand;
