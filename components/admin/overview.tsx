'use client';

import * as React from 'react';
import {
  ArrowRight,
  Calendar,
  FileText,
  FlaskConical,
  FolderKanban,
  Images,
  Lightbulb,
  Newspaper,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';

import type { Content } from '@/lib/types';
import { cn } from '@/lib/utils';

import { COLLECTIONS, COLLECTION_LABELS, COLLECTION_SINGULAR, type Collection } from './lib/content-types';

type Icon = React.ComponentType<{ className?: string }>;

/** One accent per section, reused by the sidebar so the whole admin feels colour-coded. */
export const SECTION_TINT: Record<Collection | 'site' | 'overview', { tile: string; text: string; ring: string; blob: string }> = {
  overview: { tile: 'bg-navy-700 text-white', text: 'text-navy-700', ring: 'hover:border-navy-300', blob: 'bg-navy-100' },
  site: { tile: 'bg-slate-200 text-slate-700', text: 'text-slate-700', ring: 'hover:border-slate-300', blob: 'bg-slate-100' },
  publications: { tile: 'bg-indigo-100 text-indigo-700', text: 'text-indigo-700', ring: 'hover:border-indigo-300', blob: 'bg-indigo-100' },
  team: { tile: 'bg-sky-100 text-sky-700', text: 'text-sky-700', ring: 'hover:border-sky-300', blob: 'bg-sky-100' },
  research: { tile: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700', ring: 'hover:border-emerald-300', blob: 'bg-emerald-100' },
  projects: { tile: 'bg-amber-100 text-amber-700', text: 'text-amber-700', ring: 'hover:border-amber-300', blob: 'bg-amber-100' },
  events: { tile: 'bg-rose-100 text-rose-700', text: 'text-rose-700', ring: 'hover:border-rose-300', blob: 'bg-rose-100' },
  news: { tile: 'bg-violet-100 text-violet-700', text: 'text-violet-700', ring: 'hover:border-violet-300', blob: 'bg-violet-100' },
  pictures: { tile: 'bg-teal-100 text-teal-700', text: 'text-teal-700', ring: 'hover:border-teal-300', blob: 'bg-teal-100' },
};

const ICONS: Record<Collection, Icon> = {
  publications: FileText,
  team: Users,
  research: FlaskConical,
  projects: FolderKanban,
  events: Calendar,
  news: Newspaper,
  pictures: Images,
};

const BLURB: Record<Collection, string> = {
  publications: 'Papers, journals and conference work',
  team: 'The people behind the lab',
  research: 'Research themes and diagrams',
  projects: 'In-house and student builds',
  events: 'Talks, workshops and lab days',
  news: 'Announcements and milestones',
  pictures: 'Photo galleries from lab life',
};

const TIPS = [
  'Photos with a white or transparent background blend best into the equipment-partners section.',
  'Give each team member a short tag, like “JRF · Ph.D. Scholar”. It shows on their photo card.',
  'The first photo you star on a project becomes its cover in the project carousel.',
  'Add an event with a photo and it appears in the home-page events carousel automatically.',
  'Set the grant amount in Site settings and the home page counts up to it.',
  'Your edits stay in this browser until you publish, so feel free to experiment.',
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

interface OverviewProps {
  content: Content;
  changeCount: number;
  onOpen: (section: Collection | 'site') => void;
  onNew: (collection: Collection) => void;
}

/** Friendly landing page: greeting, quick-add shortcuts, live counts and a tip. */
export function Overview({ content, changeCount, onOpen, onNew }: OverviewProps) {
  const tip = TIPS[new Date().getDate() % TIPS.length];

  return (
    <div className="space-y-6">
      {/* Greeting banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-24px_rgba(15,23,42,0.25)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/team_bg.png" alt="" className="h-full w-full object-cover object-left opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/30" />
        </div>
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 font-mono text-[0.68rem] font-bold uppercase tracking-[0.18em] text-navy-700 shadow-sm backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden />
            BrainX Lab admin
          </p>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {greeting()}! What shall we add today?
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {changeCount > 0
              ? `You have ${changeCount} unpublished ${changeCount === 1 ? 'change' : 'changes'}. Publish when you are happy with them.`
              : 'Everything is published and up to date. Pick something below to get started.'}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {COLLECTIONS.map((c) => {
              const Icon = ICONS[c];
              const tint = SECTION_TINT[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onNew(c)}
                  className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
                >
                  <span className={cn('grid size-7 place-items-center rounded-full', tint.tile)}>
                    <Icon className="size-3.5" />
                  </span>
                  <Plus className="size-3.5 text-slate-400 transition-transform group-hover:rotate-90" aria-hidden />
                  {COLLECTION_SINGULAR[c]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Live counts */}
      <section aria-label="Content overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {COLLECTIONS.map((c) => {
          const Icon = ICONS[c];
          const tint = SECTION_TINT[c];
          const count = (content[c] as unknown[]).length;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onOpen(c)}
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_-18px_rgba(15,23,42,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-700',
                tint.ring,
              )}
            >
              <span aria-hidden="true" className={cn('absolute -right-8 -top-8 size-28 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-100', tint.blob)} />
              <div className="relative flex items-start justify-between">
                <span className={cn('grid size-11 place-items-center rounded-2xl', tint.tile)}>
                  <Icon className="size-5" />
                </span>
                <span className="font-display text-4xl font-extrabold tracking-tight text-slate-900">{count}</span>
              </div>
              <p className="relative mt-4 font-semibold text-slate-900">{COLLECTION_LABELS[c]}</p>
              <p className="relative mt-0.5 text-sm text-slate-500">{BLURB[c]}</p>
              <span className={cn('relative mt-3 inline-flex items-center gap-1 text-xs font-bold', tint.text)}>
                Manage
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </button>
          );
        })}
      </section>

      {/* Tip of the day */}
      <section className="flex items-start gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 sm:items-center sm:p-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <Lightbulb className="size-4.5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-amber-950/80">
          <span className="font-bold text-amber-900">Tip: </span>
          {tip}
        </p>
      </section>
    </div>
  );
}
