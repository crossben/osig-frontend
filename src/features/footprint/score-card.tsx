'use client';

// The exposure score: an arc that fills as things get safer, a plain label,
// when it was last checked, the weekly trend, and "Check again".

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocale, useT } from '@/lib/i18n';
import type { Footprint } from '@/lib/api-me';

export function scoreTone(score: number | null) {
  if (score === null) return { label: 'Not checked yet', color: 'text-muted-foreground', stroke: 'var(--muted-foreground)' };
  if (score >= 80) return { label: 'Well protected', color: 'text-success', stroke: 'var(--success)' };
  if (score >= 50) return { label: 'A few things to fix', color: 'text-trace', stroke: 'var(--trace)' };
  return { label: 'Needs attention', color: 'text-destructive', stroke: 'var(--destructive)' };
}

export function useRelativeTime() {
  const locale = useLocale();
  return (iso: string | null) => {
    if (!iso) return null;
    const then = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').getTime();
    const diff = (then - Date.now()) / 1000;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const abs = Math.abs(diff);
    if (abs < 60) return rtf.format(Math.round(diff), 'second');
    if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
    return rtf.format(Math.round(diff / 86400), 'day');
  };
}

const R = 70;
const ARC = 0.75; // 270 degrees
const CIRC = 2 * Math.PI * R;

function Ring({ score }: { score: number | null }) {
  const tone = scoreTone(score);
  const fill = score === null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44 shrink-0 sm:h-52 sm:w-52" aria-hidden="true">
      <g transform="rotate(135 90 90)">
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--border)" strokeWidth="12"
          strokeLinecap="round" strokeDasharray={`${CIRC * ARC} ${CIRC}`} />
        <circle cx="90" cy="90" r={R} fill="none" stroke={tone.stroke} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={`${CIRC * ARC * fill} ${CIRC}`}
          className="transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none" />
      </g>
      <text x="90" y="98" textAnchor="middle" className="fill-foreground font-display font-bold" style={{ fontSize: 52 }}>
        {score === null ? '–' : score}
      </text>
      <text x="90" y="124" textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 13 }}>/ 100</text>
    </svg>
  );
}

function Sparkline({ points }: { points: { date: string; score: number }[] }) {
  const t = useT();
  if (points.length < 2) return null;
  const w = 160, h = 40;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${(h - (p.score / 100) * h).toFixed(1)}`).join(' ');
  const first = points[0].score, last = points[points.length - 1].score;
  return (
    <figure className="mt-4">
      <svg viewBox={`-2 -2 ${w + 4} ${h + 4}`} className="h-10 w-40" role="img"
        aria-label={t('Score over the last weeks: from {a} to {b}', { a: first, b: last })}>
        <path d={path} fill="none" stroke="var(--trace)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={(points.length - 1) * step} cy={h - (last / 100) * h} r="3" fill="var(--trace)" />
      </svg>
      <figcaption className="text-xs text-muted-foreground">
        {last > first ? t('Up {n} points over {w} weeks', { n: last - first, w: points.length })
          : last < first ? t('Down {n} points over {w} weeks', { n: first - last, w: points.length })
            : t('Steady over {w} weeks', { w: points.length })}
      </figcaption>
    </figure>
  );
}

export function ScoreCard({ data, openCount, lettersWaiting, refreshing, onRefresh }: {
  data: Footprint; openCount: number; lettersWaiting: boolean; refreshing: boolean; onRefresh: () => void;
}) {
  const t = useT();
  const rel = useRelativeTime();
  const tone = scoreTone(data.score);
  const checked = rel(data.scoreUpdatedAt);
  return (
    <section aria-labelledby="score-title" className="rounded-2xl border bg-card p-5 sm:p-8">
      <h2 id="score-title" className="sr-only">{t('Your protection score')}</h2>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
        <Ring score={data.score} />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p aria-live="polite" aria-atomic="true" className={cn('font-display text-2xl font-semibold sm:text-3xl', tone.color)}>
            <span className="sr-only">{t('Score {n} out of 100.', { n: data.score ?? '–' })} </span>
            {t(tone.label)}
          </p>
          <p className="mt-2 text-muted-foreground">
            {data.score === null
              ? t('Your first check is running. It usually takes a few minutes.')
              : openCount === 0
                ? (lettersWaiting ? t('Nothing urgent. Send your letters when you have a moment; we keep watching.')
                  : t('Nothing left to do. We keep watching and tell you if something changes.'))
                : openCount === 1 ? t('One thing to do below raises your score.')
                  : t('{n} things to do below raise your score.', { n: openCount })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {checked ? t('Last checked {when}', { when: checked }) : t('Higher is safer.')}
          </p>
          <div className="flex justify-center sm:justify-start"><Sparkline points={data.trend} /></div>
          <Button variant="outline" className="mt-5" onClick={onRefresh} disabled={refreshing}>
            <ArrowPathIcon className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin motion-reduce:animate-none')} aria-hidden="true" />
            {refreshing ? t('Checking…') : t('Check again')}
          </Button>
        </div>
      </div>
    </section>
  );
}
