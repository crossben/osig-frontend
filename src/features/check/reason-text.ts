// Plain-language sentences for each scam-check reason code. The backend
// sends English text too; this lets the UI translate it (unknown codes fall
// back to the backend text). {e} is the reason's evidence.

import type { CheckReason } from '@/lib/api-check';

type T = (s: string, vars?: Record<string, string | number>) => string;

const WITH_EVIDENCE: Record<string, string> = {
  brand_in_subdomain: 'The address {e} puts a well-known name at the start but belongs to someone else: a classic trick to impersonate a company.',
  brand_lookalike: 'The address {e} uses a company’s name but is not its official site.',
  brand_typosquat: 'The address {e} is a misspelling of a real company’s address.',
  brand_homoglyph: 'The address {e} swaps look-alike characters to imitate a real company.',
  freemail_brand: 'The address {e} claims to be a company but is a free mailbox. Real companies use their own domain.',
  msg_brand_mention: 'The message presents itself as coming from {e}.',
  msg_impersonation_request: 'It claims to be {e} and asks for a code or money. {e} never asks for that by message.',
  redirects_elsewhere: 'The link actually leads to {e}.',
};

const PLAIN: Record<string, string> = {
  brand_in_subdomain: 'The address puts a well-known name at the start but belongs to someone else: a classic trick to impersonate a company.',
  brand_lookalike: 'The address uses a company’s name but is not its official site.',
  brand_typosquat: 'The address is a misspelling of a real company’s address.',
  brand_homoglyph: 'The address swaps look-alike characters to imitate a real company.',
  idn_domain: 'The address uses international characters that can imitate other letters.',
  suspicious_tld: 'The address ends in a cheap extension often used for scam sites.',
  long_hostname: 'The address is unusually long or has many hyphens.',
  no_https: 'The link does not use a secure (https) connection.',
  url_shortener: 'The link is shortened, which hides where it really goes.',
  userinfo_in_url: 'The link hides its real destination after an @ sign.',
  ip_address_url: 'The link points to a bare number (IP address) instead of a named website.',
  no_dns: 'This website does not exist: it was taken down or never existed.',
  private_address: 'The link points to a private network address, so we did not open it.',
  virustotal_malicious: 'Security companies flag this site as dangerous.',
  virustotal_suspicious: 'Security companies flag this site as suspicious.',
  urlscan_malicious: 'This site has been seen serving dangerous pages.',
  redirects_elsewhere: 'The link sends you on to another website.',
  freemail_brand: 'The address claims to be a company but is a free mailbox. Real companies use their own domain.',
  disposable_email: 'The address uses a throwaway email service.',
  no_mx: 'This address cannot receive email.',
  no_spf_dmarc: 'Anyone could send email pretending to be this domain (no anti-spoofing records).',
  invalid_phone: 'This phone number cannot exist.',
  premium_rate_phone: 'Calling this number costs a lot of money (premium rate).',
  voip_phone: 'This is an internet number, easy to get without giving your identity.',
  special_rate_phone: 'This is a special-rate or forwarding number.',
  msg_code_request: 'The message asks you for a code, PIN or password.',
  msg_fee_request: 'The message asks you to pay a fee or send money first.',
  msg_prize: 'The message says you won a prize or a gift.',
  msg_urgency: 'The message pushes you to act fast or threatens you.',
  msg_too_good_offer: 'The offer sounds too good to be true.',
  msg_link_request: 'The message asks you to click a link.',
  msg_call_request: 'The message asks you to call or write to a number.',
  msg_brand_mention: 'The message presents itself as coming from a known company.',
  msg_impersonation_request: 'It claims to be a known company and asks for a code or money. Real companies never ask for that by message.',
};

// Codes whose evidence is a number of days / a country, parsed from the text
function fromText(code: string, text: string, t: T): string | null {
  const n = text.match(/(-?\d+)/)?.[1];
  const cc = text.match(/\(([A-Z]{2})\)/)?.[1];
  switch (code) {
    case 'new_domain':
      return n ? t('The website was created only {n} days ago.', { n: Math.max(0, Number(n)) }) : t('The website was created very recently.');
    case 'young_domain':
      return n ? t('The website is less than 6 months old ({n} days).', { n }) : t('The website is less than 6 months old.');
    case 'new_certificate':
      return n ? t('The site’s security certificate is only {n} days old.', { n }) : t('The site’s security certificate is very new.');
    case 'foreign_phone':
      return cc ? t('This number is registered in another country ({c}).', { c: cc }) : t('This number is registered in another country.');
    case 'phone_country_mismatch':
      return cc
        ? t('The message mentions a local company but the number is from abroad ({c}).', { c: cc })
        : t('The message mentions a local company but the number is from abroad.');
    default:
      return null;
  }
}

export function reasonText(r: CheckReason, t: T): string {
  const special = fromText(r.code, r.text, t);
  if (special) return special;
  if (r.evidence && WITH_EVIDENCE[r.code]) return t(WITH_EVIDENCE[r.code], { e: r.evidence });
  if (PLAIN[r.code]) return t(PLAIN[r.code]);
  return r.text;
}

export const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function sortReasons(rs: CheckReason[]): CheckReason[] {
  return [...rs].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 5) - (SEVERITY_ORDER[b.severity] ?? 5));
}
