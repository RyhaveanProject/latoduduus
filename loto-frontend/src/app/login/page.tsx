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
import { IconMail, IconLock } from '@/components/icons';

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { login } = useAuthStore();
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      push('Welcome back', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitleSlot={
        <div className="mb-7 text-center">
          <h1 className="font-display text-2xl font-bold text-gold-100">{t('auth.loginTitle')}</h1>
          <p className="mt-1.5 text-sm text-gold-100/50">{t('auth.loginSubtitle')}</p>
        </div>
      }
    >
      <GlassCard className="w-full p-7">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label={t('auth.email')} type="email" required icon={<IconMail className="h-4 w-4" />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input label={t('auth.password')} type="password" required icon={<IconLock className="h-4 w-4" />} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          {error && <p className="text-xs text-ruby-400">{error}</p>}
          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-xs text-gold-300/70 hover:text-gold-200">{t('auth.forgotPassword')}</Link>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.login')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gold-100/50">
          {t('auth.noAccount')} <Link href="/register" className="text-gold-300 hover:text-gold-200">{t('auth.signUp')}</Link>
        </p>
      </GlassCard>
    </AuthLayout>
  );
}
