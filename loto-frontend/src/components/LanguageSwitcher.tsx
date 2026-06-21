'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { LOCALES } from '@/lib/locale-config';
import { FlagIcon } from './FlagIcon';
import { IconChevronDown } from './icons';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale)!;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gold-100 hover:bg-white/[0.08] transition-colors',
          compact && 'px-2 py-1.5'
        )}
      >
        <FlagIcon code={current.flag} className="h-3.5 w-5" />
        {!compact && <span>{current.label}</span>}
        <IconChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-bg-card/95 shadow-glass backdrop-blur-xl animate-fade-up">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-white/[0.06] transition-colors',
                l.code === locale ? 'text-gold-300' : 'text-gold-100/80'
              )}
            >
              <FlagIcon code={l.flag} className="h-3.5 w-5" />
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
