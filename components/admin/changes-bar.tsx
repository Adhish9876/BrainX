'use client';

import * as React from 'react';
import { ChevronUp, Loader2, RotateCcw, UploadCloud } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import type { Change } from './lib/diff';

function describe(change: Change): string {
  switch (change.kind) {
    case 'site':
      return `Site settings · ${change.label}`;
    case 'add':
      return `Added ${change.label}`;
    case 'remove':
      return `Removed ${change.label}`;
    case 'update':
      return `Updated ${change.label}`;
    case 'reorder':
      return `Reordered ${change.label}`;
  }
}

interface ChangesBarProps {
  changes: Change[];
  publishing: boolean;
  disabled?: boolean;
  onReset: () => void;
  onPublish: () => void;
}

/** Sticky status bar summarising staged changes with reset / publish actions. */
export function ChangesBar({
  changes,
  publishing,
  disabled,
  onReset,
  onPublish,
}: ChangesBarProps) {
  const [expanded, setExpanded] = React.useState(false);
  const count = changes.length;

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
      {expanded ? (
        <div className="mx-auto max-h-56 max-w-6xl overflow-y-auto border-b border-slate-100 px-4 py-3 sm:px-6">
          <ul className="space-y-1 text-sm text-slate-600">
            {changes.map((change, index) => (
              <li key={index} className="flex items-center gap-2">
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    change.kind === 'remove'
                      ? 'bg-red-500'
                      : change.kind === 'add'
                        ? 'bg-emerald-500'
                        : 'bg-navy-700',
                  )}
                />
                {describe(change)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <button
          type="button"
          className="flex items-center gap-2 text-left text-sm font-medium text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 focus-visible:ring-offset-2"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <ChevronUp
            className={cn('size-4 text-slate-600 transition-transform', expanded && 'rotate-180')}
          />
          You’ve made {count} {count === 1 ? 'change' : 'changes'}
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={disabled || publishing}
            onClick={onReset}
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
          <Button
            type="button"
            disabled={disabled || publishing}
            onClick={onPublish}
          >
            {publishing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            {publishing ? 'Publishing…' : 'Publish changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
