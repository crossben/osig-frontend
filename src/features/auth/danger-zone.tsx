'use client';

// Irreversible actions, each behind a typed confirmation.

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';
import { errorText } from './auth-errors';
import { useT } from '@/lib/i18n';

type T = ReturnType<typeof useT>;

// Singular / plural keys per count type
const LABELS: Record<string, [string, string]> = {
  scans: ['{n} scan', '{n} scans'],
  investigations: ['{n} investigation', '{n} investigations'],
  watches: ['{n} watch', '{n} watches'],
  reports: ['{n} report', '{n} reports'],
};

/** "Type {x} to confirm": translated text with a node in place of the placeholder */
function withNode(text: string, node: React.ReactNode) {
  const [before, after] = text.split('{x}');
  return <>{before}{node}{after}</>;
}

function describeCounts(counts: Record<string, number>, t: T): string {
  const parts = Object.entries(counts)
    .filter(([, n]) => typeof n === 'number' && n > 0)
    .map(([k, n]) => (LABELS[k] ? t(LABELS[k][n === 1 ? 0 : 1], { n }) : `${n} ${k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase()}`));
  return parts.length ? t('Deleted {items}.', { items: parts.join(', ') }) : t('There was nothing to delete.');
}

function Confirmed({ id, label, expected, value, onChange }: {
  id: string; label: React.ReactNode; expected: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-normal">{label}</Label>
      <Input id={id} autoComplete="off" spellCheck={false} placeholder={expected} value={value} onChange={(e) => onChange(e.target.value)} className="max-w-sm bg-background" />
    </div>
  );
}

export function DangerZone() {
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const t = useT();
  const [dataConfirm, setDataConfirm] = useState('');
  const [accountConfirm, setAccountConfirm] = useState('');
  const [busy, setBusy] = useState<'data' | 'account' | null>(null);
  if (!user) return null;

  const deleteData = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('data');
    try {
      const counts = await api.deleteMyData();
      setDataConfirm('');
      qc.invalidateQueries();
      toast({ title: t('Data deleted'), description: describeCounts(counts, t) });
    } catch (err) {
      toast({ variant: 'destructive', title: t('Your data wasn’t deleted'), description: errorText(err, t('Try again in a moment.')) });
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('account');
    try {
      await api.deleteAccount(accountConfirm.trim());
      qc.clear();
      logout();
      toast({ title: t('Account deleted'), description: t('Everything tied to it is gone.') });
      window.location.hash = '#/';
    } catch (err) {
      setBusy(null);
      toast({ variant: 'destructive', title: t('Your account wasn’t deleted'), description: errorText(err, t('Try again in a moment.')) });
    }
  };

  return (
    <section className="rounded-2xl border border-destructive/40 bg-card p-6 md:p-8">
      <h2 className="font-display text-xl font-semibold text-destructive">{t('Danger zone')}</h2>
      <p className="mb-2 mt-1 text-sm text-muted-foreground">{t('These can’t be undone.')}</p>

      <div className="divide-y">
        <form onSubmit={deleteData} className="space-y-4 py-5">
          <div>
            <p className="font-medium">{t('Delete all my data')}</p>
            <p className="text-sm text-muted-foreground">{t('Removes your scans and their results, reports, investigations and watches. Your account and API keys stay.')}</p>
          </div>
          <Confirmed id="confirmData" label={withNode(t('Type {x} to confirm'), <span className="font-mono font-semibold">DELETE</span>)} expected="DELETE" value={dataConfirm} onChange={setDataConfirm} />
          <Button type="submit" variant="destructive" disabled={dataConfirm !== 'DELETE' || busy !== null}>
            {busy === 'data' ? t('Deleting…') : t('Delete all my data')}
          </Button>
        </form>

        <form onSubmit={deleteAccount} className="space-y-4 pt-5">
          <div>
            <p className="font-medium">{t('Delete my account')}</p>
            <p className="text-sm text-muted-foreground">{t('Deletes your data and the account itself, then signs you out.')}</p>
          </div>
          <Confirmed id="confirmAccount" label={withNode(t('Type your email, {x}, to confirm'), <span className="font-mono font-semibold break-all">{user.email}</span>)} expected={user.email} value={accountConfirm} onChange={setAccountConfirm} />
          <Button type="submit" variant="destructive" disabled={accountConfirm.trim() !== user.email || busy !== null}>
            {busy === 'account' ? t('Deleting…') : t('Delete my account')}
          </Button>
        </form>
      </div>
    </section>
  );
}
