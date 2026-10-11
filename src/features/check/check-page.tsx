'use client';

// "Is this a scam?" checker. Public: works signed out (standalone page) and
// signed in (inside the dashboard). Shared verdicts live at #/c?id=<shareId>.

import { useEffect, useId, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  NoSymbolIcon,
  QuestionMarkCircleIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CopyButton } from '@/components/copy-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useT, useLocale } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { checkApi, type CheckHistoryItem, type CheckReason, type CheckResult, type CheckVerdict } from '@/lib/api-check';
import { reasonText, sortReasons } from './reason-text';

export const CHECK_PREFILL_KEY = 'osig-check-prefill';

const COUNTRIES = ['SN', 'CI', 'ML', 'BF', 'GN', 'GM', 'GW', 'MR', 'NE', 'BJ', 'TG', 'CM', 'GA', 'CD', 'NG', 'GH', 'MA', 'FR', 'BE', 'CH', 'CA', 'US', 'GB'];

function detectCountry(): string {
  if (typeof navigator === 'undefined') return 'SN';
  for (const l of navigator.languages ?? [navigator.language]) {
    const region = l?.split('-')[1]?.toUpperCase();
    if (region && COUNTRIES.includes(region)) return region;
  }
  return 'SN';
}

function readPrefill(): string {
  try {
    return (typeof window !== 'undefined' && sessionStorage.getItem(CHECK_PREFILL_KEY)) || '';
  } catch {
    return '';
  }
}

const EXAMPLES = [
  {
    label: 'A Wave SMS',
    value: 'WAVE: Votre compte sera bloqué dans 24h. Pour le réactiver, envoyez le code reçu par SMS au 77 000 00 00 ou cliquez sur http://wave-senegal-verif.top/login',
  },
  { label: 'A lookalike link', value: 'http://orange-money.sn.secure-login.xyz/confirm' },
  { label: 'A “support” Gmail', value: 'wave.support.senegal@gmail.com' },
  { label: 'A premium number', value: '+44 909 879 0000' },
];

// What we tell people we're doing while they wait
const STEPS = [
  'Reading what you pasted',
  'Looking for fake company names',
  'Checking how old the website is',
  'Asking security databases',
  'Checking the phone number and email',
  'Putting the answer together',
];

interface VerdictStyle {
  title: string;
  lead: string;
  icon: React.ElementType;
  panel: string;
  badge: string;
  bar: string;
}

const VERDICTS: Record<CheckVerdict, VerdictStyle> = {
  scam: {
    title: 'This looks like a scam',
    lead: 'We found strong warning signs. Do not reply, click or pay.',
    icon: NoSymbolIcon,
    panel: 'border-destructive bg-destructive/10 dark:bg-destructive/20',
    badge: 'bg-destructive text-white',
    bar: 'bg-destructive',
  },
  suspicious: {
    title: 'Be careful',
    lead: 'Some things here are often seen in scams. Check with the company through its official app or number before doing anything.',
    icon: ExclamationTriangleIcon,
    panel: 'border-amber-500 bg-amber-100/70 dark:border-amber-400 dark:bg-amber-400/15',
    badge: 'bg-amber-500 text-amber-950 dark:bg-amber-400',
    bar: 'bg-amber-500 dark:bg-amber-400',
  },
  no_red_flags: {
    title: 'No warning signs found',
    lead: 'This doesn’t prove it’s safe. New scams appear every day, so stay careful.',
    icon: CheckCircleIcon,
    panel: 'border-success bg-success/10 dark:bg-success/15',
    badge: 'bg-success text-white dark:text-[#0F1A2E]',
    bar: 'bg-success',
  },
  unknown: {
    title: 'We couldn’t check this',
    lead: 'We couldn’t recognise a link, number, email or message we know how to check. Treat it with care.',
    icon: QuestionMarkCircleIcon,
    panel: 'border-border bg-muted/60',
    badge: 'bg-muted-foreground text-background',
    bar: 'bg-muted-foreground',
  },
};

