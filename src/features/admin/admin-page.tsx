'use client';

// Admin console: platform stats, user management, audit log and outgoing mail.

import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import type { AdminUser } from '@/types';
import { useT, useLocale } from '@/lib/i18n';
import { AdminPayments, AdminPlans, GrantPlan } from './billing-admin';

function useFormat() {
  const t = useT();
  const locale = useLocale();
  return {
    fmt: (iso: string | null) => (iso ? new Date(iso).toLocaleString(locale) : t('Never')),
    fmtDate: (iso: string) => new Date(iso).toLocaleDateString(locale),
  };
}

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Card whose table scrolls sideways on its own instead of widening the page */
function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card">
      <div className="max-w-full overflow-x-auto" data-lenis-prevent>
        <table className="w-full min-w-max text-left text-sm">{children}</table>
      </div>
    </div>
  );
}

const th = 'whitespace-nowrap border-b px-4 py-3 text-xs font-medium text-muted-foreground';
const td = 'whitespace-nowrap px-4 py-2.5 align-middle';

function Empty({ cols, text }: { cols: number; text: string }) {
  return <tr><td colSpan={cols} className="px-4 py-10 text-center text-muted-foreground">{text}</td></tr>;
}

function Loading() {
  return <Skeleton className="h-64 w-full rounded-2xl" />;
}

// ── Overview ──────────────────────────────────────────
function Stat({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">{value ?? 0}</p>
    </div>
  );
}

function Breakdown({ title, data }: { title: string; data: Record<string, number> }) {
  const t = useT();
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t('No scans yet.')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map(([k, n]) => (
            <li key={k} className="text-sm">
              <div className="flex justify-between"><span>{t(k)}</span><span className="tabular-nums text-muted-foreground">{n}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-1.5 rounded-full bg-trace" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Overview() {
  const t = useT();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api.adminStats() });
  if (isLoading) return <Loading />;
  if (error || !data) return <p className="text-sm text-destructive">{t('Stats couldn’t be loaded. Reload the page to try again.')}</p>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label={t('Users')} value={data.users} />
        <Stat label={t('New users, 7 days')} value={data.users7d} />
        <Stat label={t('Scans')} value={data.scans} />
        <Stat label={t('Scans, 24 hours')} value={data.scans24h} />
        <Stat label={t('Failed sign-ins, 24 hours')} value={data.failedLogins24h} />
        <Stat label={t('Unsent mail')} value={data.mailPending} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Breakdown title={t('Scans by status')} data={data.scansByStatus} />
        <Breakdown title={t('Scans by type')} data={data.scansByType} />
      </div>
    </div>
  );
}

