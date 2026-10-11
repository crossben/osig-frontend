// ============================================
// Register Page Component
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useRegister } from '@/hooks/use-api';
import { useAuthStore } from '@/store';
import { AuthShell } from './auth-shell';
import { GoogleSignIn } from './google-button';
import { useT } from '@/lib/i18n';

export function RegisterPage() {
  const { isAuthenticated } = useAuthStore();
  const registerMutation = useRegister();
  const t = useT();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      window.location.hash = '#/';
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return null;
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = t('Enter your email.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('That doesn\'t look like an email address.');
    }

    if (!formData.username) {
      newErrors.username = t('Choose a username.');
    } else if (formData.username.length < 3) {
      newErrors.username = t('Usernames need at least 3 characters.');
    }

    if (!formData.password) {
      newErrors.password = t('Choose a password.');
    } else if (formData.password.length < 8) {
      newErrors.password = t('Use at least 8 characters.');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('The passwords don\'t match.');
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = t('Confirm this to create your account.');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    registerMutation.mutate({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      fullName: formData.fullName || undefined,
    });
  };

  const field = (id: keyof typeof formData, label: string, props: React.ComponentProps<typeof Input>) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={formData[id] as string}
        onChange={(e) => handleChange(id, e.target.value)}
        aria-invalid={!!errors[id]}
        aria-describedby={errors[id] ? `${id}-error` : undefined}
        className="h-11 bg-card"
        {...props}
      />
      {errors[id] && <p id={`${id}-error`} className="text-sm text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <AuthShell
      title={t('Create your account')}
      subtitle={t('Five free scans a day. No card needed.')}
      footer={
        <>
          {t('Already have an account?')}{' '}
          <a href="#/login" className="font-medium text-trace hover:underline">{t('Sign in')}</a>
        </>
      }
    >
      <GoogleSignIn />
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {field('email', t('Email'), { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('username', t('Username'), { autoComplete: 'username' })}
          {field('fullName', t('Full name (optional)'), { autoComplete: 'name' })}
        </div>
        {field('password', t('Password'), { type: 'password', autoComplete: 'new-password' })}
        {field('confirmPassword', t('Repeat password'), { type: 'password', autoComplete: 'new-password' })}
        <div className="flex items-start gap-3 pt-1">
          <Checkbox
            id="agreeTerms"
            checked={formData.agreeTerms}
            onCheckedChange={(checked) => handleChange('agreeTerms', checked as boolean)}
            className="mt-0.5"
            aria-invalid={!!errors.agreeTerms}
          />
          <div>
            <Label htmlFor="agreeTerms" className="cursor-pointer text-sm font-normal leading-snug">
              {t('I’ll only use OSIG for legitimate purposes, on public information.')}
              {' '}{t('I accept the')}{' '}
              <a href="#/terms" target="_blank" rel="noopener" className="underline underline-offset-2">{t('Terms of Use')}</a>{' '}
              {t('and the')}{' '}
              <a href="#/privacy" target="_blank" rel="noopener" className="underline underline-offset-2">{t('Privacy Policy')}</a>.
            </Label>
            {errors.agreeTerms && <p className="mt-1 text-sm text-destructive">{errors.agreeTerms}</p>}
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? t('Creating account…') : t('Create account')}
        </Button>
      </form>
    </AuthShell>
  );
}
