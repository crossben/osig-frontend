// ============================================
// Map of where findings are located (IP geolocation)
// Plain Leaflet, loaded inside an effect because it needs `window`.
// Popups are built from DOM nodes with textContent: point data is never parsed as HTML.
// ============================================

'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import type { MapPoint } from '@/types';
import { useT } from '@/lib/i18n';

interface MapViewProps {
  points: MapPoint[];
  className?: string;
}

function popupContent(p: MapPoint, t: ReturnType<typeof useT>): HTMLElement {
  const root = document.createElement('div');
  root.className = 'osig-map-popup';
  const add = (tag: string, text: string, cls: string) => {
    const el = document.createElement(tag);
    el.className = cls;
    el.textContent = text;
    root.appendChild(el);
    return el;
  };
  const labels = p.labels.slice(0, 8);
  labels.forEach((l) => add('div', l, 'font-mono text-xs font-semibold break-all'));
  if (p.labels.length > labels.length) add('div', t('+{n} more', { n: p.labels.length - labels.length }), 'text-xs opacity-70');
  if (p.place) add('div', p.place, 'mt-1 text-xs');
  if (p.org) add('div', p.org, 'text-xs opacity-80');
  if (p.sources.length) add('div', t('Reported by {sources}', { sources: p.sources.join(', ') }), 'mt-1 text-xs opacity-70');
  return root;
}

export function MapView({ points, className }: MapViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    const el = ref.current;
    if (!el || points.length === 0) return;
    let cancelled = false;
    let map: import('leaflet').Map | null = null;

    import('leaflet').then((mod) => {
      const L = mod.default ?? mod;
      if (cancelled || !ref.current) return;
      const trace = getComputedStyle(el).getPropertyValue('--trace').trim() || '#3B5B8C';
      map = L.map(el, { scrollWheelZoom: true, worldCopyJump: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      }).addTo(map);

      const latLngs: [number, number][] = [];
      for (const p of points) {
        const ll: [number, number] = [p.lat, p.lon];
        latLngs.push(ll);
        // Leaflet treats string content as HTML: pass a text-only node
        const tip = document.createElement('span');
        tip.textContent = p.labels[0] ?? p.place ?? '';
        L.circleMarker(ll, {
          radius: Math.min(14, 6 + p.labels.length),
          color: trace,
          weight: 2,
          fillColor: trace,
          fillOpacity: 0.45,
        })
          .bindPopup(popupContent(p, t))
          .bindTooltip(tip,{ direction: 'top' })
          .addTo(map);
      }
      if (latLngs.length === 1) map.setView(latLngs[0], 6);
      else map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32], maxZoom: 8 });
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points, t]);

  if (points.length === 0) {
    return (
      <div className={cn('flex min-h-[320px] flex-col items-center justify-center rounded-2xl border bg-card p-8 text-center', className)}>
        <MapPinIcon aria-hidden className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium">{t('No locations in these results.')}</p>
        <p className="text-sm text-muted-foreground">{t('Locations come from IP geolocation.')}</p>
      </div>
    );
  }

  return (
    <div className={cn('osig-map relative dark:[&_.leaflet-tile]:brightness-[.8] dark:[&_.leaflet-tile]:contrast-[1.1] h-[min(640px,70dvh)] min-h-[360px] overflow-hidden rounded-2xl border bg-card', className)} data-lenis-prevent>
      <div ref={ref} className="absolute inset-0 z-0" role="region" aria-label={t(points.length === 1 ? 'Map with {n} location' : 'Map with {n} locations', { n: points.length })} />
      <p className="pointer-events-none absolute left-3 top-3 z-[500] ml-10 rounded-md bg-card/90 px-2 py-1 text-xs text-muted-foreground">
        {t(points.length === 1 ? '{n} location · approximate, from IP geolocation' : '{n} locations · approximate, from IP geolocation', { n: points.length })}
      </p>
    </div>
  );
}
