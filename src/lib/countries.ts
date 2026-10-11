// Every country the browser can name, in the interface language, sorted by name.
// Codes are ISO 3166 alpha-2; Intl.DisplayNames returns the code itself for unknown ones.

import { useMemo } from 'react';
import { useLocale } from '@/lib/i18n';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
// Two-letter codes that name a region but not a country
const NOT_COUNTRIES = new Set(['EU', 'EZ', 'UN', 'QO', 'XA', 'XB', 'ZZ', 'AC', 'CP', 'DG', 'EA', 'IC', 'TA']);

export function useCountries(): { code: string; name: string }[] {
  const locale = useLocale();
  return useMemo(() => {
    let names: Intl.DisplayNames;
    try {
      names = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
    } catch {
      return [{ code: 'SN', name: 'Senegal' }];
    }
    const out: { code: string; name: string }[] = [];
    for (const a of LETTERS) {
      for (const b of LETTERS) {
        const code = a + b;
        if (NOT_COUNTRIES.has(code)) continue;
        const name = names.of(code);
        if (name && name !== code) out.push({ code, name });
      }
    }
    return out.sort((x, y) => x.name.localeCompare(y.name, locale));
  }, [locale]);
}
