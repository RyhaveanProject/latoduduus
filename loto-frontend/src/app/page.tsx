'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { GlassCard } from '@/components/GlassCard';
import { useI18n } from '@/lib/i18n';
import { IconCrown, IconShield, IconTicket, IconArrowRight } from '@/components/icons';

export default function LandingPage() {
  const { hydrate, hydrated, user } = useAuthStore();
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return (
    <div className="min-h-screen bg-felt bg-radial-fade text-gold-50">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Logo />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <Button size="sm" onClick={() => router.push('/dashboard')}>{t('nav.home')}</Button>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost" size="sm">{t('auth.signIn')}</Button></Link>
              <Link href="/register"><Button size="sm">{t('auth.signUp')}</Button></Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto flex max-w-7xl flex-col items-center px-5 py-16 text-center sm:py-24">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs uppercase tracking-widest text-gold-300">
          <IconCrown className="h-3.5 w-3.5" /> Premium Live Lotto
        </span>
        <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-gradient-gold sm:text-6xl">
          Real players. Real numbers. Real time.
        </h1>
        <p className="mt-5 max-w-xl text-gold-100/60">
          Join live lotto rooms, watch numbers drawn in real time, and cash out instantly — across cards or crypto, in your language.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/register"><Button size="lg" icon={<IconArrowRight className="h-4 w-4" />}>{t('auth.signUp')}</Button></Link>
          <Link href="/login"><Button size="lg" variant="secondary">{t('auth.signIn')}</Button></Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-5 pb-24 sm:grid-cols-3">
        {[
          { icon: IconTicket, title: 'Live Rooms', desc: 'Create or join public and private rooms with real-time drawn numbers.' },
          { icon: IconShield, title: 'Secure Payouts', desc: 'Card and crypto deposits/withdrawals with full transaction history.' },
          { icon: IconCrown, title: '7 Languages', desc: 'Play in AZ, EN, RU, TR, GE, AR or CN — with local payment methods.' },
        ].map((f) => (
          <GlassCard key={f.title} className="p-6 animate-fade-up">
            <f.icon className="h-7 w-7 text-gold-400" />
            <h3 className="mt-4 font-display text-lg text-gold-100">{f.title}</h3>
            <p className="mt-2 text-sm text-gold-100/55">{f.desc}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