// ── Users ─────────────────────────────────────────────
function Users() {
  const [q, setQ] = useState('');
  const query = useDebounced(q.trim());
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useT();
  const { fmt, fmtDate } = useFormat();
  const key = ['admin', 'users', query];
  const { data, isLoading } = useQuery({ queryKey: key, queryFn: () => api.adminUsers(query) });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.adminUpdateUser>[1] }) => api.adminUpdateUser(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<AdminUser[]>(key);
      queryClient.setQueryData<AdminUser[]>(key, (old) => old?.map((u) => (u.id === id ? { ...u, ...patch } : u)));
      return { prev };
    },
    onSuccess: (fresh) => {
      queryClient.setQueryData<AdminUser[]>(key, (old) => old?.map((u) => (u.id === fresh.id ? fresh : u)));
      toast({ title: t('User updated'), description: fresh.email });
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
      toast({ variant: 'destructive', title: t('User not updated'), description: e.message });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] }),
  });
  const set = (u: AdminUser, patch: Parameters<typeof api.adminUpdateUser>[1]) => update.mutate({ id: u.id, patch });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search by email or username')}
          aria-label={t('Search users')} className="bg-card pl-9" />
      </div>
      {isLoading ? <Loading /> : (
        <TableCard>
          <thead>
            <tr>
              {['Email', 'Username', 'Plan', 'Active', 'Admin', 'Verified', '2FA', 'Google', 'Scans', 'Last sign-in', 'Joined', ''].map((h) => (
                <th key={h} className={th}>{t(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {!data?.length ? <Empty cols={12} text={query ? t('No users match “{query}”.', { query }) : t('No users yet.')} /> : data.map((u) => (
              <tr key={u.id}>
                <td className={`${td} font-medium`}>
                  {u.email}
                  {u.id === me?.id && <span className="ml-2 text-xs text-muted-foreground">{t('you')}</span>}
                </td>
                <td className={`${td} text-muted-foreground`}>{u.username}</td>
                <td className={td}>
                  <Select value={u.plan} onValueChange={(plan) => set(u, { plan: plan as AdminUser['plan'] })}>
                    <SelectTrigger size="sm" className="w-32 bg-background" aria-label={t('Plan for {email}', { email: u.email })}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">{t('Free')}</SelectItem>
                      <SelectItem value="pro">{t('Pro')}</SelectItem>
                      <SelectItem value="enterprise">{t('Enterprise')}</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className={td}>
                  <Switch checked={u.isActive} onCheckedChange={(isActive) => set(u, { isActive })} aria-label={t('Active: {email}', { email: u.email })} />
                </td>
                <td className={td}>
                  <Switch checked={u.isSuperuser} onCheckedChange={(isSuperuser) => set(u, { isSuperuser })} aria-label={t('Admin: {email}', { email: u.email })} />
                </td>
                <td className={td}>{u.emailVerified ? t('Yes') : <span className="text-muted-foreground">{t('No')}</span>}</td>
                <td className={td}>{u.totpEnabled ? t('On') : <span className="text-muted-foreground">{t('Off')}</span>}</td>
                <td className={td}>{u.googleLinked ? t('Linked') : <span className="text-muted-foreground">{t('No')}</span>}</td>
                <td className={`${td} tabular-nums`}>{u.scanCount}</td>
                <td className={`${td} text-muted-foreground`}>{fmt(u.lastLogin)}</td>
                <td className={`${td} text-muted-foreground`}>{fmtDate(u.createdAt)}</td>
                <td className={td}><GrantPlan user={u} /></td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </div>
  );
}

// ── Audit log ─────────────────────────────────────────
function Audit() {
  const [filter, setFilter] = useState('');
  const action = useDebounced(filter.trim());
  const t = useT();
  const { fmt } = useFormat();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'audit', action], queryFn: () => api.adminAudit(action) });
  return (
    <div className="space-y-4">
      <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('Filter by action, e.g. auth. or scan.create')}
        aria-label={t('Filter by action')} className="max-w-sm bg-card" />
      {isLoading ? <Loading /> : (
        <TableCard>
          <thead>
            <tr>{['Time', 'Action', 'User', 'Target', 'IP'].map((h) => <th key={h} className={th}>{t(h)}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {!data?.length ? <Empty cols={5} text={action ? t('No entries start with “{action}”.', { action }) : t('No entries yet.')} /> : data.map((a) => (
              <tr key={a.id} title={a.userAgent ?? undefined}>
                <td className={`${td} text-muted-foreground`}>{fmt(a.createdAt)}</td>
                <td className={`${td} font-mono text-xs`}>{a.action}</td>
                <td className={td}>{a.email ?? <span className="text-muted-foreground">{t('Anonymous')}</span>}</td>
                <td className={`${td} max-w-[18rem] truncate font-mono text-xs`} title={a.target ?? undefined}>{a.target ?? ''}</td>
                <td className={`${td} font-mono text-xs text-muted-foreground`}>{a.ipAddress ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      )}
    </div>
  );
}

// ── Mail ──────────────────────────────────────────────
function Mail() {
  const t = useT();
  const { fmt } = useFormat();
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'mail'], queryFn: () => api.adminMail() });
  if (isLoading) return <Loading />;
  return (
    <TableCard>
      <thead>
        <tr>{['To', 'Subject', 'Kind', 'Status', 'Time'].map((h) => <th key={h} className={th}>{t(h)}</th>)}</tr>
      </thead>
      <tbody className="divide-y">
        {!data?.length ? <Empty cols={5} text={t('No mail sent yet.')} /> : data.map((m) => (
          <tr key={m.id}>
            <td className={td}>{m.to}</td>
            <td className={`${td} max-w-[22rem] truncate`} title={m.subject}>{m.subject}</td>
            <td className={`${td} text-muted-foreground`}>{m.kind}</td>
            <td className={td}>
              {m.sent ? t('Sent') : m.error
                ? <span className="text-destructive" title={m.error}>{t('Failed: {error}', { error: m.error.length > 60 ? `${m.error.slice(0, 60)}…` : m.error })}</span>
                : <span className="text-muted-foreground">{t('Waiting')}</span>}
            </td>
            <td className={`${td} text-muted-foreground`}>{fmt(m.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </TableCard>
  );
}

export function AdminPage() {
  const user = useAuthStore((s) => s.user);
  const t = useT();
  if (!user?.isSuperuser) {
    return (
      <div className="flex flex-col items-center rounded-2xl border bg-card px-4 py-16 text-center">
        <ShieldExclamationIcon className="h-8 w-8 text-muted-foreground" />
        <h2 className="mt-3 font-display text-xl font-semibold">{t('Admins only')}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {t('This page is for OSIG administrators. If you should have access, ask an admin to grant it, then sign in again.')}
        </p>
      </div>
    );
  }
  return (
    <div className="w-full min-w-0">
      <PageHeader title={t('Admin')} description={t('Platform health, accounts, the audit trail and outgoing mail.')} />
      <Tabs defaultValue="overview" className="min-w-0">
        <div className="max-w-full overflow-x-auto">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
            <TabsTrigger value="users">{t('Users')}</TabsTrigger>
            <TabsTrigger value="payments">{t('Payments')}</TabsTrigger>
            <TabsTrigger value="plans">{t('Plans')}</TabsTrigger>
            <TabsTrigger value="audit">{t('Audit log')}</TabsTrigger>
            <TabsTrigger value="mail">{t('Mail')}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="min-w-0"><Overview /></TabsContent>
        <TabsContent value="users" className="min-w-0"><Users /></TabsContent>
        <TabsContent value="payments" className="min-w-0"><AdminPayments /></TabsContent>
        <TabsContent value="plans" className="min-w-0"><AdminPlans /></TabsContent>
        <TabsContent value="audit" className="min-w-0"><Audit /></TabsContent>
        <TabsContent value="mail" className="min-w-0"><Mail /></TabsContent>
      </Tabs>
    </div>
  );
}
