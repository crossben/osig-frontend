// ============================================
// Home / Landing Page
// ============================================

'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { Reveal } from '@/components/motion/reveal';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { useT } from '@/lib/i18n';
import { GSAP_EASE, isReducedMotion } from '@/lib/motion';
import { TraceHero } from './trace-hero';
import { PricingSection } from './pricing-section';
import { CHECK_PREFILL_KEY } from '@/features/check/check-page';

// Send the pasted text through sessionStorage, never the URL: messages can be private
function goCheck(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  const text = String(new FormData(e.currentTarget).get('q') ?? '').trim();
  try {
    if (text) sessionStorage.setItem(CHECK_PREFILL_KEY, text.slice(0, 5000));
  } catch {
    /* storage blocked: the checker opens empty */
  }
  window.location.hash = '#/check';
}

gsap.registerPlugin(useGSAP, ScrollTrigger);

const goRegister = () => { window.location.hash = '#/register'; };
const goLogin = () => { window.location.hash = '#/login'; };

// What each scan type checks — mirrors backend/app/osint
const coverage = [
  {
    type: 'Email address',
    finds: 'Which services the address is registered on, known breach exposure, reputation, and whether the domain is set up to send mail.',
    sources: ['Gravatar', 'XposedOrNot', 'Hudson Rock', 'Holehe', 'PGP keyservers', 'GitHub commits', 'MX / provider'],
  },
  {
    type: 'Username',
    finds: 'Verified accounts on developer and social platforms, with the name, location, website and linked accounts each profile shows.',
    sources: ['GitHub', 'GitLab', 'Keybase', 'Mastodon', 'Bluesky', 'WhatsMyName (~650 sites)', 'Hudson Rock'],
  },
  {
    type: 'Domain',
    finds: 'Ownership, DNS, subdomains, exposed services and CVEs, lookalike phishing domains, mail security and the tech stack.',
    sources: ['WHOIS', 'DNS', 'Certificate Transparency', 'Lookalike domains', 'Shodan InternetDB', 'Mail security', 'Tech stack', 'Wayback Machine'],
  },
  {
    type: 'IP address',
    finds: 'Who runs it, where it is, which ports and software it exposes, known CVEs, and whether it is scanning the internet.',
    sources: ['Reverse DNS', 'IPWhois + GeoIP', 'Shodan InternetDB', 'GreyNoise', 'Reverse IP'],
  },
  {
    type: 'Organization',
    finds: 'Official website and accounts, headquarters, parent and subsidiaries, executives, and registered legal entities.',
    sources: ['Wikidata', 'GLEIF', 'OpenCorporates'],
  },
  {
    type: 'Phone number',
    finds: 'Country, carrier, line type and valid formatting, plus public mentions.',
    sources: ['libphonenumber', 'Search dorks'],
  },
];

// A real sequence, so it's numbered
const steps = [
  { title: 'Pick a target', body: 'An email address, username, domain or phone number you have a reason to look into.' },
  { title: 'Choose the depth', body: 'A quick scan covers the core sources in about two minutes. A deep scan adds slower checks.' },
  { title: 'Follow the trace', body: 'Findings arrive per source as they come in, linked back to where they were found.' },
  { title: 'Export the file', body: 'Download a PDF report with every finding, or the raw JSON for your own tooling.' },
];

