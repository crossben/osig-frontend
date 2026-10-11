'use client';

// Family protection: people you protect (Pro), and households you're part of.

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserGroupIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { errMessage, errStatus, meApi } from '@/lib/api-me';
import { scoreTone } from './score-card';

export function HouseholdCard() {
  const t = useT();
  const qc = useQueryClient();
  const { toast } = useToast();
  const q = useQuery({ queryKey: ['me', 'household'], queryFn: meApi.household });
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade?: boolean } | null>(null);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await meApi.invite(email.trim());
      toast({ title: t('Invitation sent to {email}', { email: email.trim() }) });
      setEmail('');
      await qc.invalidateQueries({ queryKey: ['me', 'household'] });
    } catch (err) {
      setError({ text: errMessage(err, t('The invitation wasn’t sent. Try again.')), upgrade: errStatus(err) === 402 });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, question: string) => {
    if (!window.confirm(question)) return;
    try {
      await meApi.removeMember(id);
      await qc.invalidateQueries({ queryKey: ['me', 'household'] });
    } catch (err) {
      toast({ title: errMessage(err, t('That didn’t work. Try again in a moment.')), variant: 'destructive' });
    }
  };

  if (q.isLoading) return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (!q.data) return null;
  const { limit, members, memberOf } = q.data;

  return (
    <section aria-labelledby="hh-title" className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <UserGroupIcon className="h-5 w-5 text-trace" aria-hidden="true" />
        <h2 id="hh-title" className="font-display text-xl font-semibold">{t('Your family')}</h2>
      </div>

      {limit === 0 ? (
        <div className="mt-3">
          <p className="text-muted-foreground">{t('Protect up to 5 people with Pro. You see each person’s score and how many things they have to do, never their addresses or findings.')}</p>
          <Button asChild variant="outline" className="mt-4"><a href="#/billing">{t('See Pro')}</a></Button>
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('You see their score and to-do count, never their addresses or findings. {n} of {limit} places used.', { n: members.length, limit })}
          </p>
          {members.length > 0 && (
            <ul className="mt-3 divide-y">
              {members.map((m) => {
                const tone = scoreTone(m.score ?? null);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium [overflow-wrap:anywhere]">{m.name || m.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.status === 'invited' ? t('Invitation sent, waiting for them to accept')
                          : m.score == null ? t('First check not done yet')
                            : <><span className={tone.color}>{t('Score {n}', { n: m.score })}</span>, {m.openActions === 1 ? t('1 thing to do') : t('{n} things to do', { n: m.openActions ?? 0 })}</>}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost"
                      onClick={() => remove(m.id, t('Stop protecting {email}?', { email: m.email }))}>{t('Remove')}</Button>
                  </li>
                );
              })}
            </ul>
          )}
          {members.length < limit && (
            <form onSubmit={invite} className="mt-3 space-y-2" noValidate>
              <Label htmlFor="hh-email">{t('Invite someone by email')}</Label>
              <div className="flex flex-wrap gap-2">
                <Input id="hh-email" type="email" inputMode="email" autoCapitalize="none" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="min-w-0 flex-1 basis-44 bg-background" />
                <Button type="submit" disabled={busy || !email.includes('@')}>{busy ? t('Sending…') : t('Send invitation')}</Button>
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error.text}{' '}
                  {error.upgrade && <a href="#/billing" className="font-medium underline underline-offset-4">{t('See plans')}</a>}
                </p>
              )}
            </form>
          )}
        </>
      )}

      {memberOf.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-medium">{t('People protecting you')}</h3>
          <ul className="mt-2 space-y-2">
            {memberOf.map((m) => (
              <li key={m.id} className="flex items-center gap-3">
                <p className="min-w-0 flex-1 break-all text-sm">{m.ownerName || m.ownerEmail}</p>
                <Button size="sm" variant="ghost"
                  onClick={() => remove(m.id, t('Leave {name}’s household? They’ll stop seeing your score.', { name: m.ownerName || m.ownerEmail || '' }))}>
                  {t('Leave')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
