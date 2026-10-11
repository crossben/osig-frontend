'use client';

// Terms of Use and Privacy Policy. The legal text is authored directly in both
// languages (terms-content / privacy-content); only the chrome goes through t().
// Operator facts (company name, CDP number…) live in legal-info.ts.

import { useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLanguage, useT, type Language } from '@/lib/i18n';
import { LEGAL_INFO } from './legal-info';
import type { LegalSection } from './legal-parts';
import { TERMS_EN, TERMS_FR } from './terms-content';
import { PRIVACY_EN, PRIVACY_FR } from './privacy-content';

const isDev = process.env.NODE_ENV !== 'production';

const DOCS = {
  terms: {
    title: { fr: 'Conditions d’utilisation', en: 'Terms of Use' },
    sections: { fr: TERMS_FR, en: TERMS_EN },
  },
  privacy: {
    title: { fr: 'Politique de confidentialité', en: 'Privacy Policy' },
    sections: { fr: PRIVACY_FR, en: PRIVACY_EN },
  },
} as const;

type DocKind = keyof typeof DOCS;

const PROSE = [
  'text-[1.0625rem] leading-[1.75] text-foreground/90',
  '[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6',
  '[&_strong]:font-semibold [&_strong]:text-foreground',
  '[&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-foreground',
].join(' ');

function formatDate(iso: string, lang: Language) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function TocList({ kind, sections: list, label }: { kind: DocKind; sections: readonly LegalSection[]; label: string }) {
  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <ol className="mt-3 space-y-1.5 text-sm">
        {list.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${kind}-${s.id}`}
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                // The app uses a hash router: scroll without touching location.hash.
                e.preventDefault();
                document.getElementById(`${kind}-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              {i + 1}. {s.title}
            </a>
          </li>
        ))}
      </ol>
    </>
  );
}

function LegalDocument({ kind }: { kind: DocKind }) {
  const t = useT();
  const uiLang = useLanguage();
  const [override, setOverride] = useState<Language | null>(null);
  const lang: Language = override ?? uiLang;
  const other: Language = lang === 'fr' ? 'en' : 'fr';
  const doc = DOCS[kind];
  const sections: readonly LegalSection[] = doc.sections[lang];
  const otherKind: DocKind = kind === 'terms' ? 'privacy' : 'terms';
  const date = LEGAL_INFO.effectiveDate;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <style>{`
        .legal-placeholder { background: var(--highlight); color: var(--highlight-foreground); padding: 0 .2em; border-radius: 2px; }
        @media print {
          .legal-doc { font-size: 11pt; line-height: 1.5; color: #000; }
          .legal-doc a { color: #000; }
          .legal-doc section { break-inside: avoid-page; }
        }
      `}</style>
      <header className="border-b print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-8">
          <a href="#/" className="flex items-center gap-2" aria-label="OSIG">
            <Logo size="lg" />
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="legal-doc mx-auto max-w-5xl px-4 py-10 md:px-8 md:py-14" lang={lang}>
        {isDev && (
          <p className="mb-8 rounded-md border border-dashed border-amber-500/60 bg-amber-500/10 px-4 py-3 text-sm print:hidden">
            {t('Development note: this is a draft for legal review. Highlighted values are placeholders to fill in legal-info.ts.')}
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <article className="max-w-[70ch]">
            <h1 className="font-display text-3xl font-bold leading-tight break-words md:text-4xl">{doc.title[lang]}</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {t('Last updated')}: <time dateTime={date.value}>{formatDate(date.value, lang)}</time>
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm print:hidden">
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground text-muted-foreground"
                onClick={() => setOverride(other)}
                lang={other}
              >
                {other === 'fr' ? 'Lire en français' : 'Read in English'}
              </button>
              <a href={`#/${otherKind}`} className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
                {DOCS[otherKind].title[lang]}
              </a>
            </div>
            {lang === 'en' && (
              <p className="mt-4 text-sm text-muted-foreground">
                {t('This English version is provided for convenience. The French version prevails.')}
              </p>
            )}

            <nav aria-label={t('On this page')} className="mt-8 rounded-lg border p-4 lg:hidden print:hidden">
              <TocList kind={kind} sections={sections} label={t('On this page')} />
            </nav>

            <div className={PROSE}>
              {sections.map((s, i) => (
                <section key={s.id} id={`${kind}-${s.id}`} className="scroll-mt-6 pt-10">
                  <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl">
                    {i + 1}. {s.title}
                  </h2>
                  {s.body}
                </section>
              ))}
            </div>
          </article>

          <aside className="hidden lg:block print:hidden">
            <nav aria-label={t('On this page')} className="sticky top-6">
              <TocList kind={kind} sections={sections} label={t('On this page')} />
            </nav>
          </aside>
        </div>
      </main>
    </div>
  );

}

export function TermsPage() {
  return <LegalDocument kind="terms" />;
}

export function PrivacyPage() {
  return <LegalDocument kind="privacy" />;
}
