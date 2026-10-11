// ============================================
// Interface language (English / French)
//
// Strings are keyed by their English text: t('New scan') returns the French
// translation when the language is French and one exists, else the English.
// {name} placeholders are filled from vars. Signed-in users' choice is stored
// on their account (user.language); signed-out visitors' in localStorage.
// ============================================

'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { fr } from './fr';

export type Language = 'en' | 'fr';
export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
];

const STORAGE_KEY = 'osig-lang';
const listeners = new Set<() => void>();

function readStored(): Language | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'en' || v === 'fr' ? v : null;
  } catch {
    return null;
  }
}

function detect(): Language {
  return readStored() ?? (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en');
}

/** Language for signed-out pages (and the fallback before the user loads) */
export function setGuestLanguage(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* private mode: the choice lasts this page view */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useLanguage(): Language {
  const userLang = useAuthStore((s) => s.user?.language);
  const guest = useSyncExternalStore(subscribe, detect, () => 'en' as Language);
  const lang: Language = userLang === 'fr' || userLang === 'en' ? userLang : guest;
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return lang;
}

export function translate(lang: Language, text: string, vars?: Record<string, string | number>): string {
  let out = lang === 'fr' ? (fr[text] ?? text) : text;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

export function useT() {
  const lang = useLanguage();
  return useCallback((text: string, vars?: Record<string, string | number>) => translate(lang, text, vars), [lang]);
}

/** Locale for dates and numbers */
export function useLocale(): string {
  return useLanguage() === 'fr' ? 'fr-FR' : 'en-GB';
}

/** Current language outside React (toasts built from plain functions) */
export function getLanguage(): Language {
  const userLang = useAuthStore.getState().user?.language;
  if (userLang === 'fr' || userLang === 'en') return userLang;
  return typeof window === 'undefined' ? 'en' : detect();
}
