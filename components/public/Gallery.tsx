'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Images, Plus, X } from 'lucide-react';
import type { PictureGroup } from '@/lib/types';

/**
 * Placeholder galleries shown until real event galleries are uploaded from the admin page.
 * They disappear automatically as soon as one real (non-demo) group exists.
 */
const PLACEHOLDER_GROUPS: PictureGroup[] = [
  {
    id: 'placeholder-event-1',
    name: 'Your first event gallery.',
    date: '',
    description:
      'Photos from a lab event will appear here once a gallery is added from the admin page.',
    thumbnail: '/media/pictures/demo_pic/photo-01.webp',
    images: [
      '/media/pictures/demo_pic/photo-01.webp',
      '/media/pictures/demo_pic/photo-02.webp',
      '/media/pictures/demo_pic/photo-03.webp',
      '/media/pictures/demo_pic/photo-04.webp',
    ],
  },
  {
    id: 'placeholder-event-2',
    name: 'Another moment, captured.',
    date: '',
    description:
      'Each event gets its own gallery. Click a card to open every photo from that day.',
    thumbnail: '/media/pictures/demo_pic/photo-05.webp',
    images: [
      '/media/pictures/demo_pic/photo-05.webp',
      '/media/pictures/demo_pic/photo-06.webp',
      '/media/pictures/demo_pic/photo-07.webp',
    ],
  },
];

const DEMO_IDS = new Set(['demo_pic', 'demo-gallery']);

function isDemoGroup(group: PictureGroup): boolean {
  return DEMO_IDS.has(group.id) || /placeholder/i.test(group.name);
}

type View = { groupId: string; image: number };

