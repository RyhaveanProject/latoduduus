'use client';
import React from 'react';
import { GlassCard } from '@/components/GlassCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n';
import { LOCALES } from '@/lib/locale-config';
import { FlagIcon } from '@/components/FlagIcon';
import { IconBell, IconShield, IconCheck } from '@/components/icons';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-xl font-bold text-gold-100">{t('settings.title')}</h1>

      <GlassCard className="p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-gold-100">{t('settings.language')}</h2>
        <div className="mb-4">
          <LanguageSwitcher />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLocale(l.code)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                l.code === locale ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/60 hover:bg-white/5'
              )}
            >
              <FlagIcon code={l.flag} className="h-3.5 w-5" />
              {l.label}
              {l.code === locale && <IconCheck className="ml-auto h-3.5 w-3.5 text-gold-400" />}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-gold-100">
          <IconBell className="h-4 w-4" /> {t('settings.notifications')}
        </h2>
        <Toggle label="Email notifications" defaultChecked />
        <Toggle label="In-app sound effects" defaultChecked />
        <Toggle label="Game start alerts" defaultChecked />
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-gold-100">
          <IconShield className="h-4 w-4" /> {t('settings.security')}
        </h2>
        <Toggle label="Two-factor authentication" />
        <Toggle label="Login alerts" defaultChecked />
      </GlassCard>
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = React.useState(!!defaultChecked);
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-gold-100/70">{label}</span>
      <button
        onClick={() => setOn((v) => !v)}
        className={cn('relative h-6 w-11 rounded-full transition-colors', on ? 'bg-gold-500' : 'bg-white/10')}
      >
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-bg-soft shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}
