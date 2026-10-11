'use client';

// What we watch for you: emails, phone numbers, usernames and domains,
// with their verification state, and the form to add more.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AtSymbolIcon, ClipboardDocumentIcon, DevicePhoneMobileIcon, EnvelopeIcon, GlobeAltIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { errMessage, errStatus, meApi, type Identity, type IdentityKind } from '@/lib/api-me';
import { useRelativeTime } from './score-card';

export const KIND_ICON: Record<IdentityKind, typeof EnvelopeIcon> = {
  email: EnvelopeIcon, phone: DevicePhoneMobileIcon, username: AtSymbolIcon, domain: GlobeAltIcon,
};
const KIND_LABEL: Record<IdentityKind, string> = {
  email: 'Email address', phone: 'Phone number', username: 'Username', domain: 'Website domain',
};
const PLACEHOLDER: Record<IdentityKind, string> = {
  email: 'you@example.com', phone: '+221 77 123 45 67', username: 'yourname', domain: 'example.com',
};

export function useCopy() {
  const t = useT();
  const { toast } = useToast();
  return async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t('Copied') });
    } catch {
      toast({ title: t('Copy didn’t work. Select the text and copy it yourself.'), variant: 'destructive' });
    }
  };
}

export function AddIdentityForm({ kind: fixedKind, defaultValue = '', submitLabel, onAdded }: {
  kind?: IdentityKind; defaultValue?: string; submitLabel?: string; onAdded?: (i: Identity) => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const [kind, setKind] = useState<IdentityKind>(fixedKind ?? 'email');
  const [value, setValue] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade?: boolean } | null>(null);
  const id = `add-${fixedKind ?? 'any'}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const added = await meApi.addIdentity(kind, value.trim());
      setValue('');
      await qc.invalidateQueries({ queryKey: ['me'] });
      onAdded?.(added);
    } catch (err) {
      const status = errStatus(err);
      setError(status === 402
        ? { text: errMessage(err, t('Your plan can’t protect more identities.')), upgrade: true }
        : { text: errMessage(err, t('That couldn’t be added. Check it and try again.')) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <div className="flex flex-wrap gap-2">
        {!fixedKind && (
          <Select value={kind} onValueChange={(v) => setKind(v as IdentityKind)}>
            <SelectTrigger className="w-full bg-background" aria-label={t('What to add')}><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(KIND_LABEL) as IdentityKind[]).map((k) => (
                <SelectItem key={k} value={k}>{t(KIND_LABEL[k])}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Label htmlFor={id} className="sr-only">{t(KIND_LABEL[kind])}</Label>
        <Input id={id} value={value} onChange={(e) => setValue(e.target.value)} placeholder={PLACEHOLDER[kind]}
          inputMode={kind === 'email' ? 'email' : kind === 'phone' ? 'tel' : 'text'}
          autoCapitalize="none" autoCorrect="off" spellCheck={false} className="min-w-0 flex-1 basis-44 bg-background" />
        <Button type="submit" disabled={busy || !value.trim()}>{busy ? t('Adding…') : submitLabel ?? t('Add')}</Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error.text}{' '}
          {error.upgrade && <a href="#/billing" className="font-medium underline underline-offset-4">{t('See plans')}</a>}
        </p>
      )}
    </form>
  );
}

function IdentityRow({ ident }: { ident: Identity }) {
  const t = useT();
  const qc = useQueryClient();
  const { toast } = useToast();
  const copy = useCopy();
  const rel = useRelativeTime();
  const [busy, setBusy] = useState(false);
  const Icon = KIND_ICON[ident.kind] ?? AtSymbolIcon;
  const v = ident.verification;

  const verify = async () => {
    setBusy(true);
    try {
      const res = await meApi.verifyIdentity(ident.id);
      if (res.verified) toast({ title: t('Confirmed. We’re watching it now.') });
      else if (ident.kind === 'email') toast({ title: t('We sent a new link to {email}.', { email: ident.value }) });
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (e) {
      toast({ title: errMessage(e, t('That didn’t work. Try again in a moment.')), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(t('Stop watching {value}? Its to-dos are removed too.', { value: ident.value }))) return;
    setBusy(true);
    try {
      await meApi.removeIdentity(ident.id);
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (e) {
      toast({ title: errMessage(e, t('That didn’t work. Try again in a moment.')), variant: 'destructive' });
      setBusy(false);
    }
  };

  const status = ident.watching && ident.verified
    ? (ident.lastCheckedAt ? t('Watching, checked {when}', { when: rel(ident.lastCheckedAt) ?? '' }) : t('Watching'))
    : ident.watching ? t('Watching') : ident.verified ? t('Confirmed') : t('Not confirmed yet');

  return (
    <li className="py-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-trace">
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{t(KIND_LABEL[ident.kind])}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium [overflow-wrap:anywhere]">{ident.value}</p>
          <p className="text-sm text-muted-foreground">
            {status}
            {ident.findings > 0 && <> {t('with {n} to do', { n: ident.findings })}</>}
          </p>
        </div>
        <Button size="icon" variant="ghost" onClick={remove} disabled={busy} aria-label={t('Remove {value}', { value: ident.value })}>
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {!ident.verified && v && (
        <div className="ml-12 mt-2 text-sm">
          {v.method === 'email_link' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">{t('Open the link we emailed to this address.')}</span>
              <Button size="sm" variant="outline" onClick={verify} disabled={busy}>{t('Send the link again')}</Button>
            </div>
          )}
          {v.method === 'dns_txt' && v.record && (
            <div className="space-y-2">
              <p className="text-muted-foreground">{t('To prove the domain is yours, add this TXT record in your DNS settings for {host}:', { host: v.host ?? ident.value })}</p>
              <div className="flex items-center gap-2 rounded-lg border bg-background p-2">
                <code className="min-w-0 flex-1 break-all font-mono text-xs">{v.record}</code>
                <Button size="icon" variant="ghost" onClick={() => copy(v.record!)} aria-label={t('Copy the record')}>
                  <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              <Button size="sm" variant="outline" onClick={verify} disabled={busy}>{busy ? t('Checking…') : t('Check now')}</Button>
            </div>
          )}
          {v.method === 'unavailable' && (
            <p className="text-muted-foreground">{t('Saved. Checking phone numbers by text message is coming soon, so this one isn’t watched yet.')}</p>
          )}
        </div>
      )}
    </li>
  );
}

export function IdentitiesPanel({ identities }: { identities: Identity[] }) {
  const t = useT();
  return (
    <section aria-labelledby="ids-title" className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 id="ids-title" className="font-display text-xl font-semibold">{t('What we watch')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('Your addresses, numbers and usernames. Only you see them.')}</p>
      <ul className="mt-2 divide-y">
        {identities.map((i) => <IdentityRow key={i.id} ident={i} />)}
      </ul>
      <div className="mt-3 border-t pt-4">
        <AddIdentityForm />
      </div>
    </section>
  );
}
