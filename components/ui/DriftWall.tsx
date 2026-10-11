'use client';

import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface DriftWallItem {
  image: string;
  title?: string;
  subtitle?: string;
  href?: string;
}

export interface DriftWallProps {
  items?: DriftWallItem[];
  columns?: number;
  tileWidth?: number;
  tileHeight?: number;
  gap?: number;
  radius?: number;
  tilt?: number;
  turn?: number;
  roll?: number;
  perspective?: number;
  depth?: number;
  speed?: number;
  direction?: 'up' | 'down';
  variance?: number;
  parallax?: number;
  pauseOnHover?: boolean;
  expandOnClick?: boolean;
  lift?: number;
  fade?: number;
  dim?: number;
  grayscale?: boolean;
  overlayColor?: string;
  className?: string;
  style?: CSSProperties;
}

interface ColumnMeta {
  copyHeight: number;
  copies: number;
}

const DEFAULT_ITEMS: DriftWallItem[] = Array.from({ length: 15 }, (_, i) => ({
  image: '',
  title: `Placeholder ${i + 1}`,
  href: undefined
}));

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ');

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const columnFactor = (index: number, variance: number): number => {
  const pseudo = ((index * 0.6180339887 + 0.35) % 1) * 2 - 1;
  return 1 + variance * pseudo;
};

