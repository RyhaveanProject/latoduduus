'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/AuthLayout';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { AuthAPI } from '@/lib/api';
import { IconMail, IconCheck } from '@/components/icons';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await AuthAPI.forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      subtitleSlot={
        <div className="mb-7 text-center">
          <h1 className="font-display text-2xl font-bold text-gold-100">{t('auth.forgotTitle')}</h1>
          <p className="mt-1.5 text-sm text-gold-100/50">{t('auth.forgotSubtitle')}</p>
        </div>
      }
    >
      <GlassCard className="w-full p-7">
        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <IconCheck className="h-6 w-6" />
            </span>
            <p className="text-sm text-gold-100/70">Check your inbox at <strong className="text-gold-200">{email}</strong> for a reset link.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label={t('auth.email')} type="email" required icon={<IconMail className="h-4 w-4" />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            {error && <p className="text-xs text-ruby-400">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.sendLink')}</Button>
          </form>
        )}
        <p className="mt-6 text-center text-sm text-gold-100/50">
          <Link href="/login" className="text-gold-300 hover:text-gold-200">{t('auth.backToLogin')}</Link>
        </p>
      </GlassCard>
    </AuthLayout>
  );
}
