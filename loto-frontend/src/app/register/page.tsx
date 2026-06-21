'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/AuthLayout';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/Toast';
import { IconMail, IconLock, IconUser } from '@/components/icons';

export default function RegisterPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { register } = useAuthStore();
  const { push } = useToast();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName, language: locale === 'ge' || locale === 'cn' ? 'en' : locale });
      push('Account created', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitleSlot={
        <div className="mb-7 text-center">
          <h1 className="font-display text-2xl font-bold text-gold-100">{t('auth.registerTitle')}</h1>
          <p className="mt-1.5 text-sm text-gold-100/50">{t('auth.registerSubtitle')}</p>
        </div>
      }
    >
      <GlassCard className="w-full p-7">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('auth.firstName')} icon={<IconUser className="h-4 w-4" />} value={form.firstName} onChange={update('firstName')} />
            <Input label={t('auth.lastName')} value={form.lastName} onChange={update('lastName')} />
          </div>
          <Input label={t('auth.email')} type="email" required icon={<IconMail className="h-4 w-4" />} value={form.email} onChange={update('email')} placeholder="you@example.com" />
          <Input label={t('auth.password')} type="password" required icon={<IconLock className="h-4 w-4" />} value={form.password} onChange={update('password')} minLength={8} />
          <Input label={t('auth.confirmPassword')} type="password" required icon={<IconLock className="h-4 w-4" />} value={form.confirm} onChange={update('confirm')} minLength={8} />
          {error && <p className="text-xs text-ruby-400">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.register')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gold-100/50">
          {t('auth.haveAccount')} <Link href="/login" className="text-gold-300 hover:text-gold-200">{t('auth.signIn')}</Link>
        </p>
      </GlassCard>
    </AuthLayout>
  );
}
