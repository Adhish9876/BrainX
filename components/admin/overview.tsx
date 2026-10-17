'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';

import type { Content } from '@/lib/types';
import { cn } from '@/lib/utils';

import { COLLECTIONS, COLLECTION_LABELS, type Collection } from './lib/content-types';

const DESCRIPTION: Record<Collection | 'site', string> = {
  site: 'Lab name, contact details, logo, grant funding, equipment partners',
  publications: 'Papers and journals, grouped by year',
  team: 'People in the lab, by role',
  research: 'Research themes and diagrams',
  projects: 'In-house and student projects',
  events: 'Talks, workshops and lab days',
  news: 'Announcements and milestones',
  pictures: 'Photo galleries',
};

interface OverviewProps {
  content: Content;
  changeCount: number;
  onOpen: (section: Collection | 'site') => void;
  onNew: (collection: Collection) => void;
}

/** Quiet start page: one status line, then a single list. Click a row to open that section. */
export function Overview({ content, changeCount, onOpen }: OverviewProps) {
  const rows: { key: Collection | 'site'; title: string; count: number | null }[] = [
    ...COLLECTIONS.map((c) => ({ key: c, title: COLLECTION_LABELS[c], count: (content[c] as unknown[]).length })),
    { key: 'site', title: 'Site settings', count: null },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">What would you like to edit?</h2>
        <p className="flex items-center gap-2 text-base text-slate-600">
          <span
            aria-hidden="true"
            className={cn('inline-block size-2.5 rounded-full', changeCount > 0 ? 'bg-amber-500' : 'bg-emerald-500')}
          />
          {changeCount > 0
            ? `${changeCount} ${changeCount === 1 ? 'change' : 'changes'} not published yet`
            : 'Everything is published'}
        </p>
      </header>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {rows.map((row) => (
          <li key={row.key}>
            <button
              type="button"
              onClick={() => onOpen(row.key)}
              className="group flex w-full items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy-700"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold text-slate-900">{row.title}</span>
                <span className="mt-0.5 block text-[0.95rem] text-slate-500">{DESCRIPTION[row.key]}</span>
              </span>
              {row.count !== null ? (
                <span className="text-lg font-medium tabular-nums text-slate-500">{row.count}</span>
              ) : null}
              <ChevronRight className="size-5 shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
