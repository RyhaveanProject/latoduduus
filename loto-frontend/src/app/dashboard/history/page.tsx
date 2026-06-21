'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { useI18n } from '@/lib/i18n';
import { getLocaleMeta } from '@/lib/locale-config';
import { DepositsAPI, WithdrawAPI, GamesAPI } from '@/lib/api';
import { formatMoney, cn } from '@/lib/utils';
import { IconDeposit, IconWithdraw, IconTicket } from '@/components/icons';

type Tab = 'deposits' | 'withdraws' | 'games';

export default function HistoryPage() {
  const { t, locale } = useI18n();
  const meta = getLocaleMeta(locale);
  const [tab, setTab] = useState<Tab>('deposits');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetcher = tab === 'deposits' ? DepositsAPI.myDeposits : tab === 'withdraws' ? WithdrawAPI.myWithdraws : GamesAPI.historyList;
    fetcher()
      .then((res) => setRows((res as any[]) ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const tabs: { key: Tab; label: string; icon: typeof IconDeposit }[] = [
    { key: 'deposits', label: t('nav.deposit'), icon: IconDeposit },
    { key: 'withdraws', label: t('nav.withdraw'), icon: IconWithdraw },
    { key: 'games', label: t('home.recentGames'), icon: IconTicket },
  ];

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-bold text-gold-100">{t('nav.history')}</h1>
      <div className="flex gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={cn(
              'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-colors',
              tab === tb.key ? 'border-gold-500/60 bg-gold-500/10 text-gold-200' : 'border-white/10 text-gold-100/50 hover:bg-white/5'
            )}
          >
            <tb.icon className="h-4 w-4" />
            {tb.label}
          </button>
        ))}
      </div>

      <GlassCard className="divide-y divide-white/5">
        {loading ? (
          <div className="p-6 text-sm text-gold-100/40">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-gold-100/40">—</div>
        ) : tab === 'games' ? (
          rows.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-gold-100/70">#{g.id?.slice(-6)}</span>
              <span className="text-gold-100/40">{g.completedAt ? new Date(g.completedAt).toLocaleString() : '—'}</span>
              <span className={g.status === 'completed' ? 'text-emerald-400' : 'text-gold-300'}>{g.status}</span>
            </div>
          ))
        ) : (
          rows.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-gold-100">{formatMoney(tx.amount, tx.method === 'bank' ? meta.currency : 'USD')}</span>
              <span className="text-gold-100/40">{new Date(tx.createdAt).toLocaleString()}</span>
              <span className="text-gold-100/50 uppercase text-xs">{tx.method}</span>
              <StatusPill status={tx.status} t={t} />
            </div>
          ))
        )}
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
