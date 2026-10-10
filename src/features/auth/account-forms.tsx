'use client';

// Account editing: display name / avatar, and password change.

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store';

export function ProfileForm() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const dirty = fullName !== (user?.fullName ?? '') || avatarUrl !== (user?.avatarUrl ?? '');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile({ fullName, avatarUrl });
      setUser(updated);
      toast({ title: 'Details saved' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Your details weren’t saved', description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className="bg-background" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatarUrl">Avatar image URL</Label>
        <Input id="avatarUrl" type="url" placeholder="https://" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="bg-background" />
      </div>
      <Button type="submit" disabled={!dirty || saving}>{saving ? 'Saving…' : 'Save details'}</Button>
    </form>
  );
}

export function PasswordForm() {
  const { setTokens, user, setUser } = useAuthStore();
  // Accounts created through Google have no password until they set one
  const settingFirst = user?.hasPassword === false;
  const { toast } = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) return setError('Use at least 8 characters.');
    if (next !== repeat) return setError('The new passwords don’t match.');
    setSaving(true);
    try {
      const tokens = settingFirst ? await api.setPassword(next) : await api.changePassword(current, next);
      setTokens(tokens);
      if (settingFirst && user) setUser({ ...user, hasPassword: true });
      setCurrent(''); setNext(''); setRepeat('');
      toast(settingFirst
        ? { title: 'Password set', description: 'You can now also sign in with your email and password.' }
        : { title: 'Password changed', description: 'Other devices have been signed out.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The password wasn’t changed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {settingFirst ? (
        <p className="text-sm text-muted-foreground">You sign in with Google. Set a password to also sign in with your email.</p>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input id="currentPassword" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className="bg-background" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input id="newPassword" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="bg-background" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="repeatPassword">Repeat new password</Label>
          <Input id="repeatPassword" type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} className="bg-background" />
        </div>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button type="submit" variant="outline" disabled={(!settingFirst && !current) || !next || saving}>
        {saving ? 'Saving…' : settingFirst ? 'Set password' : 'Change password'}
      </Button>
    </form>
  );
}
