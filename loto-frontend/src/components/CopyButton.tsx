'use client';
import React, { useState } from 'react';
import { IconCopy, IconCheck } from './icons';
import { useI18n } from '@/lib/i18n';

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const { t } = useI18n();
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button
      onClick={onCopy}
      title={copied ? t('common.copied') : t('common.copy')}
      className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gold-200 hover:bg-white/10 transition-colors"
    >
      {copied ? <IconCheck className="h-3.5 w-3.5 text-emerald-400" /> : <IconCopy className="h-3.5 w-3.5" />}
      {copied ? t('common.copied') : t('common.copy')}
    </button>
  );
}
