'use client';

import * as React from 'react';
import { Check, ImagePlus, Users } from 'lucide-react';
import type { Member } from '@/lib/types';

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
import { BibtexImport } from './bibtex-import';

interface RecordEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collection: Collection;
  record: RecordValue;
  teamMembers?: Member[];
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
  teamMembers = [],
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

  // Deduplicate team members by name (preferring records with an uploaded image)
  const uniqueTeamMembers = React.useMemo(() => {
    const byName = new Map<string, Member>();
    for (const member of teamMembers) {
      const key = member.name.trim().toLowerCase();
      if (!key) continue;
      const existing = byName.get(key);
      if (!existing || (!existing.image && member.image)) {
        byName.set(key, member);
      }
    }
    return [...byName.values()];
  }, [teamMembers]);

  const selectedMembers = Array.isArray(value.members)
    ? (value.members as string[])
    : [];

  const toggleProjectMember = (memberName: string) => {
    const exists = selectedMembers.some(
      (m) => m.trim().toLowerCase() === memberName.trim().toLowerCase(),
    );
    if (exists) {
      setField(
        'members',
        selectedMembers.filter(
          (m) => m.trim().toLowerCase() !== memberName.trim().toLowerCase(),
        ),
      );
    } else {
      setField('members', [...selectedMembers, memberName]);
    }
  };

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
          {collection === 'publications' ? (
            <BibtexImport
              disabled={disabled}
              onImport={(extracted) => setValue((prev) => ({ ...prev, ...extracted }))}
            />
          ) : null}
          {fields.map((field) => (
            <React.Fragment key={field.key}>
              <FieldControl
                field={field}
                id={`record-${field.key}`}
                value={value[field.key]}
                onChange={(next) => setField(field.key, next)}
                onUpload={onUpload}
                disabled={disabled}
              />

              {collection === 'projects' &&
              field.key === 'members' &&
              uniqueTeamMembers.length > 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                    <Users className="size-3.5 text-slate-600" />
                    Quick-select from Lab Team (automatically wires member photo &amp; role):
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {uniqueTeamMembers.map((member) => {
                      const active = selectedMembers.some(
                        (m) =>
                          m.trim().toLowerCase() ===
                          member.name.trim().toLowerCase(),
                      );
                      return (
                        <button
                          key={member.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleProjectMember(member.name)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            active
                              ? 'border-navy-700 bg-navy-700 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {member.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.image}
                              alt=""
                              className="size-4 rounded-full object-cover"
                            />
                          ) : null}
                          <span>{member.name}</span>
                          {active ? <Check className="size-3" /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              {collection === 'pictures' && field.key === 'tags' ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs font-medium text-slate-600">
                    Quick category:
                  </span>
                  {['EVENTS', 'CELEBRATIONS', 'WORKSHOPS', 'CONFERENCES', 'LAB LIFE'].map(
                    (preset) => {
                      const currentTags = Array.isArray(value.tags)
                        ? (value.tags as string[])
                        : [];
                      const active = currentTags.some(
                        (t) => t.trim().toUpperCase() === preset,
                      );
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (active) {
                              setField(
                                'tags',
                                currentTags.filter(
                                  (t) => t.trim().toUpperCase() !== preset,
                                ),
                              );
                            } else {
                              setField('tags', [...currentTags, preset]);
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider transition-colors ${
                            active
                              ? 'border-navy-700 bg-navy-700 text-white'
                              : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span>{preset}</span>
                          {active ? <Check className="size-3" /> : null}
                        </button>
                      );
                    },
                  )}
                </div>
              ) : null}
            </React.Fragment>
          ))}

          {collection === 'projects' ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="size-4 text-slate-600" />
                Project Carousel Images (Modal)
              </Label>
              <GalleryField
                images={Array.isArray(value.images) ? (value.images as string[]) : []}
                thumbnail={typeof value.image === 'string' ? value.image : ''}
                onChangeImages={(next) => setField('images', next)}
                onChangeThumbnail={(next) => setField('image', next)}
                onUpload={onUpload}
                disabled={disabled}
              />
              <p className="text-xs text-slate-600">
                Upload multiple images for the project modal carousel. Star any
                image to set it as the card cover image.
              </p>
            </div>
          ) : null}

          {collection === 'pictures' ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImagePlus className="size-4 text-slate-600" />
                Event Photos
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
                Upload photos for this event. Star any photo to set it as the
                event card cover image.
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
