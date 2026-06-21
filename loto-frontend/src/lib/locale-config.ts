import { LocaleCode } from '@/types';

export interface LocaleMeta {
  code: LocaleCode;
  label: string;
  flag: string; // ISO country code for flag sprite/emoji-free icon key
  dir: 'ltr' | 'rtl';
  paymentMode: 'bank' | 'crypto';
  currency: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', label: 'English', flag: 'us', dir: 'ltr', paymentMode: 'crypto', currency: 'USD' },
  { code: 'az', label: 'Azərbaycan', flag: 'az', dir: 'ltr', paymentMode: 'bank', currency: 'AZN' },
  { code: 'ru', label: 'Русский', flag: 'ru', dir: 'ltr', paymentMode: 'bank', currency: 'RUB' },
  { code: 'tr', label: 'Türkçe', flag: 'tr', dir: 'ltr', paymentMode: 'bank', currency: 'TRY' },
  { code: 'ge', label: 'ქართული', flag: 'ge', dir: 'ltr', paymentMode: 'bank', currency: 'GEL' },
  { code: 'ar', label: 'العربية', flag: 'sa', dir: 'rtl', paymentMode: 'crypto', currency: 'USD' },
  { code: 'cn', label: '中文', flag: 'cn', dir: 'ltr', paymentMode: 'crypto', currency: 'USD' },
];

export const DEFAULT_LOCALE: LocaleCode = 'en';

export function getLocaleMeta(code: LocaleCode): LocaleMeta {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
