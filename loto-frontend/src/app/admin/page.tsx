'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { AdminAPI } from '@/lib/api';
import { AdminStats } from '@/types';
import {
  IconUsers,
  IconDeposit,
  IconWithdraw,
  IconTicket,
  IconBan,
  IconCoin,
  IconShield,
  IconArrowRight,
} from '@/components/icons';
import { formatMoney } from '@/lib/utils';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    AdminAPI.stats()
      .then((res) => setStats(res as AdminStats))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total users', value: stats?.totalUsers ?? '—', icon: IconUsers },
    { label: 'Active games', value: stats?.totalActiveGames ?? '—', icon: IconTicket },
    { label: 'Pending deposits', value: stats?.pendingDeposits ?? '—', icon: IconDeposit },
    { label: 'Pending withdraws', value: stats?.pendingWithdraws ?? '—', icon: IconWithdraw },
    { label: 'Blocked users', value: stats?.bannedUsers ?? '—', icon: IconBan },
    { label: 'Net revenue', value: typeof stats?.totalRevenue === 'number' ? formatMoney(stats.totalRevenue, 'USD') : '—', icon: IconCoin },
  ];

  const quickActions = [
    { href: '/admin/users', label: 'Manage users', description: 'Balance, ban and profile controls', icon: IconUsers },
    { href: '/admin/deposits', label: 'Review deposits', description: 'Approve or reject pending top-ups', icon: IconDeposit },
    { href: '/admin/withdraws', label: 'Review withdraws', description: 'Approve or reject payout requests', icon: IconWithdraw },
    { href: '/admin/admins', label: 'Manage admins', description: 'Create or disable admin accounts', icon: IconShield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-gold-100">Admin overview</h1>
          <p className="text-sm text-gold-100/50">Oyun, ödəniş və istifadəçi idarəetməsi üçün qısa idarə paneli.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gold-100/55">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Rooms: {stats?.totalRooms ?? '—'}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">Active rooms: {stats?.activeRooms ?? '—'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GlassCard className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <Stat label="Total deposits processed" value={stats?.totalDeposits} />
          <Stat label="Total withdraws processed" value={stats?.totalWithdraws} />
          <Stat label="Blocked users" value={stats?.bannedUsers} />
          <Stat label="Active games now" value={stats?.totalActiveGames} />
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-4">
            <h2 className="font-display text-lg font-semibold text-gold-100">Quick actions</h2>
            <p className="mt-1 text-sm text-gold-100/45">Mobil və masaüstü görünüşdə əsas idarə əmrlərinə birbaşa keçid.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-ruby-500/25 hover:bg-ruby-500/10"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ruby-500/10 text-ruby-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <IconArrowRight className="h-4 w-4 text-gold-100/30 transition group-hover:text-ruby-300" />
                  </div>
                  <p className="mt-4 font-display text-base text-gold-100">{action.label}</p>
                  <p className="mt-1 text-sm text-gold-100/45">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </GlassCard>
      </div>
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
