'use client';

import * as React from 'react';

import type { Site } from '@/lib/types';

import type { FieldDef } from './lib/content';
import { FieldControl } from './field-control';
import { PartnersEditor } from './partners-editor';

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
  {
    key: 'grantAmount',
    label: 'Grant funding (₹)',
    kind: 'number',
    placeholder: 'e.g. 15000000',
    help: 'Total funding won, in rupees, as plain digits (15000000 shows as ₹1,50,00,000+ on the home page). Leave 0 to hide it.',
  },
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

      <PartnersEditor
        partners={site.partners ?? []}
        onChange={(next) => onChange({ partners: next })}
        onUpload={onUpload}
        disabled={disabled}
      />
    </div>
  );
}
