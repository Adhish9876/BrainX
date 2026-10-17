'use client';

import * as React from 'react';
import { ImageOff, Loader2, Trash2, Upload } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImageFieldProps {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
  previewClassName?: string;
  'aria-describedby'?: string;
}

/** A single image: upload a file or paste a URL; both write the same value. */
export function ImageField({
  id,
  value,
  onChange,
  onUpload,
  disabled,
  previewClassName,
  'aria-describedby': ariaDescribedBy,
}: ImageFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFailed(false);
  }, [value]);

  const busy = disabled || uploading;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50',
            previewClassName,
          )}
        >
          {value && !failed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt=""
              className="size-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <ImageOff className="size-5 text-slate-600" />
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {uploading ? 'Uploading…' : 'Upload image'}
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => onChange('')}
              >
                <Trash2 className="size-4" />
                Remove
              </Button>
            ) : null}
          </div>
          <Input
            id={id}
            value={value}
            disabled={busy}
            aria-describedby={ariaDescribedBy}
            placeholder="…or paste an image URL"
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
