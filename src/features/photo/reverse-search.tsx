'use client';

// Reverse image search: we only open the service's page. The photo is never
// sent to it automatically; the person uploads a clean copy there themselves.

import { ArrowDownTrayIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';

const SERVICES = [
  { name: 'Google Lens', url: 'https://lens.google.com/', hint: 'Click the camera icon, then upload.' },
  { name: 'Yandex', url: 'https://yandex.com/images/', hint: 'Click the camera icon, then upload.' },
  { name: 'Bing', url: 'https://www.bing.com/visualsearch', hint: 'Drop the photo on the search box.' },
  { name: 'TinEye', url: 'https://tineye.com/', hint: 'Click the upload button.' },
];

interface Props {
  canDownload: boolean;
  downloading: boolean;
  onDownload: () => void;
}

export function ReverseSearch({ canDownload, downloading, onDownload }: Props) {
  const t = useT();
  return (
    <section aria-labelledby="reverse-search-title" className="space-y-4 border-t pt-8">
      <div className="max-w-2xl space-y-2">
        <h2 id="reverse-search-title" className="font-display text-2xl font-semibold tracking-tight">{t('Find where else this photo appears')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('A reverse image search shows other pages that use the same photo, for example a fake profile reusing someone else’s picture. These services can’t receive your photo from here, so you upload it yourself.')}
        </p>
      </div>
      <ol className="max-w-2xl list-decimal space-y-1 pl-5 text-sm">
        <li>
          {t('Download a copy without location data.')}{' '}
          {canDownload && (
            <Button variant="link" className="h-auto p-0 align-baseline" onClick={onDownload} disabled={downloading}>
              <ArrowDownTrayIcon aria-hidden className="mr-1 h-4 w-4" />
              {t('Download a copy without location data')}
            </Button>
          )}
        </li>
        <li>{t('Open one of the services below in a new tab.')}</li>
        <li>{t('Upload the copy there. What you upload is handled by that service, not by OSIG.')}</li>
      </ol>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s) => (
          <li key={s.name}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 flex-col rounded-xl border bg-card px-4 py-3 transition-colors hover:border-trace focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center gap-1.5 font-medium">
                {t('Open {name}', { name: s.name })}
                <ArrowTopRightOnSquareIcon aria-hidden className="h-4 w-4" />
                <span className="sr-only">{t('(opens in a new tab)')}</span>
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">{t(s.hint)}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
