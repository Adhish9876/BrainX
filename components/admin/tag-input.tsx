'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  'aria-describedby'?: string;
}

/** Backend limits: 30 tags per record, 48 characters per tag. */
const MAX_TAGS = 30;
const MAX_TAG_LENGTH = 48;

/**
 * Free-form tag entry. Press Enter to add the typed string as a
 * tag; each tag can be removed individually. Duplicate tags are ignored.
 */
export function TagInput({
  id,
  value,
  onChange,
  disabled,
  placeholder = 'Type a tag and press Enter',
  'aria-describedby': ariaDescribedBy,
}: TagInputProps) {
  const [draft, setDraft] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commit = React.useCallback(
    (raw: string) => {
      const tag = raw.trim();
      if (!tag) return;
      if (value.length >= MAX_TAGS) {
        setDraft('');
        return;
      }
      const exists = value.some(
        (item) => item.toLowerCase() === tag.toLowerCase(),
      );
      if (!exists) onChange([...value, tag.slice(0, MAX_TAG_LENGTH)]);
      setDraft('');
    },
    [onChange, value],
  );

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-navy-700 focus-within:ring-2 focus-within:ring-navy-700 focus-within:ring-offset-1',
          disabled && 'opacity-50',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <Badge key={`${tag}-${index}`} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                removeAt(index);
              }}
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full p-0.5 text-slate-600 hover:bg-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-navy-700 disabled:pointer-events-none"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <Input
          id={id}
          ref={inputRef}
          value={draft}
          disabled={disabled}
          maxLength={MAX_TAG_LENGTH}
          placeholder={value.length === 0 ? placeholder : ''}
          aria-describedby={ariaDescribedBy}
          className="h-7 min-w-32 flex-1 border-0 px-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              commit(draft);
            } else if (
              event.key === 'Backspace' &&
              draft === '' &&
              value.length > 0
            ) {
              event.preventDefault();
              removeAt(value.length - 1);
            }
          }}
          onBlur={() => commit(draft)}
        />
      </div>
      {value.length >= MAX_TAGS ? (
        <p className="text-xs text-amber-700">
          Maximum of {MAX_TAGS} tags reached.
        </p>
      ) : null}
    </div>
  );
}
