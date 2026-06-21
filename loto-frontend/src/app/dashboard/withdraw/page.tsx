'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { getLocaleMeta } from '@/lib/locale-config';
import { WithdrawAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/components/Toast';
import { formatMoney } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface WithdrawTx {
  id: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  method: 'bank' | 'crypto';
  createdAt: string;
}

export default function WithdrawPage() {
  const { t, locale } = useI18n();
  const { user, setUser } = useAuthStore();
  const { push } = useToast();
  const meta = getLocaleMeta(locale);
  const isCryptoOnly = meta.paymentMode === 'crypto';
  const [mode, setMode] = useState<'bank' | 'crypto'>(isCryptoOnly ? 'crypto' : 'bank');

  const [owner, setOwner] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [wallet, setWallet] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<WithdrawTx[]>([]);

  useEffect(() => {
    WithdrawAPI.myWithdraws()
      .then((res) => setHistory((res as WithdrawTx[]) ?? []))
      .catch(() => {});
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if ((user?.balance ?? 0) < amt) {
      push('Insufficient balance', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        method: mode,
        amount: amt,
        currency: mode === 'bank' ? meta.currency : 'USD',
      };
      if (mode === 'bank') {
        payload.cardOwner = owner;
        payload.cardNumber = cardNumber;
        payload.cvv = cvv;
      } else {
        payload.walletAddress = wallet;
        payload.network = 'TRC20';
      }
      await WithdrawAPI.create(payload);
      push('Withdrawal requested', 'success');
      if (user) setUser({ ...user, balance: user.balance - amt });
      setAmount('');
      setCardNumber('');
      setCvv('');
      setWallet('');
      const res = await WithdrawAPI.myWithdraws();
      setHistory((res as WithdrawTx[]) ?? []);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      push(msg || 'Could not request withdrawal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      <GlassCard className="p-6">
        <h1 className="mb-5 font-display text-xl font-bold text-gold-100">{t('withdraw.title')}</h1>

        {!isCryptoOnly && (
          <div className="mb-5 flex gap-2">
            <button type="button" onClick={() => setMode('bank')} className={cn('flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium', mode === 'bank' ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/50')}>
              {t('withdraw.card')}
            </button>
            <button type="button" onClick={() => setMode('crypto')} className={cn('flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium', mode === 'crypto' ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/50')}>
              {t('withdraw.crypto')}
            </button>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === 'bank' ? (
            <>
              <Input label={t('withdraw.owner')} required value={owner} onChange={(e) => setOwner(e.target.value)} />
              <Input label={t('withdraw.cardNumber')} required value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="0000 0000 0000 0000" />
              <Input label={t('withdraw.cvv')} required maxLength={4} value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="•••" />
            </>
          ) : (
            <Input label={t('withdraw.wallet')} required value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="T..." />
          )}
          <Input label={`${t('withdraw.amount')} (${mode === 'bank' ? meta.currency : 'USD'})`} type="number" required min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <p className="text-xs text-gold-100/40">{t('common.balance')}: {formatMoney(user?.balance ?? 0, meta.currency)}</p>
          <Button type="submit" className="w-full" size="lg" loading={submitting}>{t('withdraw.submitWithdraw')}</Button>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 font-display text-base font-semibold text-gold-100">{t('withdraw.historyTitle')}</h2>
        <div className="space-y-3">
          {history.length === 0 && <p className="text-sm text-gold-100/40">—</p>}
          {history.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] px-3.5 py-2.5 text-sm">
              <span className="text-gold-100/70">{formatMoney(tx.amount, tx.method === 'bank' ? meta.currency : 'USD')}</span>
              <span className="text-gold-100/40">{new Date(tx.createdAt).toLocaleDateString()}</span>
              <StatusPill status={tx.status} t={t} />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function StatusPill({ status, t }: { status: string; t: (k: string) => string }) {
  const map: Record<string, string> = {
    pending: 'bg-gold-500/15 text-gold-300',
    accepted: 'bg-emerald-500/15 text-emerald-400',
    rejected: 'bg-ruby-500/15 text-ruby-400',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? map.pending}`}>{t(`common.${status}`)}</span>;
}