const DriftWall = ({
  items = DEFAULT_ITEMS,
  columns = 5,
  tileWidth = 200,
  tileHeight = 132,
  gap = 18,
  radius = 14,
  tilt = 16,
  turn = -14,
  roll = 0,
  perspective = 1200,
  depth = 120,
  speed = 42,
  direction = 'up',
  variance = 0.45,
  parallax = 0.6,
  pauseOnHover = false,
  expandOnClick = true,
  lift = 64,
  fade = 0.6,
  dim = 0.55,
  grayscale = false,
  overlayColor = '#060010',
  className = '',
  style
}: DriftWallProps) => {
  const resolvedItems = items && items.length ? items : DEFAULT_ITEMS;

  // Unique gallery items for the expanded lightbox
  const galleryItems = useMemo(() => {
    const withImages = resolvedItems.filter(item => Boolean(item.image));
    if (withImages.length === 0) return resolvedItems;
    const seen = new Set<string>();
    const unique: DriftWallItem[] = [];
    for (const item of withImages) {
      if (!seen.has(item.image)) {
        seen.add(item.image);
        unique.push(item);
      }
    }
    return unique.length > 0 ? unique : resolvedItems;
  }, [resolvedItems]);

  const containerRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const trackRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  const offsetsRef = useRef<number[]>([]);
  const velocitiesRef = useRef<number[]>([]);
  const hoveredColRef = useRef<number>(-1);
  const wallHoveredRef = useRef<boolean>(false);
  const pointerRef = useRef({ x: 0, y: 0 });
  const pointerDampedRef = useRef({ x: 0, y: 0 });
  const lastTsRef = useRef<number | null>(null);

  const [containerHeight, setContainerHeight] = useState(600);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(null);
  const [reduced, setReduced] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const expandedRef = useRef(false);
  expandedRef.current = expandedIndex !== null;

  useEffect(() => {
    setReduced(prefersReducedMotion());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const columnItems = useMemo<DriftWallItem[][]>(() => {
    const cols: DriftWallItem[][] = Array.from({ length: columns }, () => []);
    resolvedItems.forEach((item, i) => cols[i % columns].push(item));
    return cols.map(col => (col.length ? col : resolvedItems.slice(0, 1)));
  }, [resolvedItems, columns]);

  const columnMeta = useMemo<ColumnMeta[]>(() => {
    const unit = tileHeight + gap;
    return columnItems.map(col => {
      const copyHeight = Math.max(unit, col.length * unit);
      const copies = Math.max(2, Math.ceil((containerHeight * 1.6) / copyHeight) + 1);
      return { copyHeight, copies };
    });
  }, [columnItems, tileHeight, gap, containerHeight]);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height || 600);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const baseVelocities = useMemo<number[]>(() => {
    const dirSign = direction === 'up' ? 1 : -1;
    return columnItems.map((_, c) => {
      const altSign = c % 2 === 0 ? 1 : -1;
      return speed * columnFactor(c, variance) * dirSign * altSign;
    });
  }, [columnItems, speed, direction, variance]);

  useEffect(() => {
    offsetsRef.current = columnMeta.map((meta, c) => meta.copyHeight * ((c * 0.37) % 1));
    velocitiesRef.current = columnItems.map(() => 0);
  }, [columnMeta, columnItems]);

  const applyPlaneTransform = useCallback(
    (px: number, py: number) => {
      const plane = planeRef.current;
      if (!plane) return;
      plane.style.transform =
        `translate(-50%, -50%) scale(1.18) ` +
        `rotateX(${tilt + py}deg) rotateY(${turn + px}deg) rotateZ(${roll}deg) ` +
        `translateZ(${-depth}px)`;
    },
    [tilt, turn, roll, depth]
  );

  useEffect(() => {
    const animate = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = Math.min(0.05, Math.max(0, ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const maxTilt = parallax * 8;
      const targetX = pointerRef.current.x * maxTilt;
      const targetY = -pointerRef.current.y * maxTilt;
      const damp = 1 - Math.exp(-dt / 0.12);
      pointerDampedRef.current.x += (targetX - pointerDampedRef.current.x) * damp;
      pointerDampedRef.current.y += (targetY - pointerDampedRef.current.y) * damp;
      applyPlaneTransform(pointerDampedRef.current.x, pointerDampedRef.current.y);

      if (!reduced) {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const meta = columnMeta[c];
          if (!meta) continue;
          const paused = expandedRef.current || (wallHoveredRef.current && pauseOnHover);
          const factor = paused || hoveredColRef.current === c ? 0 : 1;
          const target = baseVelocities[c] * factor;

          const ease = 1 - Math.exp(-dt / (target === 0 ? 0.16 : 0.28));
          velocitiesRef.current[c] += (target - velocitiesRef.current[c]) * ease;
          let next = (offsetsRef.current[c] ?? 0) + velocitiesRef.current[c] * dt;
          next = ((next % meta.copyHeight) + meta.copyHeight) % meta.copyHeight;
          offsetsRef.current[c] = next;

          const el = trackRefs.current[c];
          if (el) el.style.transform = `translate3d(0, ${-next}px, 0)`;
        }
      } else {
        for (let c = 0; c < trackRefs.current.length; c++) {
          const el = trackRefs.current[c];
          const meta = columnMeta[c];
          if (el && meta) el.style.transform = `translate3d(0, ${-(offsetsRef.current[c] ?? 0)}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTsRef.current = null;
    };
  }, [baseVelocities, columnMeta, pauseOnHover, parallax, reduced, applyPlaneTransform]);

  const activate = useCallback((id: string, index: number): void => {
    activeIdRef.current = id;
    hoveredColRef.current = index;
    setActiveId(id);
  }, []);
  const release = useCallback((): void => {
    activeIdRef.current = null;
    hoveredColRef.current = -1;
    setActiveId(null);
  }, []);

  const stepExpanded = useCallback(
    (delta: number) => {
      setExpandedIndex(prev => {
        if (prev === null) return null;
        const total = galleryItems.length;
        return (prev + delta + total) % total;
      });
    },
    [galleryItems.length]
  );

  const openExpanded = useCallback(
    (item: DriftWallItem, fallbackIdx: number) => {
      if (!expandOnClick) return;
      if (item.image) {
        const idx = galleryItems.findIndex(g => g.image === item.image);
        setExpandedIndex(idx >= 0 ? idx : 0);
      } else {
        setExpandedIndex(fallbackIdx % galleryItems.length);
      }
    },
    [expandOnClick, galleryItems]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (parallax > 0 && !reduced) {
        pointerRef.current = {
          x: (e.clientX - rect.left) / rect.width - 0.5,
          y: (e.clientY - rect.top) / rect.height - 0.5
        };
      }
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const tile = hit && hit.closest ? (hit.closest('[data-tile-id]') as HTMLElement | null) : null;
      if (!tile) return;
      const id = tile.dataset.tileId ?? null;
      if (id === activeIdRef.current) return;
      activeIdRef.current = id;
      hoveredColRef.current = Number(tile.dataset.col);
      setActiveId(id);
    },
    [parallax, reduced]
  );

  const handlePointerLeaveWall = useCallback((): void => {
    wallHoveredRef.current = false;
    pointerRef.current = { x: 0, y: 0 };
    release();
  }, [release]);

  const maskStyle =
    'radial-gradient(ellipse 78% 82% at 50% 46%, #000 var(--dw-edge), transparent 100%), ' +
    'linear-gradient(to top, #000 var(--dw-edge), transparent 100%)';

  const cssVars = useMemo<CSSProperties>(
    () =>
      ({
        '--dw-tile-w': `${tileWidth}px`,
        '--dw-tile-h': `${tileHeight}px`,
        '--dw-gap': `${gap}px`,
        '--dw-radius': `${radius}px`,
        '--dw-lift': `${lift}px`,
        '--dw-dim': dim,
        '--dw-gray': grayscale ? 1 : 0,
        '--dw-overlay': overlayColor,
        '--dw-edge': `${Math.max(0, (1 - fade) * 100)}%`,
        perspective: `${perspective}px`,
        perspectiveOrigin: '50% 50%',
        WebkitMaskImage: maskStyle,
        maskImage: maskStyle,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
        ...style
      }) as CSSProperties,
    [tileWidth, tileHeight, gap, radius, lift, dim, grayscale, overlayColor, fade, perspective, maskStyle, style]
  );

  const tileClass = cx(
    'group/tile relative block flex-none cursor-pointer outline-none',
    'w-full h-[calc(var(--dw-tile-h)+var(--dw-gap))] [transform-style:preserve-3d]'
  );
  const innerClass = cx(
    'pointer-events-none absolute inset-[calc(var(--dw-gap)/2)] block overflow-hidden border border-ink/15 bg-white shadow-[0_8px_24px_-8px_rgba(11,16,32,0.08)]',
    'rounded-[var(--dw-radius)] opacity-[var(--dw-dim)] [transform:translateZ(0)]',
    'transition-[transform,opacity,box-shadow,border-color] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:opacity-100 group-[.is-active]/tile:border-ink/35 group-[.is-active]/tile:[transform:translateZ(var(--dw-lift))]',
    'group-[.is-active]/tile:shadow-[0_24px_60px_-18px_rgba(11,16,32,0.22)]',
    'group-focus-visible/tile:opacity-100 group-focus-visible/tile:[transform:translateZ(var(--dw-lift))]',
    'group-focus-visible/tile:shadow-[0_24px_60px_-18px_rgba(11,16,32,0.22),0_0_0_2px_rgba(11,16,32,0.8)]'
  );
  const imgClass = cx(
    'block h-full w-full select-none object-cover',
    '[filter:grayscale(var(--dw-gray))_saturate(0.92)]',
    'transition-[filter] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:[filter:grayscale(0)_saturate(1.05)] group-focus-visible/tile:[filter:grayscale(0)_saturate(1.05)]'
  );
  const overlayClass = cx(
    'pointer-events-none absolute inset-0 bg-[var(--dw-overlay)] opacity-[0.15]',
    'transition-opacity duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'group-[.is-active]/tile:opacity-0 group-focus-visible/tile:opacity-0'
  );

  const renderTile = (item: DriftWallItem, id: string, colIndex: number, itemIndex: number) => {
    const inner = (
      <span className={innerClass}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.title ?? ''}
            loading="lazy"
            decoding="async"
            draggable={false}
            className={imgClass}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-xs font-medium uppercase tracking-[0.22em] text-ink/50">
            Placeholder
          </span>
        )}
        <span className={overlayClass} aria-hidden="true" />
      </span>
    );
    const commonProps = {
      className: cx(tileClass, activeId === id && 'is-active'),
      'data-tile-id': id,
      'data-col': colIndex,
      onFocus: () => activate(id, colIndex),
      onBlur: release,
      onClick: () => openExpanded(item, colIndex + itemIndex),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openExpanded(item, colIndex + itemIndex);
        }
      }
    };
    if (item.href && !expandOnClick) {
      return (
        <a key={id} href={item.href} target="_blank" rel="noreferrer noopener" {...commonProps}>
          {inner}
        </a>
      );
    }
    return (
      <div key={id} tabIndex={0} role="button" aria-label={item.title ?? 'Placeholder'} {...commonProps}>
        {inner}
      </div>
    );
  };

  const expandedItem = expandedIndex !== null ? galleryItems[expandedIndex] : null;

  return (
    <>
      <div
        ref={containerRef}
        className={cx('relative h-full w-full overflow-hidden', className)}
        style={cssVars}
        onPointerMove={handlePointerMove}
        onPointerEnter={() => {
          wallHoveredRef.current = true;
        }}
        onPointerLeave={handlePointerLeaveWall}
        role="group"
        aria-label="Drifting wall of tiles"
      >
        <div
          ref={planeRef}
          className="absolute left-1/2 top-1/2 flex cursor-pointer flex-row [transform-style:preserve-3d] [transform-origin:50%_50%] will-change-transform"
        >
          {columnItems.map((col, c) => {
            const meta = columnMeta[c];
            const copies = Array.from({ length: meta.copies });
            return (
              <div
                className="relative w-[calc(var(--dw-tile-w)+var(--dw-gap))] [transform-style:preserve-3d]"
                key={`col-${c}`}
              >
                <div
                  className="flex flex-col [transform-style:preserve-3d] will-change-transform"
                  ref={el => {
                    trackRefs.current[c] = el;
                  }}
                >
                  {copies.map((_, copyIndex) =>
                    col.map((item, itemIndex) =>
                      renderTile(item, `${c}-${copyIndex}-${itemIndex}`, c, itemIndex)
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Lightbox Modal */}
      <Dialog.Root open={expandedIndex !== null} onOpenChange={open => !open && setExpandedIndex(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-md data-[state=open]:animate-overlay-in" />
          <Dialog.Content
            onKeyDown={event => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                stepExpanded(-1);
              } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                stepExpanded(1);
              }
            }}
            className="fixed left-1/2 top-1/2 z-50 flex w-[min(95vw,72rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-ink/15 bg-paper p-4 text-ink shadow-2xl focus:outline-none md:p-6 data-[state=open]:animate-content-in"
          >
            <Dialog.Title className="sr-only">
              {expandedItem
                ? `${expandedItem.title || 'Placeholder'} — ${(expandedIndex ?? 0) + 1} of ${galleryItems.length}`
                : 'Expanded Image'}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Use the left and right arrow keys or buttons to toggle between images, and Escape to close.
            </Dialog.Description>

            {/* Main image stage */}
            <div className="relative flex min-h-[50vh] items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-white p-2 md:min-h-[65vh]">
              {expandedItem?.image ? (
                <img
                  key={expandedItem.image}
                  src={expandedItem.image}
                  alt={expandedItem.title || ''}
                  className="mx-auto block max-h-[68vh] w-auto max-w-full rounded-md object-contain select-none"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-sm font-medium uppercase tracking-[0.26em] text-ink/45">
                  Placeholder
                </div>
              )}

              {galleryItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => stepExpanded(-1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-ink/15 bg-paper/90 text-ink shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-ink hover:text-white"
                  >
                    <ChevronLeft className="h-6 w-6" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => stepExpanded(1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-ink/15 bg-paper/90 text-ink shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:bg-ink hover:text-white"
                  >
                    <ChevronRight className="h-6 w-6" aria-hidden />
                  </button>
                </>
              )}

              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close expanded view"
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-paper/90 text-ink shadow-sm backdrop-blur-sm transition-all hover:bg-ink hover:text-white"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </Dialog.Close>
            </div>

            {/* Caption + counter */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-1">
              <div>
                <p className="font-display text-xl text-ink">
                  {expandedItem?.image ? expandedItem.title || `Image ${(expandedIndex ?? 0) + 1}` : 'Placeholder'}
                </p>
                {expandedItem?.subtitle && (
                  <p className="mt-0.5 font-mono text-xs uppercase tracking-[0.14em] text-muted">
                    {expandedItem.subtitle}
                  </p>
                )}
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.18em] tabular-nums text-muted">
                {String((expandedIndex ?? 0) + 1).padStart(2, '0')} / {String(galleryItems.length).padStart(2, '0')}
              </span>
            </div>

            {/* Thumbnail strip for quick toggling (scrollbar hidden) */}
            {galleryItems.length > 1 && (
              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {galleryItems.map((item, idx) => {
                  const isCurrent = idx === expandedIndex;
                  return (
                    <button
                      key={(item.image || 'placeholder') + idx}
                      type="button"
                      onClick={() => setExpandedIndex(idx)}
                      aria-label={`View image ${idx + 1}`}
                      className={`relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white transition-all ${
                        isCurrent
                          ? 'border-ink opacity-100 ring-2 ring-ink/20'
                          : 'border-ink/15 opacity-55 hover:opacity-90'
                      }`}
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink/55">
                          Placeholder
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default DriftWall;
