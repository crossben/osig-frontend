'use client';

// Retention, alerts and language.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { errorText } from './auth-errors';
import { useT } from '@/lib/i18n';
import { usePush } from '@/features/footprint/device';

const RETENTION = [
  { value: 'never', label: 'Never' },
  { value: '30', label: 'After 30 days' },
  { value: '90', label: 'After 90 days' },
  { value: '180', label: 'After 180 days' },
  { value: '365', label: 'After a year' },
];

export function PreferencesSection() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const t = useT();
  const initRetention = user?.retentionDays ? String(user.retentionDays) : 'never';
  const [retention, setRetention] = useState(initRetention);
  const [notifyEmail, setNotifyEmail] = useState(!!user?.notifyEmail);
  const initDigest = !!(user as { digestEnabled?: boolean } | null)?.digestEnabled;
  const [digest, setDigest] = useState(initDigest);
  const push = usePush();
  const [webhookUrl, setWebhookUrl] = useState(user?.webhookUrl ?? '');
  const [language, setLanguage] = useState<'en' | 'fr'>(user?.language ?? 'en');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  if (!user) return null;

  // Keep a custom value set elsewhere (e.g. via the API) selectable
  const options = RETENTION.some((o) => o.value === initRetention)
    ? RETENTION
    : [...RETENTION, { value: initRetention, label: 'After {n} days' }];

  const dirty = retention !== initRetention
    || notifyEmail !== !!user.notifyEmail
    || digest !== initDigest
    || webhookUrl.trim() !== (user.webhookUrl ?? '')
    || language !== (user.language ?? 'en');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const hook = webhookUrl.trim();
    if (hook) {
      let ok = false;
      try { ok = new URL(hook).protocol === 'https:'; } catch { ok = false; }
      if (!ok) return setError(t('The webhook URL must start with https://'));
    }
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        retentionDays: retention === 'never' ? null : Number(retention),
        notifyEmail,
        ...({ digestEnabled: digest } as object),
        webhookUrl: hook || null,
        language,
      });
      setUser(updated);
      setWebhookUrl(updated.webhookUrl ?? '');
      toast({ title: t('Preferences saved') });
    } catch (err) {
      setError(errorText(err, t('Your preferences weren’t saved. Try again.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-card p-6 md:p-8">
      <h2 className="font-display text-xl font-semibold">{t('Preferences')}</h2>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">{t('How long we keep your scans and how we tell you about watches.')}</p>
      <form onSubmit={save} className="space-y-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('Delete scans automatically')}</Label>
            <Select value={retention} onValueChange={setRetention}>
              <SelectTrigger className="w-full bg-background" aria-label={t('Delete scans automatically')}><SelectValue /></SelectTrigger>
              <SelectContent>
                {options.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.label, { n: initRetention })}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('Language')}</Label>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'en' | 'fr')}>
              <SelectTrigger className="w-full bg-background" aria-label={t('Language')}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
          <div>
            <Label htmlFor="notifyEmail">{t('Email me about watches')}</Label>
            <p className="mt-1 text-sm text-muted-foreground">{t('When a watched target shows new findings.')}</p>
          </div>
          <Switch id="notifyEmail" checked={notifyEmail} onCheckedChange={setNotifyEmail} />
        </div>

        <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
          <div>
            <Label htmlFor="digestEnabled">{t('Weekly email')}</Label>
            <p className="mt-1 text-sm text-muted-foreground">{t('Your protection score and what to do next, once a week.')}</p>
          </div>
          <Switch id="digestEnabled" checked={digest} onCheckedChange={setDigest} />
        </div>

        {push.supported && (
          <div className="flex items-start justify-between gap-4 rounded-xl border bg-background p-4">
            <div>
              <Label htmlFor="pushEnabled">{t('Notifications on this device')}</Label>
              <p className="mt-1 text-sm text-muted-foreground">{t('A notification here when something new turns up. Changes right away.')}</p>
            </div>
            <Switch id="pushEnabled" checked={push.on} disabled={push.busy} onCheckedChange={(v) => push.set(v)} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="webhookUrl">{t('Webhook URL')}</Label>
          <Input
            id="webhookUrl"
            type="url"
            inputMode="url"
            placeholder="https://hooks.slack.com/services/…"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="bg-background"
          />
          <p className="text-xs text-muted-foreground">{t('Slack, Discord or any https endpoint. We post there when a watch finds something. Leave empty to turn it off.')}</p>
        </div>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" disabled={!dirty || saving}>{saving ? t('Saving…') : t('Save preferences')}</Button>
      </form>
    </section>
  );
}
