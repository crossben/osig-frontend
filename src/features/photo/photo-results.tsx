'use client';

import { useMemo, type ReactNode } from 'react';
import { ClipboardDocumentIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { MapView } from '@/features/analysis/map-view';
import { CopyButton } from '@/components/copy-button';
import { useT, useLocale } from '@/lib/i18n';
import type { PhotoInspection } from '@/lib/api-photo';
import type { MapPoint } from '@/types';

type Row = [label: string, value: ReactNode];

function Group({ title, rows }: { title: string; rows: Row[] }) {
  const shown = rows.filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!shown.length) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <dl className="divide-y rounded-xl border bg-card">
        {shown.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function PhotoResults({ result }: { result: PhotoInspection }) {
  const t = useT();
  const locale = useLocale();
  const { gps, camera, settings, dates, file, xmp, thumbnail } = result;

  // Camera dates have no time zone: show them as written
  const fmtDate = (iso?: string) => {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short' }).format(d);
  };

  const points = useMemo<MapPoint[]>(() => (gps ? [{
    lat: gps.latitude,
    lon: gps.longitude,
    labels: [`${gps.latitude}, ${gps.longitude}`],
    sources: [],
    scanIds: [],
    place: null,
    org: null,
  }] : []), [gps]);

  const coords = gps ? `${gps.latitude}, ${gps.longitude}` : '';
  const device = [camera.make, camera.model && camera.make && camera.model.startsWith(camera.make) ? camera.model.slice(camera.make.length).trim() : camera.model]
    .filter(Boolean).join(' ');
  const shot = [
    settings.fNumber ? `f/${settings.fNumber}` : null,
    settings.exposureTime ? `${settings.exposureTime} s` : null,
    settings.iso ? `ISO ${settings.iso}` : null,
    settings.focalLength ? `${settings.focalLength} mm` : null,
  ].filter(Boolean).join(', ');
  const editor = camera.software || xmp?.creatorTool || xmp?.softwareAgent;

  return (
    <div className="space-y-6">
      <h2 className="sr-only">{t('What this photo reveals')}</h2>

      {gps ? (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-start gap-2 font-semibold">
            <MapPinIcon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <span><span className="mark">{t('Location found in this photo')}</span>: {t('anyone you send it to can see where it was taken.')}</span>
          </p>
          <p className="mt-1 pl-7 text-sm text-muted-foreground">{t('Remove the metadata before you share it.')}</p>
        </div>
      ) : result.metadataStripped ? (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-semibold">{t('No metadata in this photo')}</p>
          <p className="mt-1 text-muted-foreground">
            {t('Apps like WhatsApp, Facebook and Instagram remove it when a photo is sent or posted, and so do screenshots. It can still be found by its content: try a reverse image search below.')}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-4 text-sm">
          <p className="font-semibold">{t('No location in this photo')}</p>
          <p className="mt-1 text-muted-foreground">{t('Other details are still visible to anyone who gets the file.')}</p>
        </div>
      )}

      {gps && (
        <section className="space-y-2">
          <h3 className="font-display text-lg font-semibold">{t('Where')}</h3>
          <MapView points={points} className="h-[260px] min-h-0 sm:h-[300px] [&>p]:hidden" />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-mono">{coords}</span>
            <CopyButton value={coords} label={t('Copy coordinates')} icon={ClipboardDocumentIcon} />
            <a
              className="text-trace underline underline-offset-4"
              href={`https://www.openstreetmap.org/?mlat=${gps.latitude}&mlon=${gps.longitude}#map=16/${gps.latitude}/${gps.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Open in OpenStreetMap')}
            </a>
          </div>
          {gps.altitude !== null && (
            <p className="text-sm text-muted-foreground">{t('Altitude: {m} m', { m: gps.altitude })}</p>
          )}
        </section>
      )}

      <Group title={t('When')} rows={[
        [t('Taken'), fmtDate(dates.taken) ?? fmtDate(xmp?.createDate)],
        [t('Saved to the device'), dates.digitized !== dates.taken ? fmtDate(dates.digitized) : undefined],
        [t('Last changed'), dates.modified !== dates.taken ? fmtDate(dates.modified) ?? fmtDate(xmp?.modifyDate) : undefined],
        [t('Time zone'), dates.offset],
      ]} />

      <Group title={t('Device')} rows={[
        [t('Phone or camera'), device || undefined],
        [t('Lens'), camera.lens],
        [t('Serial number'), camera.serialNumber],
        [t('Settings'), shot || undefined],
        [t('Edited with'), editor],
        [t('Author'), camera.artist],
        [t('Copyright'), camera.copyright],
      ]} />

      <Group title={t('File')} rows={[
        [t('Format'), file.format],
        [t('Size'), `${file.width} × ${file.height} (${file.megapixels} MP), ${formatBytes(file.sizeBytes)}`],
        [t('Orientation'), result.orientation ? t(result.orientation) : undefined],
        [t('Animated'), file.animated ? t('Yes') : undefined],
        [t('Hidden preview'), thumbnail
          ? (thumbnail.mismatch
            ? t('Its shape differs from the photo: the photo was probably cropped or edited after it was taken.')
            : t('Matches the photo ({w} × {h})', { w: thumbnail.width, h: thumbnail.height }))
          : undefined],
      ]} />
    </div>
  );
}