export function HomePage() {
  const stepsRef = useRef<HTMLOListElement>(null);
  const t = useT();

  // The connector between steps inks in as the section scrolls past
  useGSAP(() => {
    if (isReducedMotion()) return;
    gsap.from('[data-steps-line]', {
      scaleX: 0,
      transformOrigin: 'left center',
      ease: 'none',
      scrollTrigger: { trigger: stepsRef.current, start: 'top 80%', end: 'bottom 60%', scrub: true },
    });
    gsap.from('[data-hero-copy] > *', { y: 14, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: GSAP_EASE });
  });

  return (
    <div className="min-h-screen bg-background">
      <SmoothScroll />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
          <a href="#/" className="flex items-center gap-2">
            <Logo size="lg" />
          </a>
          <div className="ml-auto flex items-center gap-1.5">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="ghost" onClick={goLogin}>{t('Sign in')}</Button>
            <Button onClick={goRegister}>{t('Create account')}</Button>
          </div>
        </div>
      </header>

      {/* Scam checker entry point */}
      <section className="border-b bg-card/70">
        <form onSubmit={goCheck} className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 md:flex-row md:items-center md:gap-5 md:px-8">
          <label htmlFor="home-check" className="font-display text-lg font-semibold md:shrink-0">
            {t('Check a suspicious link or message')}
          </label>
          <div className="flex min-w-0 flex-1 gap-2">
            <input
              id="home-check"
              name="q"
              autoComplete="off"
              placeholder={t('Paste a link, number, email or message')}
              className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-trace"
            />
            <Button type="submit" className="h-11 shrink-0">{t('Check it')}</Button>
          </div>
        </form>
      </section>

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-14 md:px-8 lg:grid-cols-[1fr_1.15fr] lg:pt-20">
        <div data-hero-copy className="max-w-xl">
          <h1 className="font-display text-[clamp(2.6rem,5.5vw,4.6rem)] font-bold leading-[1.02]">
            {t('See what the public internet already knows.')}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t('OSIG checks an email, username, domain or phone number against dozens of public sources at once, then lays out every finding with the place it came from.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={goRegister}>{t('Start a free scan')}</Button>
            <Button size="lg" variant="outline" onClick={goLogin}>{t('Sign in')}</Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            {t('Five scans a day on the free plan. Public sources only, nothing behind a login.')}
          </p>
        </div>
        <TraceHero />
      </section>

      {/* Coverage */}
      <section className="border-t bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t('What a scan checks')}</h2>
            <p className="mt-3 text-muted-foreground">
              {t('Each target type runs its own set of sources. These are the ones running today.')}
          </p>
          </Reveal>
          <Reveal stagger className="mt-12 divide-y border-y">
            {coverage.map((row) => (
              <div key={row.type} className="grid gap-4 py-7 md:grid-cols-[14rem_1fr_1fr] md:gap-10">
                <h3 className="font-display text-xl font-semibold">{t(row.type)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(row.finds)}</p>
                <ul className="flex flex-wrap content-start gap-1.5">
                  {row.sources.map((s) => (
                    <li key={s} className="rounded-md border bg-background px-2 py-0.5 text-sm">{t(s)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <Reveal>
          <h2 className="font-display text-3xl font-bold md:text-4xl">{t('From target to report')}</h2>
        </Reveal>
        <ol ref={stepsRef} className="relative mt-12 grid gap-10 md:grid-cols-4 md:gap-6">
          <span
            data-steps-line
            aria-hidden
            className="absolute left-0 right-0 top-[1.1rem] hidden h-px bg-trace/60 md:block"
          />
          {steps.map((step, i) => (
            <li key={step.title} className="relative">
              <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-trace bg-background font-display text-sm font-bold text-trace">
                {i + 1}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{t(step.title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Ground rules */}
      <section className="border-t bg-card/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 md:grid-cols-[1fr_1.4fr] md:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t('Ground rules')}</h2>
            <p className="mt-3 text-muted-foreground">
              {t('OSIG is for people who have a legitimate reason to look: security teams checking their own exposure, researchers, journalists, and anyone auditing their own footprint.')}
          </p>
          </Reveal>
          <Reveal stagger as="ul" className="space-y-6">
            <li>
              <h3 className="font-semibold">{t('Public sources only')}</h3>
              <p className="mt-1 text-muted-foreground">{t('Every check reads data anyone could find. Nothing behind a login, no private content.')}</p>
            </li>
            <li>
              <h3 className="font-semibold">{t('Exposure, not intrusion')}</h3>
              <p className="mt-1 text-muted-foreground">{t('Breach checks show where an address has turned up in known incidents, so you can act on it.')}</p>
            </li>
            <li>
              <h3 className="font-semibold">{t('You confirm your purpose')}</h3>
              <p className="mt-1 text-muted-foreground">{t('Each scan asks you to confirm a legitimate reason before it runs.')}</p>
            </li>
          </Reveal>
        </div>
      </section>

      <PricingSection />

      {/* Closing CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 md:px-8">
        <Reveal className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-primary px-8 py-12 text-primary-foreground md:flex-row md:items-center md:px-12">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">{t('Run your first trace')}</h2>
            <p className="mt-2 opacity-75">{t('Start with your own email. Most people are surprised.')}</p>
          </div>
          <Button size="lg" variant="secondary" onClick={goRegister}>{t('Create a free account')}</Button>
        </Reveal>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground md:px-8">
          <span>{t('OSIG — open source intelligence gathering')}</span>
          <span className="flex flex-wrap gap-x-4">
            <span>{t('Public data only')}</span>
            <a href="#/terms" className="hover:text-foreground">{t('Terms of Use')}</a>
            <a href="#/privacy" className="hover:text-foreground">{t('Privacy Policy')}</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
