'use client';

import * as React from 'react';
import { ImagePlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { COLLECTION_SINGULAR, type Collection, type RecordValue } from './lib/content-types';
import { PRIMARY_FIELD, RECORD_FIELDS } from './lib/content';
import { FieldControl } from './field-control';
import { GalleryField } from './gallery-field';

interface RecordEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
  record: RecordValue;
  isNew: boolean;
  disabled?: boolean;
  onSave: (record: RecordValue) => void;
  onUpload: (file: File) => Promise<string>;
}

function cloneRecord(record: RecordValue): RecordValue {
  return JSON.parse(JSON.stringify(record)) as RecordValue;
}

/**
 * Editor for a single record. It is a full-screen, scrollable sheet on small
 * screens and a centred modal on larger ones. Changes are held locally and
 * applied only on Save so half-filled new records never enter the draft.
 */
export function RecordEditor({
  open,
  onOpenChange,
  collection,
  record,
  isNew,
  disabled,
  onSave,
  onUpload,
}: RecordEditorProps) {
  const [value, setValue] = React.useState<RecordValue>(() => cloneRecord(record));

  const singular = COLLECTION_SINGULAR[collection];
  const primaryKey = PRIMARY_FIELD[collection];
  const primaryValue = value[primaryKey];
  const canSave =
    typeof primaryValue === 'string' && primaryValue.trim().length > 0;

  const setField = (key: string, next: unknown) => {
    setValue((prev) => ({ ...prev, [key]: next }));
  };

  const fields = RECORD_FIELDS[collection];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => (!disabled ? onOpenChange(next) : undefined)}
    >
      <DialogContent
        className="left-0 top-0 flex max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg"
      >
        <DialogHeader className="shrink-0 border-b border-slate-200 px-4 py-4 text-left sm:px-6">
          <DialogTitle>
            {isNew ? `New ${singular.toLowerCase()}` : `Edit ${singular.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>
            Update the fields below, then save. Changes are staged locally until
            you publish.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          {fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              id={`record-${field.key}`}
              value={value[field.key]}
              onChange={(next) => setField(field.key, next)}
              onUpload={onUpload}
              disabled={disabled}
            />
          ))}

          {collection === 'pictures' ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="size-4 text-slate-600" />
                Images
              </Label>
              <GalleryField
                images={Array.isArray(value.images) ? (value.images as string[]) : []}
                thumbnail={typeof value.thumbnail === 'string' ? value.thumbnail : ''}
                onChangeImages={(next) => setField('images', next)}
                onChangeThumbnail={(next) => setField('thumbnail', next)}
                onUpload={onUpload}
                disabled={disabled}
              />
              <p className="text-xs text-slate-600">
                Pick any image as the group thumbnail. The thumbnail is used on
                the gallery index.
              </p>
            </div>
          ) : null}

          <div className="space-y-1 rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-600">Record ID</p>
            <p className="break-all font-mono text-xs text-slate-700">
              {typeof value.id === 'string' ? value.id : ''}
            </p>
            <p className="text-xs text-slate-600">
              Generated automatically and cannot be changed.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={disabled || !canSave}
            onClick={() => {
              onSave(value);
              onOpenChange(false);
            }}
          >
            {isNew ? 'Add' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
