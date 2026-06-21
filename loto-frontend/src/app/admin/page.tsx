'use client';
import React, { useEffect, useState } from 'react';
import { GlassCard } from '@/components/GlassCard';
import { AdminAPI } from '@/lib/api';
import { AdminStats } from '@/types';
import { IconUsers, IconDeposit, IconWithdraw, IconTicket } from '@/components/icons';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    AdminAPI.stats()
      .then((res) => setStats(res as AdminStats))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total users', value: stats?.totalUsers ?? '—', icon: IconUsers },
    { label: 'Active games', value: stats?.activeGames ?? '—', icon: IconTicket },
    { label: 'Pending deposits', value: stats?.pendingDeposits ?? '—', icon: IconDeposit },
    { label: 'Pending withdraws', value: stats?.pendingWithdraws ?? '—', icon: IconWithdraw },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-bold text-gold-100">Admin overview</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <GlassCard key={c.label} className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ruby-500/10 text-ruby-400">
              <c.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gold-100/50">{c.label}</p>
              <p className="font-display text-xl font-bold text-gold-100">{c.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>
      <GlassCard className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
        <Stat label="Total deposits processed" value={stats?.totalDeposits} />
        <Stat label="Total withdraws processed" value={stats?.totalWithdraws} />
      </GlassCard>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <p className="text-xs text-gold-100/50">{label}</p>
      <p className="font-display text-lg font-bold text-gold-200">{value ?? '—'}</p>
    </div>
  );
}
