'use client';

// "Check a photo": shows what a photo's metadata gives away (place, time,
// device) and hands back a clean copy. The photo goes only to our API, which
// keeps nothing. No face recognition, no automatic upload anywhere else.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { photoApi, type PhotoInspection } from '@/lib/api-photo';
import { PhotoResults } from './photo-results';
import { ReverseSearch } from './reverse-search';

const MAX_BYTES = 15 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/tiff';

export function PhotoPage() {
  const t = useT();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const inspect = useMutation({ mutationFn: (f: File) => photoApi.inspect(f, f.name || 'photo') });
  const strip = useMutation({
    mutationFn: (f: File) => photoApi.strip(f, f.name || 'photo'),
    onSuccess: ({ blob, filename }) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    },
  });
  const { mutate: runInspect, reset: resetInspect } = inspect;
  const { reset: resetStrip } = strip;

  const showPreview = useCallback((f: File | null) => {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return f ? URL.createObjectURL(f) : null;
    });
  }, []);

  const choose = useCallback((f: File | null | undefined) => {
    if (!f) return;
    setLocalError(null);
    resetStrip();
    if (f.size > MAX_BYTES) {
      setLocalError(t('The photo is larger than 15 MB.'));
      return;
    }
    if (f.type && !f.type.startsWith('image/')) {
      setLocalError(t('Choose an image file: JPEG, PNG, WebP or TIFF.'));
      return;
    }
    setFile(f);
    showPreview(f);
    runInspect(f);
  }, [runInspect, resetStrip, showPreview, t]);


  // Paste from the clipboard anywhere on the page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.kind === 'file' && i.type.startsWith('image/'));
      const f = item?.getAsFile();
      if (f) {
        e.preventDefault();
        choose(f);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [choose]);

  const startOver = () => {
    setFile(null);
    showPreview(null);
    setLocalError(null);
    resetInspect();
    resetStrip();
    if (inputRef.current) inputRef.current.value = '';
  };

  const result: PhotoInspection | undefined = inspect.data;
  const error = localError ?? (inspect.error as Error | null)?.message ?? null;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t('Check a photo')}</h1>
        <p className="text-base text-muted-foreground">
          {t('See what a photo gives away before you share it: where and when it was taken, and which phone or camera took it.')}
        </p>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <ShieldCheckIcon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-trace" />
          <span>{t('Your photo is read in memory and never saved. It is not sent to any other service.')}</span>
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <section aria-label={t('Your photo')} className="space-y-4">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            tabIndex={-1}
            aria-hidden
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <div
            role="button"
            tabIndex={0}
            aria-label={t('Drop a photo here or choose one')}
            aria-describedby={`${inputId}-hint`}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              choose(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              'group relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-card p-4 text-center transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              dragging ? 'border-trace bg-trace-soft' : 'border-border hover:border-trace',
            )}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt={t('The photo you chose')} className="max-h-[360px] w-auto rounded-lg object-contain" />
            ) : (
              <>
                <PhotoIcon aria-hidden className="h-10 w-10 text-muted-foreground" />
                <span className="mt-3 font-medium">{t('Drop a photo here or choose one')}</span>
                <span className="mt-1 text-sm text-muted-foreground">{t('You can also paste a photo. JPEG, PNG, WebP or TIFF, up to 15 MB.')}</span>
              </>
            )}
          </div>
          <p id={`${inputId}-hint`} className="sr-only">{t('You can also paste a photo. JPEG, PNG, WebP or TIFF, up to 15 MB.')}</p>

          {file && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => strip.mutate(file)}
                disabled={strip.isPending || !result}
                className="min-h-11 flex-1 sm:flex-none"
              >
                {strip.isPending
                  ? <ArrowPathIcon aria-hidden className="mr-2 h-4 w-4 animate-spin" />
                  : <ArrowDownTrayIcon aria-hidden className="mr-2 h-4 w-4" />}
                {t('Remove metadata and download')}
              </Button>
              <Button variant="outline" onClick={startOver} className="min-h-11">
                {t('Check another photo')}
              </Button>
            </div>
          )}
          {strip.isSuccess && (
            <p className="text-sm text-muted-foreground" role="status">
              {t('Downloaded a clean copy: no location, no date, no device details.')}
            </p>
          )}
          {strip.error && (
            <p className="text-sm text-destructive" role="alert">{(strip.error as Error).message}</p>
          )}
        </section>

        <section aria-label={t('What this photo reveals')} aria-live="polite" aria-busy={inspect.isPending} className="min-w-0">
          {error && (
            <div role="alert" className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <ExclamationTriangleIcon aria-hidden className="h-5 w-5 shrink-0 text-destructive" />
              <p>{error}</p>
            </div>
          )}
          {inspect.isPending && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <ArrowPathIcon aria-hidden className="h-4 w-4 animate-spin" />
              {t('Reading the photo')}
            </p>
          )}
          {result && file && !inspect.isPending && <PhotoResults result={result} />}
          {!file && !error && (
            <div className="space-y-3 text-sm text-muted-foreground">
              <h2 className="font-display text-lg font-semibold text-foreground">{t('What you will see')}</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>{t('Where the photo was taken, if the phone saved its location')}</li>
                <li>{t('When it was taken')}</li>
                <li>{t('Which phone or camera took it, and which app edited it')}</li>
                <li>{t('Its size and format')}</li>
              </ul>
            </div>
          )}
        </section>
      </div>

      <ReverseSearch canDownload={!!file && !!result} onDownload={() => file && strip.mutate(file)} downloading={strip.isPending} />
    </div>
  );
}
