'use client';

// My footprint: a personal protection score, a short to-do list that raises
// it, what we watch, family protection and deletion letters. Also the two
// landing pages for emailed links (household invitation, identity check).

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { useT } from '@/lib/i18n';
import { errMessage, errStatus, meApi, type Footprint } from '@/lib/api-me';
import { ScoreCard } from './score-card';
import { TodoList } from './todo-list';
import { IdentitiesPanel } from './identities-panel';
import { HouseholdCard } from './household-card';
import { LettersSection } from './letters-section';
import { Onboarding } from './onboarding';
import { DeviceCard } from './device';

const POLL_MS = 8000;
const POLL_FOR_MS = 6 * 60_000;

export function FootprintPage() {
  const t = useT();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [pollUntil, setPollUntil] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [setup, setSetup] = useState<boolean | null>(null);

  const q = useQuery({
    queryKey: ['me', 'footprint'],
    queryFn: meApi.footprint,
    refetchInterval: (query) => {
      const d = query.state.data as Footprint | undefined;
      const waiting = d && d.identities.length > 0 && d.score === null;
      return waiting || Date.now() < pollUntil ? POLL_MS : false;
    },
  });
  const data = q.data;

  // Show the setup steps on a first visit (no identities yet) until finished
  if (data && setup === null) setSetup(data.identities.length === 0);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const res = await meApi.refresh();
      setPollUntil(Date.now() + POLL_FOR_MS);
      await qc.invalidateQueries({ queryKey: ['me', 'footprint'] });
      if (res.started.length) toast({ title: t('Checking now. Results come in over the next few minutes.') });
      else if (res.skipped.length) toast({ title: res.skipped[0].reason, variant: 'destructive' });
      else toast({ title: t('Nothing to check yet. Confirm an address first.') });
    } catch (e) {
      toast({
        title: errStatus(e) === 429 ? t('You’ve checked a few times already. Try again in an hour.')
          : errMessage(e, t('The check didn’t start. Try again in a moment.')),
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="w-full min-w-0">
      <PageHeader title={t('My footprint')}
        description={t('What the internet knows about you, and simple steps to keep it safe.')} />

      {q.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : !data ? (
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-destructive">{t('Your footprint couldn’t be loaded.')}</p>
          <Button variant="outline" className="mt-3" onClick={() => q.refetch()}>{t('Try again')}</Button>
        </div>
      ) : setup ? (
        <Onboarding identities={data.identities} onFinish={() => { setSetup(false); setPollUntil(Date.now() + POLL_FOR_MS); }} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            <ScoreCard data={data} openCount={data.actions.open.filter((a) => !a.key?.startsWith('request:')).length}
              lettersWaiting={data.actions.open.some((a) => a.key?.startsWith('request:'))} refreshing={refreshing} onRefresh={refresh} />
            <TodoList data={data} />
            <LettersSection identities={data.identities} />
          </div>
          <div className="min-w-0 space-y-6">
            <IdentitiesPanel identities={data.identities} />
            <HouseholdCard />
            <DeviceCard />
          </div>
        </div>
      )}
    </div>
  );
}

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  const qs = window.location.hash.split('?')[1];
  return qs ? new URLSearchParams(qs).get('token') : null;
}

type Phase = { state: 'working' } | { state: 'ok'; text: string } | { state: 'error'; text: string };

function LinkResult({ title, phase, children }: { title: string; phase: Phase; children?: React.ReactNode }) {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center sm:p-8" role="status" aria-live="polite">
        {phase.state === 'ok' && <CheckCircleIcon className="mx-auto h-10 w-10 text-success" aria-hidden="true" />}
        {phase.state === 'error' && <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />}
        <h1 className="mt-3 font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{phase.state === 'working' ? t('One moment…') : phase.text}</p>
        {children}
      </div>
    </div>
  );
}

/** #/household/accept?token=... (signed in: the router shows sign-in first and comes back here) */
export function HouseholdAcceptPage() {
  const t = useT();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>(() => (readToken() ? { state: 'working' }
    : { state: 'error', text: t('This invitation link is incomplete. Open it again from the email.') }));
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = readToken();
    if (!token) return;
    meApi.acceptInvite(token)
      .then(() => {
        qc.invalidateQueries({ queryKey: ['me'] });
        setPhase({ state: 'ok', text: t('You’ve joined. They’ll see your score and to-do count, never your details.') });
        setTimeout(() => { window.location.hash = '#/footprint'; }, 2500);
      })
      .catch((e) => setPhase({ state: 'error', text: errMessage(e, t('This invitation is invalid or has expired.')) }));
  }, [qc, t]);

  return (
    <LinkResult title={t('Household invitation')} phase={phase}>
      {phase.state !== 'working' && (
        <Button asChild className="mt-6"><a href="#/footprint">{t('Go to my footprint')}</a></Button>
      )}
    </LinkResult>
  );
}

/** #/verify-identity?token=... (works signed out) */
export function IdentityVerifyPage() {
  const t = useT();
  const [phase, setPhase] = useState<Phase>(() => (readToken() ? { state: 'working' }
    : { state: 'error', text: t('This link is incomplete. Open it again from the email.') }));
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = readToken();
    if (!token) return;
    meApi.confirmIdentityEmail(token)
      .then((r) => setPhase({ state: 'ok', text: t('{value} is confirmed. We’ll watch it from now on.', { value: r.value }) }))
      .catch((e) => setPhase({ state: 'error', text: errMessage(e, t('This link is invalid or has expired.')) }));
  }, [t]);

  return (
    <LinkResult title={t('Confirm an address')} phase={phase}>
      {phase.state !== 'working' && (
        <Button asChild className="mt-6"><a href="#/footprint">{t('Go to my footprint')}</a></Button>
      )}
    </LinkResult>
  );
}
