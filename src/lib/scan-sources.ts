// ============================================
// What each scan runs, per target type and depth.
// Mirrors backend/app/workers/scan_tasks.py _get_core_modules/_get_async_modules
// (+ google_dork.py for every type) — update both together. Background modules
// (code_leaks, doc_metadata, darkweb, compliance_intel) run after the core ones.
// ============================================

import type { ScanType, TargetType } from '@/types';

export interface ScanSource {
  name: string;
  what: string;
  /** Only runs on deep scans */
  deepOnly?: boolean;
}

export const SCAN_SOURCES: Record<TargetType, ScanSource[]> = {
  email: [
    { name: 'Gravatar', what: 'Public profile and verified linked accounts' },
    { name: 'XposedOrNot', what: 'Known breaches and what data leaked' },
    { name: 'GitHub commits', what: 'Accounts that committed with this address' },
    { name: 'Hudson Rock', what: 'Infostealer malware exposure (no credentials kept)' },
    { name: 'PGP keyservers', what: 'Published keys, verified and unverified' },
    { name: 'Disposable check', what: '~4,000 throwaway-address providers' },
    { name: 'Mail domain', what: 'MX records and mail provider' },
    { name: 'Holehe', what: 'Sites the address is registered on', deepOnly: true },
    { name: 'EmailRep', what: 'Reputation (rate limited)', deepOnly: true },
    { name: 'Have I Been Pwned', what: 'Breaches, when an API key is set', deepOnly: true },
    { name: 'GitHub code search', what: 'Leaked secrets next to the address, when a token is set (redacted)' },
    { name: 'Sanctions & offshore screening', what: 'Names on public profiles vs. sanctions/PEP lists and Offshore Leaks' },
  ],
  username: [
    { name: 'Developer & social APIs', what: 'GitHub, GitLab, Keybase, Mastodon, Bluesky and more' },
    { name: 'Public profiles', what: 'Name, bio, location, website, linked accounts' },
    { name: 'Hudson Rock', what: 'Infostealer malware exposure' },
    { name: 'More platforms', what: 'Chess.com, Lichess, Steam, SoundCloud, Patreon, Replit', deepOnly: true },
    { name: 'WhatsMyName', what: '~650 sites, each with exists/missing signals', deepOnly: true },
    { name: 'Instaloader', what: 'Public Instagram profile', deepOnly: true },
    { name: 'Sanctions & offshore screening', what: 'Names on public profiles vs. sanctions/PEP lists and Offshore Leaks' },
  ],
  domain: [
    { name: 'WHOIS', what: 'Registrar, dates and registrant' },
    { name: 'DNS', what: 'A, AAAA, MX, NS and TXT records' },
    { name: 'Subdomains', what: '~60 common names, wildcard-aware' },
    { name: 'IP intelligence', what: 'Network, ASN and location per address' },
    { name: 'HTTPS probe', what: 'Server, page title, TLS issuer and expiry' },
    { name: 'Shodan InternetDB', what: 'Open ports and known CVEs per server, passively' },
    { name: 'Site hygiene', what: 'security.txt, robots.txt, favicon hash, tech stack' },
    { name: 'Mail security', what: 'MTA-STS, BIMI and DKIM selectors' },
    { name: 'Hudson Rock', what: 'Employee and customer logins in infostealer logs' },
    { name: 'Homepage snapshot', what: 'Content fingerprint, so watches report homepage changes' },
    { name: 'AlienVault OTX', what: 'Threat reports and malware, when a key is set' },
    { name: 'GreyNoise', what: 'Reputation of the domain’s servers' },
    { name: 'GitHub code search', what: 'Leaked secrets next to the domain, when a token is set (redacted)' },
    { name: 'Document metadata', what: 'Authors and software in public PDFs and Office files' },
    { name: 'ransomware.live', what: 'Ransomware leak-site claims, when enabled' },
    { name: 'Sanctions & offshore screening', what: 'Registrant vs. sanctions/PEP lists and Offshore Leaks' },
    { name: 'Certificate Transparency', what: 'Every certified hostname, live or not', deepOnly: true },
    { name: 'Sublist3r', what: 'Subdomains from search engines', deepOnly: true },
    { name: 'Reverse IP', what: 'Other sites on the same server', deepOnly: true },
    { name: 'Homepage', what: 'Contacts, entities and impersonation check', deepOnly: true },
    { name: 'Wayback Machine', what: 'When the site was first archived', deepOnly: true },
    { name: 'URLScan', what: 'Recent public scans of the site', deepOnly: true },
    { name: 'Lookalike domains', what: 'Registered typo-squats and homoglyphs (dnstwist)', deepOnly: true },
    { name: 'VirusTotal', what: 'Vendor verdicts, when a key is set', deepOnly: true },
  ],
  phone: [
    { name: 'libphonenumber', what: 'Country, carrier, line type and time zone' },
    { name: 'numverify', what: 'Live validity and carrier, when a key is set' },
  ],
  ip: [
    { name: 'Reverse DNS', what: 'Hostname, forward-confirmed' },
    { name: 'IP intelligence', what: 'Network owner, ASN and location' },
    { name: 'Shodan InternetDB', what: 'Open ports, software and known CVEs' },
    { name: 'GreyNoise', what: 'Is it scanning the internet, or a known service' },
    { name: 'AlienVault OTX', what: 'Threat reports and malware, when a key is set' },
    { name: 'Reverse IP', what: 'Other domains hosted on it', deepOnly: true },
    { name: 'AbuseIPDB', what: 'Abuse reports, when a key is set', deepOnly: true },
  ],
  organization: [
    { name: 'Wikidata', what: 'Website, HQ, founding, parent, executives, accounts' },
    { name: 'GLEIF', what: 'Registered legal entities (LEI)' },
    { name: 'OpenSanctions', what: 'Sanctions, PEP and crime lists, when a key is set' },
    { name: 'ICIJ Offshore Leaks', what: 'Offshore entities and officers (possible matches)' },
    { name: 'ransomware.live', what: 'Ransomware leak-site claims, when enabled' },
    { name: 'OpenCorporates', what: 'Company registers, when a token is set', deepOnly: true },
  ],
};

/** Runs for every target type, in the background after the core modules */
export const DORK_SOURCE: ScanSource = { name: 'Search dorks', what: 'Public mentions, filtered for relevance' };

export function sourcesFor(type: TargetType, depth: ScanType) {
  const all = [...SCAN_SOURCES[type], DORK_SOURCE];
  return { all, active: all.filter((s) => depth === 'deep' || !s.deepOnly) };
}
