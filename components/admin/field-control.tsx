'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { FieldDef } from './lib/content';
import { ImageField } from './image-field';
import { TagInput } from './tag-input';

interface FieldControlProps {
  field: FieldDef;
  id: string;
  value: unknown;
  onChange: (next: unknown) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  /** Shown under the field, in red (e.g. "Required"). */
  error?: string;
}

/** Renders one labelled form control for a record field definition. */
export function FieldControl({
  field,
  id,
  value,
  onChange,
  onUpload,
  disabled,
  error,
}: FieldControlProps) {
  const helpId = field.help ? `${id}-help` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {field.label}
        {field.required ? <span className="ml-0.5 text-red-600" aria-hidden="true">*</span> : null}
      </Label>

      {field.kind === 'text' ? (
        <Input
          id={id}
          type="text"
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={error ? 'border-red-400' : undefined}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.kind === 'select' ? (
        <select
          id={id}
          value={typeof value === 'string' && value ? value : field.required ? '' : (field.options?.[0]?.value ?? '')}
          disabled={disabled}
          required={field.required}
          aria-invalid={error ? true : undefined}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.value)}
          className={`flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-red-400' : 'border-slate-200'}`}
        >
          {field.required ? (
            <option value="" disabled>
              {field.placeholder ?? 'Select…'}
            </option>
          ) : null}
          {typeof value === 'string' && value && !field.options?.some((o) => o.value === value) ? (
            <option value={value}>{value} (not in the list)</option>
          ) : null}
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : null}

      {field.kind === 'url' ? (
        <Input
          id={id}
          type="url"
          inputMode="url"
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder ?? 'https://…'}
          disabled={disabled}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.kind === 'number' ? (
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          value={
            typeof value === 'number'
              ? value
              : typeof value === 'string'
                ? value
                : ''
          }
          placeholder={field.placeholder}
          disabled={disabled}
          aria-describedby={helpId}
          onChange={(event) =>
            onChange(event.target.value === '' ? 0 : Number(event.target.value))
          }
        />
      ) : null}

      {field.kind === 'date' ? (
        <Input
          id={id}
          type="date"
          value={typeof value === 'string' ? value : ''}
          disabled={disabled}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.kind === 'textarea' ? (
        <Textarea
          id={id}
          rows={field.rows ?? 4}
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          disabled={disabled}
          aria-describedby={helpId}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}

      {field.kind === 'tags' ? (
        <TagInput
          id={id}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(next) => onChange(next)}
          disabled={disabled}
          placeholder={field.placeholder}
          aria-describedby={helpId}
        />
      ) : null}

      {field.kind === 'image' ? (
        <ImageField
          id={id}
          value={typeof value === 'string' ? value : ''}
          onChange={(next) => onChange(next)}
          onUpload={onUpload}
          disabled={disabled}
          aria-describedby={helpId}
        />
      ) : null}

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}

      {field.help ? (
        <p id={helpId} className="text-xs text-slate-600">
          {field.help}
        </p>
      ) : null}
    </div>
  );
}