const ADVICE: Record<CheckVerdict, string[]> = {
  scam: [
    'Don’t click the link and don’t reply.',
    'Never give your Wave or Orange Money PIN, or a code you received by SMS (OTP). No real agent will ask for it.',
    'Don’t send money or pay any “fee” to unlock a prize, a loan or your account.',
    'If you’re worried about your account, call the official number shown in the app, not the one in the message.',
    'Block the sender and report the message to your operator.',
  ],
  suspicious: [
    'Don’t click and don’t pay until you’ve checked.',
    'Never share a PIN or a code you received by SMS (OTP), even with someone who says they work for Wave or Orange Money.',
    'Contact the company yourself through its official app, website or number.',
    'If it turns out to be fake, block the sender and report it.',
  ],
  no_red_flags: [
    'Still never share your PIN or a code you received by SMS (OTP), whoever asks.',
    'If someone pressures you to act fast, stop and check with the company directly.',
  ],
  unknown: [
    'Don’t click links or call numbers you weren’t expecting.',
    'Never share your PIN or a code you received by SMS (OTP).',
    'Try pasting just the link, the phone number or the email address.',
  ],
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Very serious',
  high: 'Serious',
  medium: 'Worth noting',
  low: 'Minor',
  info: 'For information',
};

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-destructive',
  high: 'bg-destructive',
  medium: 'bg-amber-500 dark:bg-amber-400',
  low: 'bg-muted-foreground',
  info: 'bg-border',
};

const KIND_LABEL: Record<string, string> = {
  url: 'Link',
  domain: 'Website',
  email: 'Email address',
  phone: 'Phone number',
  message: 'Message',
};

function shareUrl(id: string) {
  return `${window.location.origin}${window.location.pathname}#/c?id=${encodeURIComponent(id)}`;
}

