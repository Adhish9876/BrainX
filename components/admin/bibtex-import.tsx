'use client';

import * as React from 'react';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Publication } from '@/lib/types';
import { parsePublicationBibtex } from './lib/bibtex';

interface BibtexImportProps {
  disabled?: boolean;
  onImport: (fields: Partial<Pick<Publication, 'title' | 'authors' | 'year' | 'venue' | 'link' | 'tags'>>) => void;
}

/** Import into the local editor only; never saves or publishes a citation. */
export function BibtexImport({ disabled, onImport }: BibtexImportProps) {
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [warnings, setWarnings] = React.useState<string[]>([]);

  function fillFields() {
    setError('');
    setMessage('');
    setWarnings([]);
    try {
      const result = parsePublicationBibtex(text);
      onImport(result.fields);
      setMessage(Object.keys(result.fields).length
        ? 'Publication fields filled. Review the details below before saving.'
        : 'No publication fields were filled. Complete the form manually or try another citation.');
      setWarnings(result.warnings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not parse this BibTeX citation.');
    }
  }

  return (
    <section className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4" aria-label="Import publication from BibTeX">
      <Label htmlFor="publication-bibtex" className="flex items-center gap-2">
        <FileText className="size-4 text-navy-700" aria-hidden />
        Paste BibTeX
      </Label>
      <p id="publication-bibtex-help" className="text-xs leading-relaxed text-slate-600">
        Paste one citation to fill the form. Extracted fields replace matching values;
        missing fields stay unchanged. Nothing is added or published yet.
      </p>
      <Textarea
        id="publication-bibtex"
        value={text}
        rows={5}
        className="font-mono text-xs"
        placeholder={'@article{citation,\n  title = {Paper title},\n  author = {Author name},\n  year = {2026}\n}'}
        disabled={disabled}
        aria-describedby={`publication-bibtex-help${error ? ' publication-bibtex-error' : ''}`}
        aria-invalid={Boolean(error)}
        onChange={event => {
          setText(event.target.value);
          setError('');
          setMessage('');
          setWarnings([]);
        }}
      />
      <Button type="button" variant="outline" disabled={disabled || !text.trim()} onClick={fillFields}>
        Fill from BibTeX
      </Button>
      {error ? <p id="publication-bibtex-error" role="alert" className="text-sm text-red-700">{error}</p> : null}
      {message ? (
        <div role="status" className="space-y-1 text-sm text-slate-700">
          <p>{message}</p>
          {warnings.length ? <ul className="list-inside list-disc text-xs">{warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul> : null}
        </div>
      ) : null}
    </section>
  );
}
