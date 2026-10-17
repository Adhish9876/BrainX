'use client';

import * as React from 'react';

import type { Site } from '@/lib/types';

import type { FieldDef } from './lib/content';
import { FieldControl } from './field-control';
import { PartnersEditor } from './partners-editor';

interface Group {
  title: string;
  description: string;
  columns?: 1 | 2;
  fields: FieldDef[];
}

const GROUPS: Group[] = [
  {
    title: 'Identity',
    description: 'Who the lab is. Used in the header, footer and page titles.',
    columns: 2,
    fields: [
      { key: 'name', label: 'Lab name', kind: 'text', placeholder: 'e.g. BrainX Lab' },
      { key: 'institution', label: 'Institution', kind: 'text', placeholder: 'e.g. IIITDM Kancheepuram' },
      { key: 'tagline', label: 'Tagline', kind: 'text' },
      { key: 'focus', label: 'Focus areas', kind: 'text', help: 'Short summary of the lab\u2019s research focus.' },
    ],
  },
  {
    title: 'About',
    description: 'A longer description of the lab.',
    fields: [{ key: 'about', label: 'About', kind: 'textarea', rows: 5 }],
  },
  {
    title: 'Contact',
    description: 'Shown in the footer. The "Get in touch" button appears on the Team page once an email is set.',
    columns: 2,
    fields: [
      { key: 'email', label: 'Email', kind: 'text', placeholder: 'name@example.com' },
      { key: 'phone', label: 'Phone', kind: 'text' },
      { key: 'address', label: 'Address', kind: 'textarea', rows: 3 },
    ],
  },
  {
    title: 'Branding',
    description: 'The logo shown in the browser tab.',
    fields: [{ key: 'logo', label: 'Logo', kind: 'image' }],
  },
  {
    title: 'Home page',
    description: 'Figures shown on the home page.',
    fields: [
      {
        key: 'grantAmount',
        label: 'Grant funding (\u20b9)',
        kind: 'number',
        placeholder: 'e.g. 15000000',
        help: 'Total funding won, in rupees, as plain digits (15000000 shows as \u20b91,50,00,000+). Leave 0 to hide it.',
      },
    ],
  },
];

interface SiteSettingsFormProps {
  site: Site;
  onChange: (patch: Partial<Site>) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
}

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-5">
        <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3>
        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Editor for the singleton site settings, grouped into cards. */
export function SiteSettingsForm({ site, onChange, onUpload, disabled }: SiteSettingsFormProps) {
  return (
    <div className="space-y-5">
      {GROUPS.map((group) => (
        <Card key={group.title} title={group.title} description={group.description}>
          <div className={group.columns === 2 ? 'grid gap-5 sm:grid-cols-2' : 'space-y-5'}>
            {group.fields.map((field) => (
              <div key={field.key} className={field.kind === 'textarea' && group.columns === 2 && field.key === 'address' ? 'sm:col-span-2' : undefined}>
                <FieldControl
                  field={field}
                  id={`site-${field.key}`}
                  value={site[field.key as keyof Site]}
                  onChange={(next) => onChange({ [field.key]: next } as Partial<Site>)}
                  onUpload={onUpload}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card title="Equipment partners">
        <PartnersEditor
          partners={site.partners ?? []}
          onChange={(next) => onChange({ partners: next })}
          onUpload={onUpload}
          disabled={disabled}
        />
      </Card>
    </div>
  );
}