function errorStatus(e: unknown): number | undefined {
  const err = e as { status?: number; response?: { status?: number } } | null;
  return err?.status ?? err?.response?.status;
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function ScoreMeter({ score, verdict }: { score: number; verdict: CheckVerdict }) {
  const t = useT();
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="mt-5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{t('Risk level')}</span>
        <span className="tabular-nums text-muted-foreground">{t('{n} out of 100', { n: s })}</span>
      </div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={s}
        aria-label={t('Risk level')}
        className="relative mt-2 h-3 overflow-hidden rounded-full bg-background/70 ring-1 ring-border"
      >
        <div className={cn('h-full rounded-full', VERDICTS[verdict].bar)} style={{ width: `${Math.max(s, 3)}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{t('Low')}</span>
        <span>{t('High')}</span>
      </div>
    </div>
  );
}

function ReasonList({ reasons }: { reasons: CheckReason[] }) {
  const t = useT();
  if (!reasons.length) return null;
  return (
    <section className="mt-6" aria-labelledby="check-reasons">
      <h3 id="check-reasons" className="font-display text-lg font-semibold">{t('What we noticed')}</h3>
      <ul className="mt-3 space-y-3">
        {sortReasons(reasons).map((r, i) => (
          <li key={`${r.code}-${i}`} className="flex gap-3">
            <span aria-hidden className={cn('mt-2 h-2.5 w-2.5 shrink-0 rounded-full', SEVERITY_DOT[r.severity])} />
            <div className="min-w-0">
              <p className="leading-snug break-words">{reasonText(r, t)}</p>
              <p className="text-xs text-muted-foreground">{t(SEVERITY_LABEL[r.severity] ?? 'For information')}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AdvicePanel({ verdict }: { verdict: CheckVerdict }) {
  const t = useT();
  return (
    <section aria-labelledby="check-advice" className="rounded-xl border bg-card p-5 sm:p-6">
      <h3 id="check-advice" className="font-display text-xl font-semibold">{t('What to do now')}</h3>
      <ul className="mt-3 space-y-2.5">
        {ADVICE[verdict].map((a) => (
          <li key={a} className="flex gap-3 leading-snug">
            <CheckCircleIcon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-trace" />
            <span>{t(a)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShareBar({ result }: { result: CheckResult }) {
  const t = useT();
  // This page only renders after mount (see app/page.tsx), so navigator exists
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const url = shareUrl(result.shareId);
  // Never includes what was pasted: only the verdict and the link
  const text = t('I checked a message on OSIG: “{v}”. See why:', { v: t(VERDICTS[result.verdict].title) });
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild className="bg-[#1F7A4D] text-white hover:bg-[#1A6741]">
        <a href={wa} target="_blank" rel="noopener noreferrer">{t('Warn others on WhatsApp')}</a>
      </Button>
      {canShare && (
        <Button
          variant="outline"
          onClick={() => navigator.share({ title: t('Is this a scam?'), text, url }).catch(() => undefined)}
        >
          <ShareIcon className="h-4 w-4" />
          {t('Share')}
        </Button>
      )}
      <CopyButton value={url} label={t('Copy link')} icon={LinkIcon} showLabel className="h-9 border px-3" />
    </div>
  );
}

function VerdictPanel({ result, headingRef }: { result: CheckResult; headingRef?: React.Ref<HTMLHeadingElement> }) {
  const t = useT();
  const locale = useLocale();
  const v = VERDICTS[result.verdict] ?? VERDICTS.unknown;
  const Icon = v.icon;
  return (
    <div className={cn('rounded-xl border-2 p-5 sm:p-7', v.panel)}>
      <div className="flex items-start gap-4">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14', v.badge)}>
          <Icon aria-hidden className="h-7 w-7 sm:h-8 sm:w-8" />
        </span>
        <div className="min-w-0">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="font-display text-[clamp(1.75rem,7vw,2.75rem)] font-bold leading-[1.05] outline-none"
          >
            {t(v.title)}
          </h2>
          <p className="mt-2 text-base leading-relaxed sm:text-lg">{t(v.lead)}</p>
        </div>
      </div>
      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted-foreground">{t(KIND_LABEL[result.kind] ?? 'Message')}</dt>
        <dd className="min-w-0 break-all font-medium">{result.subject}</dd>
        <dt className="text-muted-foreground">{t('Checked')}</dt>
        <dd>{new Date(result.checkedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</dd>
      </dl>
      <ScoreMeter score={result.score} verdict={result.verdict} />
      <ReasonList reasons={result.reasons} />
    </div>
  );
}

function Loading() {
  const t = useT();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1300);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="rounded-xl border bg-card p-5 sm:p-6">
      <p className="flex items-center gap-3 font-display text-lg font-semibold">
        <ArrowPathIcon aria-hidden className="h-5 w-5 animate-spin text-trace motion-reduce:animate-none" />
        {t('Checking…')}
      </p>
      <ol className="mt-4 space-y-2 text-sm">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={cn(
              'flex items-center gap-2',
              i < step && 'text-muted-foreground',
              i > step && 'text-muted-foreground/50',
              i === step && 'font-medium',
            )}
          >
            <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', i <= step ? 'bg-trace' : 'bg-border')} />
            {t(s)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function SignupNudge() {
  const t = useT();
  return (
    <section className="rounded-xl border border-dashed p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold">{t('Keep an eye on your own number and email')}</h3>
      <p className="mt-1.5 text-muted-foreground leading-relaxed">
        {t('Create a free account to see where your email and phone number appear online, and get more checks per hour.')}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => { window.location.hash = '#/register'; }}>{t('Create a free account')}</Button>
        <Button variant="ghost" onClick={() => { window.location.hash = '#/login'; }}>{t('Sign in')}</Button>
      </div>
    </section>
  );
}

function History({ items }: { items: CheckHistoryItem[] }) {
  const t = useT();
  const locale = useLocale();
  if (!items.length) return null;
  return (
    <section aria-labelledby="check-history" className="mt-12">
      <h2 id="check-history" className="font-display text-xl font-semibold">{t('Your recent checks')}</h2>
      <ul className="mt-3 divide-y border-y">
        {items.map((h) => {
          const v = VERDICTS[h.verdict] ?? VERDICTS.unknown;
          const Icon = v.icon;
          return (
            <li key={h.shareId}>
              <a
                href={`#/c?id=${encodeURIComponent(h.shareId)}`}
                className="flex items-center gap-3 py-3 hover:bg-accent/50 focus-visible:outline-2 focus-visible:outline-trace"
              >
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', v.badge)}>
                  <Icon aria-hidden className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{h.subject}</span>
                  <span className="block text-xs text-muted-foreground">
                    {t(v.title)}, {new Date(h.checkedAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Header for signed-out pages
function PublicShell({ children }: { children: React.ReactNode }) {
  const t = useT();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
          <a href="#/" className="flex items-center"><Logo /></a>
          <div className="ml-auto flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            {isAuthenticated ? (
              <Button size="sm" variant="outline" onClick={() => { window.location.hash = '#/check'; }}>{t('Back to OSIG')}</Button>
            ) : (
              <>
                <Button variant="ghost" className="hidden sm:inline-flex" onClick={() => { window.location.hash = '#/login'; }}>{t('Sign in')}</Button>
                <Button size="sm" onClick={() => { window.location.hash = '#/register'; }}>{t('Create account')}</Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:pt-12">{children}</main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function Checker() {
  const t = useT();
  const fieldId = useId();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();
  const [input, setInput] = useState(readPrefill);
  const [country, setCountry] = useState(detectCountry);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lang = useLocale();

  // The prefill is read once (initial state), then dropped
  useEffect(() => {
    try {
      sessionStorage.removeItem(CHECK_PREFILL_KEY);
    } catch {
      /* storage blocked */
    }
  }, []);

  const history = useQuery({
    queryKey: ['check-history'],
    queryFn: checkApi.history,
    enabled: isAuthenticated,
  });

  const run = useMutation({
    mutationFn: () => checkApi.run(input.trim(), country),
    onSuccess: () => {
      if (isAuthenticated) qc.invalidateQueries({ queryKey: ['check-history'] });
    },
  });

  useEffect(() => {
    if (run.data) {
      resultRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      headingRef.current?.focus({ preventScroll: true });
    }
  }, [run.data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || run.isPending) return;
    run.mutate();
  };

  const status = run.isError ? errorStatus(run.error) : undefined;
  const regionName = (cc: string) => {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' }).of(cc) ?? cc;
    } catch {
      return cc;
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="font-display text-[clamp(2rem,8vw,3.25rem)] font-bold leading-[1.02]">{t('Is this a scam?')}</h1>
      <p className="mt-3 max-w-xl text-lg leading-relaxed text-muted-foreground">
        {t('Got a strange SMS, WhatsApp message, link, call or email? Paste it here and we’ll tell you what looks wrong.')}
      </p>

      <form onSubmit={submit} className="mt-7">
        <label htmlFor={fieldId} className="font-medium">
          {t('Paste the link, number, email or the whole message you received')}
        </label>
        <Textarea
          id={fieldId}
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 5000))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
          }}
          rows={5}
          maxLength={5000}
          placeholder={t('For example: Your Wave account is blocked, send the code you received to…')}
          className="mt-2 min-h-36 resize-y bg-card text-base leading-relaxed md:text-base"
        />
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label={t('Try an example')}>
          <span className="py-1 text-sm text-muted-foreground">{t('Try an example:')}</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => { setInput(ex.value); textareaRef.current?.focus(); }}
              className="rounded-full border bg-background px-3 py-1 text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-trace"
            >
              {t(ex.label)}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <label htmlFor={`${fieldId}-c`} className="text-sm text-muted-foreground">{t('Your country')}</label>
            <select
              id={`${fieldId}-c`}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 h-11 w-full rounded-md border bg-card px-3 text-base focus-visible:outline-2 focus-visible:outline-trace"
            >
              {COUNTRIES.map((c) => <option key={c} value={c}>{regionName(c)}</option>)}
            </select>
          </div>
          <Button type="submit" size="lg" className="h-12 w-full text-base sm:ml-auto sm:w-auto sm:px-10" disabled={!input.trim() || run.isPending}>
            {run.isPending ? t('Checking…') : t('Check it')}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {t('We don’t keep what you paste. Only a short, hidden summary is saved so you can share the answer.')}
        </p>
      </form>

      <div ref={resultRef} className="mt-8 scroll-mt-6 space-y-5" aria-live="polite" aria-busy={run.isPending}>
        {run.isPending && <Loading />}
        {run.isError && (
          <div role="alert" className="rounded-xl border-2 border-destructive/60 bg-destructive/5 p-5">
            {status === 429 ? (
              <>
                <p className="font-display text-lg font-semibold">{t('You’ve reached the limit of checks for now')}</p>
                <p className="mt-1 text-muted-foreground">
                  {isAuthenticated
                    ? t('Please wait a little and try again.')
                    : t('Signed-out visitors can do 10 checks an hour. Sign in or create a free account to do more.')}
                </p>
                {!isAuthenticated && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => { window.location.hash = '#/login'; }}>{t('Sign in')}</Button>
                    <Button variant="outline" onClick={() => { window.location.hash = '#/register'; }}>{t('Create a free account')}</Button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="font-display text-lg font-semibold">{t('The check didn’t go through')}</p>
                <p className="mt-1 text-muted-foreground">{t('Check your connection and try again.')}</p>
                <Button className="mt-3" variant="outline" onClick={() => run.mutate()}>{t('Try again')}</Button>
              </>
            )}
          </div>
        )}
        {run.data && !run.isPending && (
          <>
            <VerdictPanel result={run.data} headingRef={headingRef} />
            <AdvicePanel verdict={run.data.verdict} />
            <div>
              <p className="mb-2 font-medium">{t('Share the answer, not the message')}</p>
              <ShareBar result={run.data} />
            </div>
            {!isAuthenticated && <SignupNudge />}
          </>
        )}
      </div>

      {isAuthenticated && history.data && <History items={history.data} />}
    </div>
  );
}

export function CheckPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Checker /> : <PublicShell><Checker /></PublicShell>;
}

