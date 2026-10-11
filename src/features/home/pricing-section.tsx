'use client';

// Landing page pricing, read from the public plans endpoint

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/motion/reveal';
import { useAuthStore } from '@/store';
import { api } from '@/lib/api';
import { useT } from '@/lib/i18n';
import { CONTACT_EMAIL, PlanComparison } from '@/features/billing/plan-table';

export function PricingSection() {
  const t = useT();
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  const { data } = useQuery({ queryKey: ['billing', 'plans'], queryFn: () => api.getBillingPlans(), staleTime: 300_000 });
  if (!data?.plans.length) return null;

  const go = () => { window.location.hash = signedIn ? '#/billing' : '#/register'; };

  return (
    <section id="pricing" className="border-t">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8">
        <Reveal className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold md:text-4xl">{t('Plans')}</h2>
          <p className="mt-3 text-muted-foreground">
            {t('Start free. Move to Pro when you need deep scans, exports and more watches. Pay by mobile money in FCFA across UEMOA, or by card in dollars.')}
          </p>
        </Reveal>
        <Reveal className="mt-10">
          <PlanComparison plans={data.plans} />
        </Reveal>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button size="lg" onClick={go}>{signedIn ? t('See plans') : t('Create an account')}</Button>
          <p className="text-sm text-muted-foreground">
            {t('For a team or custom limits, write to')}{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-trace underline-offset-4 hover:underline">{CONTACT_EMAIL}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
