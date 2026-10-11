'use client';

// Ask a company to delete your data: pick a letter, the company and what it
// covers, get a ready-to-send letter. Sending it is tracked as a to-do.

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardDocumentIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useT } from '@/lib/i18n';
import { errMessage, meApi, type Identity, type Letter } from '@/lib/api-me';
import { useCopy } from './identities-panel';

export function LettersSection({ identities }: { identities: Identity[] }) {
  const t = useT();
  const qc = useQueryClient();
  const copy = useCopy();
  const templatesQ = useQuery({ queryKey: ['me', 'templates'], queryFn: meApi.templates, staleTime: Infinity });
  const [templateId, setTemplateId] = useState('');
  const [company, setCompany] = useState('');
  const [recipient, setRecipient] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [letter, setLetter] = useState<Letter | null>(null);

  const templates = templatesQ.data ?? [];
  const chosen = templateId || templates[0]?.id || '';
  const template = templates.find((x) => x.id === chosen);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosen || !company.trim()) return;
    setBusy(true);
    setError('');
    try {
      setLetter(await meApi.letter(chosen, company.trim(), picked, recipient.trim()));
      await qc.invalidateQueries({ queryKey: ['me', 'footprint'] });
    } catch (err) {
      setError(errMessage(err, t('The letter couldn’t be written. Try again.')));
    } finally {
      setBusy(false);
    }
  };

  const mailto = letter?.recipientEmail
    ? `mailto:${encodeURIComponent(letter.recipientEmail)}?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.body)}`
    : null;

  return (
    <section aria-labelledby="letters-title" className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 id="letters-title" className="font-display text-xl font-semibold">{t('Ask companies to delete your data')}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('The law lets you ask a company to erase what it holds about you. We write the letter, you send it.')}</p>

      <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('Letter')}</Label>
            <Select value={chosen} onValueChange={setTemplateId}>
              <SelectTrigger className="w-full bg-background" aria-label={t('Letter')}><SelectValue placeholder={t('Choose a letter')} /></SelectTrigger>
              <SelectContent>
                {templates.map((x) => <SelectItem key={x.id} value={x.id}>{x.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {template && <p className="text-xs text-muted-foreground">{template.appliesTo}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="letter-company">{t('Company')}</Label>
            <Input id="letter-company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t('For example, Acme Ltd')} className="bg-background" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="letter-to">{t('Their privacy email (optional)')}</Label>
          <Input id="letter-to" type="email" inputMode="email" autoCapitalize="none" value={recipient}
            onChange={(e) => setRecipient(e.target.value)} placeholder="privacy@example.com" className="bg-background" />
        </div>
        {identities.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{t('What the letter covers')}</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {identities.map((i) => (
                <label key={i.id} className="flex min-w-0 items-center gap-2 text-sm">
                  <Checkbox checked={picked.includes(i.id)}
                    onCheckedChange={(c) => setPicked((p) => (c ? [...p, i.id] : p.filter((x) => x !== i.id)))} />
                  <span className="break-all">{i.value}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{t('Nothing ticked: the letter uses your account email.')}</p>
          </fieldset>
        )}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" disabled={busy || !chosen || !company.trim()}>{busy ? t('Writing…') : t('Write the letter')}</Button>
      </form>

      {letter && (
        <div className="mt-5 space-y-3 border-t pt-5" aria-live="polite">
          <p className="text-sm text-muted-foreground">{t('Here is your letter. We added “send it” to your to-do list so you can tick it off once it’s gone.')}</p>
          <div className="rounded-xl border bg-background">
            <div className="flex items-start gap-2 border-b p-3">
              <p className="min-w-0 flex-1 text-sm"><span className="text-muted-foreground">{t('Subject')}: </span><span className="font-medium">{letter.subject}</span></p>
              <Button size="icon" variant="ghost" onClick={() => copy(letter.subject)} aria-label={t('Copy the subject')}>
                <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
            <pre data-lenis-prevent className="max-h-80 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs leading-relaxed">{letter.body}</pre>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => copy(letter.body)}>
              <ClipboardDocumentIcon className="mr-2 h-4 w-4" aria-hidden="true" />{t('Copy the letter')}
            </Button>
            {mailto && (
              <Button asChild>
                <a href={mailto}><EnvelopeIcon className="mr-2 h-4 w-4" aria-hidden="true" />{t('Open in my email app')}</a>
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