function readShareId(): string {
  const q = window.location.hash.split('?')[1] ?? '';
  return new URLSearchParams(q).get('id') ?? '';
}

function useShareId(): string | null {
  const [id, setId] = useState<string | null>(() => (typeof window === 'undefined' ? null : readShareId()));
  useEffect(() => {
    const on = () => setId(readShareId());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return id;
}

export function SharedCheckPage() {
  const t = useT();
  const id = useShareId();
  const q = useQuery({ queryKey: ['check', id], queryFn: () => checkApi.get(id ?? ''), enabled: !!id, retry: false });

  const body = (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <p className="text-muted-foreground">{t('Someone checked this with OSIG and shared the answer.')}</p>
      <div aria-live="polite" aria-busy={q.isLoading}>
        {(id === null || q.isLoading) && <Loading />}
        {(q.isError || id === '') && (
          <div role="alert" className="rounded-xl border p-5">
            <p className="font-display text-lg font-semibold">{t('This check can’t be found')}</p>
            <p className="mt-1 text-muted-foreground">{t('The link may be wrong or the check may have expired.')}</p>
          </div>
        )}
        {q.data && <VerdictPanel result={q.data} />}
      </div>
      {q.data && <AdvicePanel verdict={q.data.verdict} />}
      <section className="rounded-xl border border-dashed p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold">{t('Got a strange message too?')}</h2>
        <p className="mt-1.5 text-muted-foreground">{t('Paste it in and get an answer in a few seconds. It’s free.')}</p>
        <Button className="mt-4" onClick={() => { window.location.hash = '#/check'; }}>{t('Check something yourself')}</Button>
      </section>
    </div>
  );
  // #/c renders outside the dashboard layout, signed in or not
  return <PublicShell>{body}</PublicShell>;
}
