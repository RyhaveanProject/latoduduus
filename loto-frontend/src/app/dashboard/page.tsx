'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { getLocaleMeta } from '@/lib/locale-config';
import { formatMoney } from '@/lib/utils';
import { GamesAPI, RoomsAPI } from '@/lib/api';
import { Room, Game } from '@/types';
import { IconCoin, IconUsers, IconTicket, IconCrown, IconPlus, IconArrowRight, IconHistory } from '@/components/icons';
import { CreateRoomModal } from '@/components/CreateRoomModal';

export default function HomePage() {
  const { t, locale } = useI18n();
  const { user } = useAuthStore();
  const currency = getLocaleMeta(locale).currency;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [active, hist] = await Promise.all([
          RoomsAPI.listPublic().catch(() => []),
          GamesAPI.historyList().catch(() => []),
        ]);
        setRooms((active as Room[]) ?? []);
        setHistory(((hist as Game[]) ?? []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = [
    { label: t('home.gamesWon'), value: user?.gamesWon ?? 0, icon: IconCrown },
    { label: t('home.gamesPlayed'), value: user?.gamesPlayed ?? 0, icon: IconTicket },
  ];

  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />
        <p className="text-sm text-gold-100/50">{t('home.welcome')}</p>
        <h1 className="font-display mt-1 text-2xl font-bold text-gold-100 sm:text-3xl">{user?.firstName || user?.email}</h1>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gold-200/50">{t('home.yourBalance')}</p>
            <p className="font-display mt-1 text-3xl font-bold text-gradient-gold sm:text-4xl">{formatMoney(user?.balance ?? 0, currency)}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/deposit"><Button size="md">{t('nav.deposit')}</Button></Link>
            <Link href="/dashboard/withdraw"><Button size="md" variant="secondary">{t('nav.withdraw')}</Button></Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        {stats.map((s) => (
          <GlassCard key={s.label} className="flex items-center gap-4 p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
              <s.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-gold-100/50">{s.label}</p>
              <p className="font-display text-xl font-bold text-gold-100">{s.value}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-gold-100">{t('home.activeGames')}</h2>
        <Button size="sm" icon={<IconPlus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>{t('home.createRoom')}</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />)}
        </div>
      ) : rooms.length === 0 ? (
        <GlassCard className="p-8 text-center text-gold-100/50">{t('home.noActiveGames')}</GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <Link key={r.id} href={`/dashboard/game?roomId=${r.id}`}>
              <GlassCard className="group p-5 transition-transform hover:-translate-y-0.5 hover:shadow-gold">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-gold-100">{r.name}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wide ${r.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gold-500/15 text-gold-300'}`}>
                    {r.status === 'active' ? t('game.live') : t('game.waiting')}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gold-100/55">
                  <span className="flex items-center gap-1.5"><IconUsers className="h-4 w-4" />{r.players?.length ?? 0}/{r.maxPlayers}</span>
                  <span className="flex items-center gap-1.5"><IconCoin className="h-4 w-4" />{formatMoney(r.entryFee, currency)}</span>
                </div>
                <div className="mt-4 flex items-center justify-end text-xs text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">
                  {t('game.joinRoom')} <IconArrowRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-gold-100">{t('home.recentGames')}</h2>
        <Link href="/dashboard/history" className="text-xs text-gold-300/70 hover:text-gold-200">{t('common.viewAll')}</Link>
      </div>
      <GlassCard className="divide-y divide-white/5">
        {history.length === 0 ? (
          <div className="flex items-center gap-3 p-6 text-sm text-gold-100/40">
            <IconHistory className="h-4 w-4" /> {t('home.noActiveGames')}
          </div>
        ) : (
          history.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
              <span className="text-gold-100/70">#{g.id.slice(-6)}</span>
              <span className="text-gold-100/40">{g.completedAt ? new Date(g.completedAt).toLocaleDateString() : '—'}</span>
              <span className={g.status === 'completed' ? 'text-emerald-400' : 'text-gold-300'}>{g.status}</span>
            </div>
          ))
        )}
      </GlassCard>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
