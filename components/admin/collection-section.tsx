'use client';

import * as React from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ImageOff,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { COLLECTION_LABELS, COLLECTION_SINGULAR, type Collection, type RecordValue } from './lib/content-types';
import { recordLabel } from './lib/content';
import { ConfirmDialog } from './confirm-dialog';

function summary(collection: Collection, record: RecordValue): string {
  const str = (key: string) =>
    typeof record[key] === 'string' || typeof record[key] === 'number' ? String(record[key]) : '';
  switch (collection) {
    case 'publications':
      return [str('authors'), str('year'), str('venue')].filter(Boolean).join(' · ');
    case 'team':
      return [str('role'), str('position')].filter(Boolean).join(' · ');
    case 'research':
      return str('description');
    case 'projects': {
      const isStudent = record.category === 'students' || record.category === 'student';
      const catLabel = isStudent ? 'Student Project' : 'In-House Project';
      const members =
        Array.isArray(record.members) && record.members.length > 0
          ? `${record.members.length} team ${record.members.length === 1 ? 'member' : 'members'}`
          : '';
      return [catLabel, members, str('description')].filter(Boolean).join(' · ');
    }
    case 'news':
    case 'events':
      return [str('date'), str('time'), str('venue')].filter(Boolean).join(' · ');
    case 'pictures': {
      const images = Array.isArray(record.images) ? record.images.length : 0;
      return [str('date'), `${images} ${images === 1 ? 'image' : 'images'}`]
        .filter(Boolean)
        .join(' · ');
    }
  }
}

function thumbFor(collection: Collection, record: RecordValue): string {
  if (collection === 'pictures') {
    return typeof record.thumbnail === 'string' ? record.thumbnail : '';
  }
  return typeof record.image === 'string' ? record.image : '';
}

function RecordThumb({ src }: { src: string }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  if (failed) return <ImageOff className="size-5 text-slate-600" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
  );
}

/** One photo for a publication year: add, replace or remove it. */
function YearPhoto({
  year,
  src,
  onChange,
  onUpload,
  disabled,
}: {
  year: number;
  src: string;
  onChange: (url: string) => void;
  onUpload?: (file: File) => Promise<string>;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handle = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !onUpload) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await onUpload(file));
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="group/photo relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={`${year} photo`} className="size-full object-cover" />
        ) : (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
            className="flex size-full flex-col items-center justify-center gap-1.5 border-2 border-dashed border-slate-300 text-slate-500 transition-colors hover:border-navy-400 hover:bg-white hover:text-navy-700 cursor-pointer"
          >
            {busy ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
            <span className="text-xs font-semibold">{busy ? 'Uploading…' : 'Add photo for ' + year}</span>
          </button>
        )}
        {src ? (
          <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1 opacity-0 transition-opacity group-hover/photo:opacity-100 focus-within:opacity-100">
            <Button type="button" size="sm" variant="secondary" disabled={disabled || busy} onClick={() => inputRef.current?.click()}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              Change
            </Button>
            <Button type="button" size="icon-sm" variant="secondary" aria-label={`Remove ${year} photo`} disabled={disabled || busy} onClick={() => onChange('')}>
              <Trash2 className="size-3.5 text-red-600" />
            </Button>
          </div>
        ) : null}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" tabIndex={-1} aria-hidden="true" onChange={(e) => void handle(e.target.files)} />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

interface CollectionSectionProps {
  collection: Collection;
  records: RecordValue[];
  onNew: (initialOverrides?: Partial<RecordValue>) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  disabled?: boolean;
  /** Publications only: photo per year, shown on the Publications timeline. */
  yearImages?: Record<string, string>;
  onYearImage?: (year: number, url: string) => void;
  onUpload?: (file: File) => Promise<string>;
}

