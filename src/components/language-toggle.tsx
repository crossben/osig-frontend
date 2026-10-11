'use client';

// EN / FR switch. Signed in: saved on the account; signed out: in this browser.

import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { setGuestLanguage, useLanguage, type Language } from '@/lib/i18n';
import { useAuthStore } from '@/store/auth-store';

export function LanguageToggle() {
  const lang = useLanguage();
  const { user, updateProfile } = useAuthStore();
  const next: Language = lang === 'fr' ? 'en' : 'fr';

  const switchTo = async () => {
    setGuestLanguage(next);
    if (user) {
      updateProfile({ language: next });
      try {
        await api.updateProfile({ language: next });
      } catch {
        /* still switched locally; saved next time */
      }
    }
  };

  return (
    <Button variant="ghost" size="sm" className="h-9 px-2.5 font-semibold" onClick={switchTo}
      aria-label={next === 'fr' ? 'Passer en français' : 'Switch to English'}
      lang={next}>
      {next.toUpperCase()}
    </Button>
  );
}
