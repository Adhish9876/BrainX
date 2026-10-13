'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Image as ImageIcon, X } from 'lucide-react';
import type { PictureGroup } from '@/lib/types';

type View = { groupId: string; image: number };

/**
 * Fixed-size event photo cards with category pills and an accessible lightbox modal.
 */
export default function Gallery({ groups }: { groups: PictureGroup[] }) {
  const [view, setView] = useState<View | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const displayGroups = useMemo<PictureGroup[]>(() => {
    const isDefaultPlaceholders =
      groups.length === 2 &&
      groups[0]?.id === 'demo-gallery' &&
      groups[0]?.name.includes('placeholder') &&
      groups[1]?.name.includes('placeholder');

    if (!isDefaultPlaceholders) {
      return groups;
    }

    return [
      {
        ...groups[0],
        tags: groups[0].tags?.length ? groups[0].tags : ['EVENTS'],
      },
      {
        ...groups[1],
        tags: groups[1].tags?.length ? groups[1].tags : ['CELEBRATIONS'],
      },
    ];
  }, [groups]);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const group of displayGroups) {
      const groupTags =
        group.tags && group.tags.length > 0 ? group.tags : ['EVENTS'];
      for (const raw of groupTags) {
        const clean = raw.trim().toUpperCase();
        if (clean && !seen.has(clean)) {
          seen.add(clean);
          list.push(clean);
        }
      }
    }
    return list;
  }, [displayGroups]);

  const filteredGroups = useMemo(() => {
    if (activeCategory === 'ALL') return displayGroups;
    return displayGroups.filter((group) => {
      const groupTags =
        group.tags && group.tags.length > 0 ? group.tags : ['EVENTS'];
      return groupTags.some((t) => t.trim().toUpperCase() === activeCategory);
    });
  }, [displayGroups, activeCategory]);

  const currentGroup = useMemo(
    () =>
      view
        ? displayGroups.find((g) => g.id === view.groupId) ?? null
        : null,
    [displayGroups, view],
  );

  const step = useCallback(
    (delta: number) => {
      setView((prev) => {
        if (!prev) return prev;
        const group = displayGroups.find((g) => g.id === prev.groupId);
        if (!group || group.images.length === 0) return prev;
        const count = group.images.length;
        return {
          groupId: prev.groupId,
          image: (prev.image + delta + count) % count,
        };
      });
    },
    [displayGroups],
  );

  const total = currentGroup?.images.length ?? 0;

  return (
    <>
      {categories.length > 1 ? (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2.5">
          {['ALL', ...categories].map((category) => {
            const isSelected = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                  isSelected
                    ? 'border-[#ea580c] bg-[#ea580c] text-white shadow-[0_2px_10px_-2px_rgba(234,88,12,0.4)]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-[#ea580c]'
                }`}
              >
                {category === 'ALL' ? 'All' : category}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGroups.map((group) => {
          const groupTags =
            group.tags && group.tags.length > 0 ? group.tags : ['EVENTS'];
          return (
            <li key={group.id}>
              <button
                type="button"
                disabled={group.images.length === 0}
                aria-label={`View gallery ${group.name}`}
                onClick={(event) => {
                  triggerRef.current = event.currentTarget;
                  const thumbnailIndex = group.images.indexOf(group.thumbnail);
                  setView({
                    groupId: group.id,
                    image: Math.max(0, thumbnailIndex),
                  });
                }}
                className="group flex h-[380px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/85 bg-white text-left shadow-[0_4px_20px_-4px_rgba(15,23,42,0.07),0_2px_6px_-1px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.13)] disabled:cursor-default"
              >
                {/* Fixed-height Top Cover Image */}
                <span className="relative block h-[220px] w-full shrink-0 overflow-hidden bg-slate-100">
                  {group.images.length ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={group.thumbnail || group.images[0]}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : null}
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                    <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                    {group.images.length}
                  </span>
                </span>

                {/* Fixed-height Card Body */}
                <span className="flex flex-1 flex-col justify-between p-5">
                  <span className="block min-w-0">
                    <span className="block truncate font-sans text-[1.1rem] font-bold tracking-tight text-[#0c3b6e]">
                      {group.name}
                    </span>
                    {group.description ? (
                      <span className="mt-1.5 line-clamp-2 block text-[0.88rem] leading-relaxed text-slate-600">
                        {group.description}
                      </span>
                    ) : null}
                  </span>

                  <span className="mt-auto flex flex-wrap items-center gap-1.5 pt-2.5">
                    {groupTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full border border-slate-200/90 bg-[#f1f5f9] px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-[#17468a]"
                      >
                        {tag}
                      </span>
                    ))}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog.Root
        open={view !== null}
        onOpenChange={(open) => !open && setView(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm data-[state=open]:animate-overlay-in" />
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
            className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,64rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-navy-800/40 bg-navy-950/95 p-3 shadow-2xl focus:outline-none data-[state=open]:animate-content-in"
          >
            <Dialog.Title className="sr-only">
              {currentGroup
                ? `${currentGroup.name} — image ${(view?.image ?? 0) + 1} of ${total}`
                : 'Gallery'}
            </Dialog.Title>
            {currentGroup ? (
              <Dialog.Description className="sr-only">
                Use the left and right arrow keys to move between images, and
                Escape to close.
              </Dialog.Description>
            ) : null}

            <div className="relative grid place-items-center rounded-lg bg-black/20 p-2">
              {currentGroup && view ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${currentGroup.id}-${view.image}`}
                  src={currentGroup.images[view.image]}
                  alt={`${currentGroup.name} — image ${view.image + 1} of ${total}`}
                  className="mx-auto block max-h-[76vh] w-auto max-w-full rounded object-contain"
                />
              ) : null}

              {total > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-navy-800 transition-colors hover:bg-paper"
                  >
                    <ChevronLeft className="h-6 w-6" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-navy-800 transition-colors hover:bg-paper"
                  >
                    <ChevronRight className="h-6 w-6" aria-hidden />
                  </button>
                </>
              ) : null}

              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close gallery"
                  className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-paper/90 text-navy-800 transition-colors hover:bg-paper"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </Dialog.Close>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 text-sm text-paper">
              <div>
                <span className="font-medium">{currentGroup?.name}</span>
                {currentGroup?.description ? (
                  <span className="ml-2 text-xs text-paper/70">
                    — {currentGroup.description}
                  </span>
                ) : null}
              </div>
              <span aria-live="polite" className="tabular-nums text-paper/70">
                {(view?.image ?? 0) + 1} / {total}
              </span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

