'use client';
import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CopyButton } from '@/components/CopyButton';
import { useI18n } from '@/lib/i18n';
import { getLocaleMeta } from '@/lib/locale-config';
import { BANKS, CRYPTO } from '@/lib/payment-config';
import { DepositsAPI } from '@/lib/api';
import { useToast } from '@/components/Toast';
import { maskCard, formatMoney } from '@/lib/utils';
import { IconUpload, IconQr } from '@/components/icons';
import { cn } from '@/lib/utils';

interface DepositTx {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  paymentMethod?: string;
  method?: string;
  createdAt: string;
}

// API paginated cavabından array çıxarır: { deposits: [...] } | DepositTx[]
function extractDeposits(res: unknown): DepositTx[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as DepositTx[];
  const r = res as Record<string, unknown>;
  if (Array.isArray(r.deposits)) return r.deposits as DepositTx[];
  if (Array.isArray(r.data)) return r.data as DepositTx[];
  return [];
}

function getMethod(tx: DepositTx): string {
  return tx.method ?? tx.paymentMethod ?? 'bank';
}

export default function DepositPage() {
  const { t, locale } = useI18n();
  const { push } = useToast();
  const meta = getLocaleMeta(locale);
  const isCryptoOnly = meta.paymentMode === 'crypto';
  const [mode, setMode] = useState<'bank' | 'crypto'>(isCryptoOnly ? 'crypto' : 'bank');
  const banks = BANKS[meta.currency] ?? [];
  const [bankId, setBankId] = useState(banks[0]?.id ?? '');
  const [cryptoId, setCryptoId] = useState(CRYPTO[0].id);
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<DepositTx[]>([]);

  const loadHistory = () => {
    DepositsAPI.myDeposits()
      .then((res) => setHistory(extractDeposits(res)))
      .catch(() => setHistory([]));
  };

  useEffect(() => { loadHistory(); }, []);

  const selectedBank = banks.find((b) => b.id === bankId);
  const selectedCrypto = CRYPTO.find((c) => c.id === cryptoId)!;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('method', mode);
      fd.append('paymentMethod', mode);
      fd.append('amount', amount);
      fd.append('currency', meta.currency);
      if (mode === 'bank') {
        fd.append('bankId', bankId);
        if (file) fd.append('proof', file);
      } else {
        fd.append('walletNetwork', selectedCrypto.network);
      }
      await DepositsAPI.create(fd);
      push(t('deposit.submitDeposit') + ' ✓', 'success');
      setAmount('');
      setFile(null);
      loadHistory();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      push(typeof msg === 'string' ? msg : 'Could not submit deposit', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <GlassCard className="p-6">
        <h1 className="mb-5 font-display text-xl font-bold text-gold-100">{t('deposit.title')}</h1>

        {!isCryptoOnly && (
          <div className="mb-5 flex gap-2">
            <ModeTab active={mode === 'bank'} onClick={() => setMode('bank')} label={t('deposit.card')} />
            <ModeTab active={mode === 'crypto'} onClick={() => setMode('crypto')} label={t('deposit.crypto')} />
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {mode === 'bank' ? (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {banks.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => setBankId(b.id)}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-colors',
                      bankId === b.id ? 'border-gold-500/60 bg-gold-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'
                    )}
                  >
                    <p className="text-sm font-semibold text-gold-100">{b.bankName}</p>
                    <p className="mt-1 text-xs text-gold-100/50">{t('deposit.cardOwner')}: {b.cardOwner}</p>
                  </button>
                ))}
              </div>

              {selectedBank && (
                <GlassCard className="space-y-2 bg-white/[0.03] p-4">
                  <Row label={t('deposit.cardOwner')} value={selectedBank.cardOwner} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gold-200/50">{t('deposit.cardNumber')}</p>
                      <p className="font-mono text-sm text-gold-100">{maskCard(selectedBank.cardNumber)}</p>
                    </div>
                    <CopyButton value={selectedBank.cardNumber.replace(/\s/g, '')} />
                  </div>
                </GlassCard>
              )}

              <Input
                label={`${t('deposit.amount')} (${meta.currency})`}
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <div>
                <span className="mb-1.5 block text-xs font-medium text-gold-200/80">{t('deposit.uploadScreenshot')}</span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gold-500/30 bg-white/[0.02] px-4 py-6 text-sm text-gold-200/60 hover:bg-white/[0.04]"
                >
                  <IconUpload className="h-4 w-4" />
                  {file ? file.name : t('deposit.uploadScreenshot')}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                {CRYPTO.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setCryptoId(c.id)}
                    className={cn(
                      'rounded-xl border px-4 py-2 text-sm transition-colors',
                      cryptoId === c.id ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/50'
                    )}
                  >
                    {c.asset} ({c.network})
                  </button>
                ))}
              </div>

              <GlassCard className="flex flex-col items-center gap-4 bg-white/[0.03] p-6 text-center">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={selectedCrypto.address} size={140} />
                </div>
                <div className="w-full">
                  <p className="flex items-center justify-center gap-1.5 text-xs text-gold-200/50">
                    <IconQr className="h-3.5 w-3.5" />{t('deposit.walletAddress')}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-gold-100">{selectedCrypto.address}</p>
                </div>
                <CopyButton value={selectedCrypto.address} />
              </GlassCard>

              <Input
                label={`${t('deposit.amount')} (USD)`}
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </>
          )}

          <Button type="submit" className="w-full" size="lg" loading={submitting}>
            {t('deposit.submitDeposit')}
          </Button>
        </form>
      </GlassCard>

      {/* Deposit tarixi */}
      <GlassCard className="p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-gold-100">{t('deposit.historyTitle')}</h2>
        <div className="space-y-3">
          {history.length === 0 && <p className="text-sm text-gold-100/40">—</p>}
          {history.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3.5 py-2.5 text-sm">
              <span className="text-gold-100/70">
                {formatMoney(tx.amount, getMethod(tx) === 'bank' ? meta.currency : 'USD')}
              </span>
              <span className="text-gold-100/40">{new Date(tx.createdAt).toLocaleDateString()}</span>
              <StatusPill status={tx.status} t={t} />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ModeTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors',
        active ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/50 hover:bg-white/5'
      )}
    >
      {label}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gold-200/50">{label}</span>
      <span className="text-gold-100">{value}</span>
    </div>
  );
}

function StatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, string> = {
    pending: 'bg-gold-500/15 text-gold-300',
    accepted: 'bg-emerald-500/15 text-emerald-400',
    approved: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-ruby-500/15 text-ruby-400',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? map.pending}`}>
      {t(`common.${status}`) || status}
    </span>
  );
}
