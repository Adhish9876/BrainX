'use client';

import * as React from 'react';
import {
  Building2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  ImageOff,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { COLLECTION_SINGULAR, type Collection, type RecordValue } from './lib/content-types';
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

interface CollectionSectionProps {
  collection: Collection;
  records: RecordValue[];
  onNew: (initialOverrides?: Partial<RecordValue>) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  disabled?: boolean;
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
}: CollectionSectionProps) {
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);
  const [projectTab, setProjectTab] = React.useState<'all' | 'inhouse' | 'students'>('all');

  const singular = COLLECTION_SINGULAR[collection];
  const pendingRecord = records.find((item) => item.id === pendingDelete);

  // When collection is projects, separate into inhouse and students
  const isProjects = collection === 'projects';
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
        className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-slate-300"
      >
        {thumb ? (
          <div className="size-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            <RecordThumb src={thumb} />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-slate-900">{label}</p>
            {categoryBadge}
          </div>
          {detail ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{detail}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <Badge variant="outline" className="mr-1 hidden sm:inline-flex">
            #{index + 1}
          </Badge>
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${label}`}
            disabled={disabled}
            onClick={() => onEdit(id)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${label}`}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
                Projects Management
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
            <div className="rounded-xl border border-sky-100 bg-sky-50/30 p-5 space-y-4">
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
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5 space-y-4">
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
      ) : (
        /* ── STANDARD COLLECTION VIEW FOR NON-PROJECTS ── */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {singular}s
              </h2>
              <p className="text-sm text-slate-600">
                {records.length} {records.length === 1 ? 'entry' : 'entries'} · use the
                arrows to reorder
              </p>
            </div>
            <Button type="button" onClick={() => onNew()} disabled={disabled}>
              <Plus className="size-4" />
              New {singular.toLowerCase()}
            </Button>
          </div>

          {records.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
              <p className="text-sm text-slate-600">
                No {singular.toLowerCase()} entries yet.
              </p>
              <Button type="button" variant="outline" className="mt-3" onClick={() => onNew()} disabled={disabled}>
                <Plus className="size-4" />
                Add the first one
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
