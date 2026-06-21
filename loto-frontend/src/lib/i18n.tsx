'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LocaleCode } from '@/types';
import { DEFAULT_LOCALE, getLocaleMeta } from './locale-config';

import en from '@/locales/en.json';
import az from '@/locales/az.json';
import ru from '@/locales/ru.json';
import tr from '@/locales/tr.json';
import ge from '@/locales/ge.json';
import ar from '@/locales/ar.json';
import cn from '@/locales/cn.json';

type Dict = typeof en;

const DICTS: Record<LocaleCode, Dict> = { en, az, ru, tr, ge, ar, cn };

interface I18nContextValue {
  locale: LocaleCode;
  setLocale: (l: LocaleCode) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(dict: Dict, key: string): string {
  const parts = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = dict;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else return key;
  }
  return typeof cur === 'string' ? cur : key;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(DEFAULT_LOCALE);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('loto_locale') as LocaleCode | null) : null;
    if (saved && DICTS[saved]) setLocaleState(saved);
  }, []);

  const setLocale = (l: LocaleCode) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') localStorage.setItem('loto_locale', l);
  };

  const dir = getLocaleMeta(locale).dir;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dir = dir;
      document.documentElement.lang = locale;
    }
  }, [dir, locale]);

  const t = useMemo(() => {
    const dict = DICTS[locale] ?? DICTS.en;
    return (key: string) => resolve(dict, key);
  }, [locale]);

  return <I18nContext.Provider value={{ locale, setLocale, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
