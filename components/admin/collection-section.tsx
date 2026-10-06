'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
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
    case 'projects':
      return str('description');
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
  onNew: () => void;
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
  const singular = COLLECTION_SINGULAR[collection];
  const pendingRecord = records.find((item) => item.id === pendingDelete);

  return (
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
        <Button type="button" onClick={onNew} disabled={disabled}>
          <Plus className="size-4" />
          New {singular.toLowerCase()}
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="text-sm text-slate-600">
            No {singular.toLowerCase()} entries yet.
          </p>
          <Button type="button" variant="outline" className="mt-3" onClick={onNew} disabled={disabled}>
            <Plus className="size-4" />
            Add the first one
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {records.map((record, index) => {
            const id = String(record.id);
            const label = recordLabel(collection, record);
            const detail = summary(collection, record);
            const thumb = thumbFor(collection, record);
            return (
              <li
                key={id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
              >
                {thumb ? (
                  <div className="size-12 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    <RecordThumb src={thumb} />
                  </div>
                ) : null}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{label}</p>
                  {detail ? (
                    <p className="line-clamp-2 text-sm text-slate-600">{detail}</p>
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
                    disabled={disabled || index === records.length - 1}
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
          })}
        </ul>
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
