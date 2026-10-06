'use client';

import { useCallback, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import type { PictureGroup } from '@/lib/types';
import { formatDate } from './format';

type View = { group: number; image: number };

/**
 * Picture groups with an accessible lightbox.
 *
 * Cards open a Radix Dialog: focus is trapped, Escape closes it, the image keeps
 * its aspect ratio, and previous/next are available as buttons and via the
 * left/right arrow keys.
 */
export default function Gallery({ groups }: { groups: PictureGroup[] }) {
  const [view, setView] = useState<View | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const step = useCallback(
    (delta: number) => {
      setView((prev) => {
        if (!prev) return prev;
        const group = groups[prev.group];
        if (!group || group.images.length === 0) return prev;
        const count = group.images.length;
        return { group: prev.group, image: (prev.image + delta + count) % count };
      });
    },
    [groups],
  );

  const currentGroup = view ? groups[view.group] : null;
  const total = currentGroup?.images.length ?? 0;

  return (
    <>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, groupIndex) => (
          <li key={group.id}>
            <button
              type="button"
              disabled={group.images.length === 0}
              aria-label={`View gallery ${group.name}`}
              onClick={(event) => {
                triggerRef.current = event.currentTarget;
                const thumbnailIndex = group.images.indexOf(group.thumbnail);
                setView({ group: groupIndex, image: Math.max(0, thumbnailIndex) });
              }}
              className="group block h-full w-full overflow-hidden rounded-lg border border-rule bg-surface text-left hover:border-navy-300 disabled:cursor-default"
            >
              <span className="relative block aspect-[4/3] overflow-hidden bg-navy-50">
                {group.images.length ? (
                  <img src={group.thumbnail || group.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : null}
                <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-paper/95 px-3 py-1.5 text-xs font-medium text-navy-800">
                  <Maximize2 className="h-3.5 w-3.5" aria-hidden />
                  {group.images.length} {group.images.length === 1 ? 'image' : 'images'}
                </span>
              </span>
              <span className="block p-5">
                {group.date ? <span className="mb-2 block text-xs uppercase tracking-wider text-muted">{formatDate(group.date)}</span> : null}
                <span className="block font-display text-xl tracking-tight text-ink">{group.name}</span>
                {group.description ? <span className="mt-2 block text-sm leading-relaxed text-muted">{group.description}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={view !== null} onOpenChange={(open) => !open && setView(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-950/80 backdrop-blur-sm data-[state=open]:animate-overlay-in" />
          <Dialog.Content
            onCloseAutoFocus={(event) => { event.preventDefault(); triggerRef.current?.focus(); }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') {
                event.preventDefault();
                step(-1);
              } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                step(1);
              }
            }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,64rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-navy-800/40 bg-navy-950/95 p-3 shadow-2xl focus:outline-none data-[state=open]:animate-content-in"
          >
            <Dialog.Title className="sr-only">
              {currentGroup ? `${currentGroup.name} — image ${(view?.image ?? 0) + 1} of ${total}` : 'Gallery'}
            </Dialog.Title>
            {currentGroup ? (
              <Dialog.Description className="sr-only">
                Use the left and right arrow keys to move between images, and Escape to close.
              </Dialog.Description>
            ) : null}

            <div className="relative grid place-items-center rounded bg-black/20 p-2">
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
              <span className="font-medium">{currentGroup?.name}</span>
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
