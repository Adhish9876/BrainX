'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import type { Partner } from '@/lib/types';
import { Button } from '@/components/ui/button';

import type { FieldDef } from './lib/content';
import { FieldControl } from './field-control';

const PARTNER_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Company name', kind: 'text', placeholder: 'e.g. Brain Products' },
  { key: 'logo', label: 'Company logo', kind: 'image', help: 'Shown first, so visitors know whose equipment it is.' },
  { key: 'product', label: 'Equipment photo', kind: 'image', help: 'A photo with a white or transparent background blends best into the page.' },
  { key: 'productName', label: 'Equipment name (optional)', kind: 'text', placeholder: 'e.g. actiCHamp Plus amplifier' },
  { key: 'description', label: 'Description (optional)', kind: 'textarea', rows: 4, placeholder: 'What the lab uses it for' },
  { key: 'link', label: 'Company website (optional)', kind: 'url', placeholder: 'https://…' },
];

const EMPTY_PARTNER: Partner = { name: '', logo: '', product: '', productName: '', description: '', link: '' };

interface PartnersEditorProps {
  partners: Partner[];
  onChange: (next: Partner[]) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
}

/** Equipment partners shown on the home page: add, reorder, remove, and edit each company. */
export function PartnersEditor({ partners, onChange, onUpload, disabled }: PartnersEditorProps) {
  const update = (index: number, key: keyof Partner, value: unknown) =>
    onChange(partners.map((p, i) => (i === index ? { ...p, [key]: String(value ?? '') } : p)));

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= partners.length) return;
    const next = [...partners];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">
          Companies whose equipment the lab uses, shown on the home page after the research board. Each appears as
          its logo, then the equipment photo, then the description. They alternate left and right.
        </p>
      </div>

      {partners.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-600">
          No partners yet. The section is hidden on the home page until you add one.
        </p>
      ) : null}

      <ul className="space-y-4">
        {partners.map((partner, index) => (
          <li key={index} className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-600">
                Partner {index + 1}
              </span>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon-sm" disabled={disabled || index === 0} aria-label="Move partner up" onClick={() => move(index, -1)}>
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={disabled || index === partners.length - 1} aria-label="Move partner down" onClick={() => move(index, 1)}>
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={disabled} aria-label="Remove partner" onClick={() => onChange(partners.filter((_, i) => i !== index))}>
                  <Trash2 className="size-4 text-red-600" />
                </Button>
              </div>
            </div>
            {PARTNER_FIELDS.map((field) => (
              <FieldControl
                key={field.key}
                field={field}
                id={`partner-${index}-${field.key}`}
                value={partner[field.key as keyof Partner]}
                onChange={(next) => update(index, field.key as keyof Partner, next)}
                onUpload={onUpload}
                disabled={disabled}
              />
            ))}
          </li>
        ))}
      </ul>

      <Button type="button" variant="outline" size="sm" disabled={disabled || partners.length >= 6} onClick={() => onChange([...partners, { ...EMPTY_PARTNER }])}>
        <Plus className="size-4" />
        Add partner
      </Button>
    </div>
  );
}