/** List of records for one collection with create / edit / delete / reorder. */
export function CollectionSection({
  collection,
  records,
  onNew,
  onEdit,
  onDelete,
  onMove,
  disabled,
  yearImages = {},
  onYearImage,
  onUpload,
}: CollectionSectionProps) {
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
  const [projectTab, setProjectTab] = React.useState<'all' | 'inhouse' | 'students'>('all');

  const singular = COLLECTION_SINGULAR[collection];
  const pendingRecord = records.find((item) => item.id === pendingDelete);

  // When collection is projects, separate into inhouse and students
  const isProjects = collection === 'projects';
  const isPublications = collection === 'publications';
  const publicationYears = React.useMemo(() => {
    if (!isPublications) return [];
    const byYear = new Map<number, RecordValue[]>();
    for (const record of records) {
      const year = Number(record.year) || 0;
      byYear.set(year, [...(byYear.get(year) ?? []), record]);
    }
    return [...byYear.entries()].sort((a, b) => b[0] - a[0]).map(([year, items]) => ({ year, items }));
  }, [isPublications, records]);
  const inhouseProjects = React.useMemo(
    () => records.filter((r) => (r.category ?? 'inhouse') === 'inhouse'),
    [records],
  );
  const studentProjects = React.useMemo(
    () => records.filter((r) => r.category === 'students' || r.category === 'student'),
    [records],
  );

  const renderRecordItem = (
    record: RecordValue,
    index: number,
    totalCount: number,
    categoryBadge?: React.ReactNode,
  ) => {
    const id = String(record.id);
    const label = recordLabel(collection, record);
    const detail = summary(collection, record);
    const thumb = thumbFor(collection, record);

    return (
      <li
        key={id}
        className="group flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 pr-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_10px_24px_-14px_rgba(15,23,42,0.25)]"
      >
        <span className="hidden w-6 shrink-0 text-right font-mono text-xs font-bold text-slate-300 sm:block">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
          {thumb ? (
            <RecordThumb src={thumb} />
          ) : (
            <span className="font-display text-lg font-bold text-slate-400">
              {label.trim().charAt(0).toUpperCase() || '·'}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{label}</p>
            {categoryBadge}
          </div>
          {detail ? (
            <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{detail}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center rounded-lg bg-slate-100 p-0.5 sm:flex">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${label} up`}
              disabled={disabled || index === 0}
              onClick={() => onMove(id, -1)}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Move ${label} down`}
              disabled={disabled || index === totalCount - 1}
              onClick={() => onMove(id, 1)}
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label={`Edit ${label}`}
            disabled={disabled}
            onClick={() => onEdit(id)}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${label}`}
            className="text-slate-400 hover:bg-red-50 hover:text-red-600"
            disabled={disabled}
            onClick={() => setPendingDelete(id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── PROJECTS SPLIT VIEW (In-House & Students) ── */}
      {isProjects ? (
        <div className="space-y-6">
          {/* Top header bar & category filter tabs */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Projects
              </h2>
              <p className="text-sm text-slate-600">
                Manage and categorize lab projects into In-House research and Student innovation.
              </p>
            </div>

            {/* Quick Filter Tabs */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setProjectTab('all')}
                className={`rounded-md px-3 py-1.5 font-medium transition-all ${
                  projectTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectTab('inhouse')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  projectTab === 'inhouse'
                    ? 'bg-white text-sky-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="size-3.5" />
                In-House ({inhouseProjects.length})
              </button>
              <button
                type="button"
                onClick={() => setProjectTab('students')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
                  projectTab === 'students'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="size-3.5" />
                Students ({studentProjects.length})
              </button>
            </div>
          </div>

          {/* Section 1: In-House Projects */}
          {(projectTab === 'all' || projectTab === 'inhouse') && (
            <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">In-House Projects</h3>
                    <p className="text-xs text-slate-500">
                      {inhouseProjects.length} {inhouseProjects.length === 1 ? 'project' : 'projects'} · core lab neuro-engineering pipelines
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNew({ category: 'inhouse' })}
                  disabled={disabled}
                  className="border-sky-200 bg-white text-sky-800 hover:bg-sky-50"
                >
                  <Plus className="size-4 mr-1" />
                  New in-house project
                </Button>
              </div>

              {inhouseProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-sky-200 bg-white/60 p-8 text-center">
                  <p className="text-sm text-slate-600">
                    No in-house projects added yet.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 border-sky-200 text-sky-800"
                    onClick={() => onNew({ category: 'inhouse' })}
                    disabled={disabled}
                  >
                    <Plus className="size-4 mr-1" />
                    Add first in-house project
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {inhouseProjects.map((record, index) =>
                    renderRecordItem(
                      record,
                      index,
                      inhouseProjects.length,
                      <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-sky-700">
                        In-House
                      </span>,
                    ),
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Section 2: Student Projects */}
          {(projectTab === 'all' || projectTab === 'students') && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <GraduationCap className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Student Projects</h3>
                    <p className="text-xs text-slate-500">
                      {studentProjects.length} {studentProjects.length === 1 ? 'project' : 'projects'} · student capstone &amp; assistive prototypes
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onNew({ category: 'students' })}
                  disabled={disabled}
                  className="border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                >
                  <Plus className="size-4 mr-1" />
                  New student project
                </Button>
              </div>

              {studentProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-emerald-200 bg-white/60 p-8 text-center">
                  <p className="text-sm text-slate-600">
                    No student projects added yet.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 border-emerald-200 text-emerald-800"
                    onClick={() => onNew({ category: 'students' })}
                    disabled={disabled}
                  >
                    <Plus className="size-4 mr-1" />
                    Add first student project
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {studentProjects.map((record, index) =>
                    renderRecordItem(
                      record,
                      index,
                      studentProjects.length,
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-emerald-700">
                        Student Project
                      </span>,
                    ),
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      ) : isPublications ? (
        /* ── PUBLICATIONS, GROUPED BY YEAR ── */
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">Publications</h2>
              <p className="text-sm text-slate-600">
                {records.length} {records.length === 1 ? 'paper' : 'papers'} across {publicationYears.length}{' '}
                {publicationYears.length === 1 ? 'year' : 'years'} · one photo per year appears on the timeline
              </p>
            </div>
            <Button type="button" className="shadow-sm" onClick={() => onNew()} disabled={disabled}>
              <Plus className="size-4" />
              New publication
            </Button>
          </div>

          {publicationYears.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
              <p className="text-sm font-medium text-slate-700">A blank page, full of possibilities ✨</p>
              <p className="mt-1 text-xs text-slate-500">Add your first publication and it will appear on the public timeline once published.</p>
            </div>
          ) : (
            publicationYears.map(({ year, items }) => (
              <section
                key={year}
                aria-label={`Publications from ${year}`}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="grid gap-5 p-4 sm:grid-cols-[13rem_1fr] sm:p-5">
                  <YearPhoto
                    year={year}
                    src={yearImages[String(year)] ?? ''}
                    onChange={(url) => onYearImage?.(year, url)}
                    onUpload={onUpload}
                    disabled={disabled || !onYearImage}
                  />

                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-baseline gap-3">
                        <h3 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">{year}</h3>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-700">
                          {items.length} {items.length === 1 ? 'paper' : 'papers'}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => onNew({ year })}
                      >
                        <Plus className="size-3.5" />
                        Add paper in {year}
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {items.map((record, index) => renderRecordItem(record, index, items.length))}
                    </ul>
                  </div>
                </div>
              </section>
            ))
          )}
        </div>
      ) : (
        /* ── STANDARD COLLECTION VIEW FOR NON-PROJECTS ── */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                {COLLECTION_LABELS[collection]}
              </h2>
              <p className="text-sm text-slate-600">
                {records.length} {records.length === 1 ? 'entry' : 'entries'} · use the
                arrows to reorder
              </p>
            </div>
            <Button type="button" className="shadow-sm" onClick={() => onNew()} disabled={disabled}>
              <Plus className="size-4" />
              New {singular.toLowerCase()}
            </Button>
          </div>

          {records.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
              <p className="text-sm font-medium text-slate-700">
                A blank page, full of possibilities ✨
              </p>
              <p className="mt-1 text-xs text-slate-500">Add your first {singular.toLowerCase()} and it will appear on the public site once published.</p>
              <Button type="button" variant="outline" className="mt-3" onClick={() => onNew()} disabled={disabled}>
                <Plus className="size-4" />
                Add the first {singular.toLowerCase()}
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {records.map((record, index) =>
                renderRecordItem(record, index, records.length),
              )}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={`Delete ${singular.toLowerCase()}?`}
        description={
          pendingRecord
            ? `“${recordLabel(collection, pendingRecord)}” will be removed from your draft. Nothing is published until you redeploy.`
            : 'This record will be removed from your draft.'
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