export default function Gallery({ groups }: { groups: PictureGroup[] }) {
  const displayGroups = useMemo(() => {
    const real = groups.filter((group) => !isDemoGroup(group) && group.images.length > 0);
    return real.length > 0 ? real : PLACEHOLDER_GROUPS;
  }, [groups]);

  const [view, setView] = useState<View | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges, displayGroups]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const amount = (card?.offsetWidth ?? 600) + 24;
    el.scrollBy({ left: dir * amount, behavior: 'smooth' });
  };

  const currentGroup = view ? displayGroups.find((g) => g.id === view.groupId) ?? null : null;
  const total = currentGroup?.images.length ?? 0;

  const step = useCallback(
    (delta: number) => {
      setView((prev) => {
        if (!prev) return prev;
        const group = displayGroups.find((g) => g.id === prev.groupId);
        if (!group || group.images.length === 0) return prev;
        const count = group.images.length;
        return { groupId: prev.groupId, image: (prev.image + delta + count) % count };
      });
    },
    [displayGroups],
  );

  return (
    <>
      {/* Carousel controls */}
      <div className="shell mb-4 flex items-center justify-end gap-2">
        {(['prev', 'next'] as const).map((dir) => {
          const disabled = dir === 'prev' ? edge.start : edge.end;
          return (
            <button
              key={dir}
              type="button"
              onClick={() => scrollByCard(dir === 'next' ? 1 : -1)}
              disabled={disabled}
              aria-label={dir === 'next' ? 'Scroll to next galleries' : 'Scroll to previous galleries'}
              className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-[#1d1d1f] shadow-sm transition-all hover:border-[#1d1d1f] hover:bg-[#1d1d1f] hover:text-white disabled:pointer-events-none disabled:opacity-35 cursor-pointer"
            >
              {dir === 'next' ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          );
        })}
      </div>

      {/* Horizontal, snap-scrolling row of big cards that bleeds off the right edge */}
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        style={{
          paddingInline: 'max(1.25rem, calc((100% - 76rem) / 2 + 2.5rem))',
          scrollPaddingInline: 'max(1.25rem, calc((100% - 76rem) / 2 + 2.5rem))',
          scrollbarWidth: 'none',
        }}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden"
      >
        {displayGroups.map((group, index) => (
          <motion.button
            key={group.id}
            data-card
            type="button"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 + index * 0.1, ease: [0.22, 1, 0.36, 1] }}
            aria-label={`Open gallery: ${group.name}`}
            onClick={(event) => {
              triggerRef.current = event.currentTarget;
              const thumbIndex = group.images.indexOf(group.thumbnail);
              setView({ groupId: group.id, image: Math.max(0, thumbIndex) });
            }}
            className="group w-[82vw] shrink-0 snap-start text-left focus:outline-none sm:w-[560px] lg:w-[680px] cursor-pointer"
          >
            <span className="relative block aspect-[16/11] w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-slate-100 shadow-[0_2px_4px_rgba(11,16,32,0.04),0_24px_50px_-24px_rgba(11,16,32,0.35)] transition-shadow duration-500 group-hover:shadow-[0_2px_4px_rgba(11,16,32,0.05),0_34px_64px_-24px_rgba(11,16,32,0.45)] group-focus-visible:ring-2 group-focus-visible:ring-navy-600 group-focus-visible:ring-offset-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={group.thumbnail || group.images[0]}
                alt=""
                loading={index === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                <Images className="h-3.5 w-3.5" aria-hidden />
                {group.images.length} {group.images.length === 1 ? 'photo' : 'photos'}
              </span>

              <span
                aria-hidden="true"
                className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-white/85 text-[#1d1d1f] shadow-lg backdrop-blur-md transition-all duration-300 group-hover:rotate-90 group-hover:bg-white"
              >
                <Plus className="h-5 w-5" />
              </span>
            </span>

            <span className="mt-5 block max-w-xl px-1 text-[1.05rem] leading-snug">
              <strong className="font-semibold text-[#1d1d1f]">{group.name}</strong>{' '}
              {group.description ? <span className="text-slate-500">{group.description}</span> : null}
            </span>
          </motion.button>
        ))}
        {/* trailing spacer so the last card can snap fully into view */}
        <span aria-hidden="true" className="w-1 shrink-0" />
      </div>

      {/* ── Event modal ─────────────────────────────────────────────────── */}
      <Dialog.Root open={view !== null} onOpenChange={(open) => !open && setView(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl data-[state=open]:animate-overlay-in" />
          <Dialog.Content
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              triggerRef.current?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                step(-1);
              } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                step(1);
              }
            }}
            className="fixed inset-0 z-50 flex flex-col px-4 pb-4 pt-5 text-white focus:outline-none sm:px-8 data-[state=open]:animate-content-in"
          >
            <Dialog.Title className="sr-only">
              {currentGroup ? `${currentGroup.name} — photo ${(view?.image ?? 0) + 1} of ${total}` : 'Gallery'}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Use the left and right arrow keys to move between photos, and Escape to close.
            </Dialog.Description>

            {/* Top bar */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold tracking-tight sm:text-2xl">
                  {currentGroup?.name}
                </p>
                {currentGroup?.description ? (
                  <p className="mt-1 line-clamp-2 max-w-2xl text-sm text-white/60">
                    {currentGroup.description}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span aria-live="polite" className="font-mono text-xs font-semibold tabular-nums text-white/60">
                  {String((view?.image ?? 0) + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                </span>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close gallery"
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 cursor-pointer"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Stage */}
            <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {currentGroup && view ? (
                  <motion.img
                    key={`${currentGroup.id}-${view.image}`}
                    src={currentGroup.images[view.image]}
                    alt={`${currentGroup.name} — photo ${view.image + 1} of ${total}`}
                    initial={{ opacity: 0, scale: 0.985 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    draggable={false}
                    className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
                  />
                ) : null}
              </AnimatePresence>

              {total > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous photo"
                    className="absolute left-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black cursor-pointer sm:left-2"
                  >
                    <ChevronLeft className="h-6 w-6" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next photo"
                    className="absolute right-0 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black cursor-pointer sm:right-2"
                  >
                    <ChevronRight className="h-6 w-6" aria-hidden />
                  </button>
                </>
              ) : null}
            </div>

            {/* Thumbnails */}
            {currentGroup && total > 1 ? (
              <ul
                className="mx-auto mt-4 flex max-w-full gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none' }}
              >
                {currentGroup.images.map((src, i) => (
                  <li key={`${src}-${i}`} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setView({ groupId: currentGroup.id, image: i })}
                      aria-label={`Show photo ${i + 1}`}
                      aria-current={view?.image === i}
                      className={`block h-10 w-14 sm:h-14 sm:w-20 overflow-hidden rounded-lg border-2 transition-all cursor-pointer ${
                        view?.image === i
                          ? 'border-white opacity-100'
                          : 'border-transparent opacity-50 hover:opacity-90'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
