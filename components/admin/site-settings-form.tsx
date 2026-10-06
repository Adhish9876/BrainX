'use client';

import * as React from 'react';

import type { Site } from '@/lib/types';

import type { FieldDef } from './lib/content';
import { FieldControl } from './field-control';

const SITE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Lab name', kind: 'text', placeholder: 'e.g. BrainX Lab' },
  { key: 'institution', label: 'Institution', kind: 'text', placeholder: 'e.g. IIITDM Kancheepuram' },
  { key: 'tagline', label: 'Tagline', kind: 'text' },
  { key: 'about', label: 'About', kind: 'textarea', rows: 5 },
  { key: 'focus', label: 'Focus areas', kind: 'text', help: 'Short summary of the lab’s research focus.' },
  { key: 'email', label: 'Email', kind: 'text', placeholder: 'name@example.com' },
  { key: 'phone', label: 'Phone', kind: 'text' },
  { key: 'address', label: 'Address', kind: 'textarea', rows: 3 },
  { key: 'logo', label: 'Logo', kind: 'image' },
];

interface SiteSettingsFormProps {
  site: Site;
  onChange: (patch: Partial<Site>) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
}

/** Inline editor for the singleton site settings. */
export function SiteSettingsForm({
  site,
  onChange,
  onUpload,
  disabled,
}: SiteSettingsFormProps) {
  return (
    <div className="space-y-5">
      {SITE_FIELDS.map((field) => (
        <FieldControl
          key={field.key}
          field={field}
          id={`site-${field.key}`}
          value={site[field.key as keyof Site]}
          onChange={(next) =>
            onChange({ [field.key]: next } as Partial<Site>)
          }
          onUpload={onUpload}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
