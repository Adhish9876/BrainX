'use client';

import * as React from 'react';
import {
  ChevronDown,
  ChevronUp,
  ImageOff,
  Loader2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface GalleryFieldProps {
  images: string[];
  thumbnail: string;
  onChangeImages: (next: string[]) => void;
  onChangeThumbnail: (next: string) => void;
  onUpload: (file: File) => Promise<string>;
  disabled?: boolean;
}

/**
 * Picture-group gallery: upload several images, reorder, remove, and pick any
 * image as the group thumbnail.
 */
export function GalleryField({
  images,
  thumbnail,
  onChangeImages,
  onChangeThumbnail,
  onUpload,
  disabled,
}: GalleryFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const uploadingNow = uploading > 0;
  const busy = disabled || uploadingNow;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const list = Array.from(files);
    setUploading((count) => count + list.length);
    const uploaded: string[] = [];
    let failedCount = 0;
    let lastReason = '';
    for (const file of list) {
      try {
        uploaded.push(await onUpload(file));
      } catch (err) {
        failedCount += 1;
        if (err instanceof Error && err.message) lastReason = err.message;
      } finally {
        setUploading((count) => Math.max(0, count - 1));
      }
    }
    if (uploaded.length) onChangeImages([...images, ...uploaded]);
    if (uploaded.length && !thumbnail) onChangeThumbnail(images[0] ?? uploaded[0]);
    if (failedCount) {
      setError(
        lastReason ||
          (failedCount === 1 ? 'One image failed to upload.' : `${failedCount} images failed to upload.`),
      );
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChangeImages(next);
  };

  const remove = (index: number) => {
    const removed = images[index];
    const next = images.filter((_, i) => i !== index);
    onChangeImages(next);
    if (thumbnail === removed) {
      onChangeThumbnail(next[0] ?? '');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {uploadingNow ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploadingNow ? `Uploading ${uploading}…` : 'Add images'}
        </Button>
        <span className="text-xs text-slate-600">
          {images.length} {images.length === 1 ? 'image' : 'images'}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      {images.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">
          No images yet. Upload one or more images to build this group.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => {
            const isThumb = thumbnail === image;
            return (
              <li
                key={`${image}-${index}`}
                className={cn(
                  'group relative overflow-hidden rounded-md border bg-slate-50',
                  isThumb ? 'border-navy-700 ring-1 ring-navy-700' : 'border-slate-200',
                )}
              >
                <div className="flex aspect-square items-center justify-center overflow-hidden">
                  <GalleryThumb src={image} />
                </div>

                {isThumb ? (
                  <Badge
                    variant="default"
                    className="absolute left-1.5 top-1.5 gap-1"
                  >
                    <Star className="size-3" />
                    Thumbnail
                  </Badge>
                ) : null}

                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-slate-900/70 p-1">
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-white hover:bg-white/20 hover:text-white"
                      disabled={busy || index === 0}
                      aria-label="Move image earlier"
                      onClick={() => move(index, -1)}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-white hover:bg-white/20 hover:text-white"
                      disabled={busy || index === images.length - 1}
                      aria-label="Move image later"
                      onClick={() => move(index, 1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-white hover:bg-white/20 hover:text-white"
                      disabled={busy || isThumb}
                      aria-label="Use as thumbnail"
                      onClick={() => onChangeThumbnail(image)}
                    >
                      <Star className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-white hover:bg-white/20 hover:text-white"
                      disabled={busy}
                      aria-label="Remove image"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function GalleryThumb({ src }: { src: string }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  if (failed) {
    return <ImageOff className="size-6 text-slate-600" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
