'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/GlassCard';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { getLocaleMeta } from '@/lib/locale-config';
import { formatMoney } from '@/lib/utils';
import { GamesAPI, RoomsAPI } from '@/lib/api';
import { Room, Game } from '@/types';
import { IconCoin, IconUsers, IconCrown, IconArrowRight, IconHistory } from '@/components/icons';

function toArray<T>(res: unknown, key?: string): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (key && typeof res === 'object' && res !== null && key in (res as object)) {
    const val = (res as Record<string, unknown>)[key];
    return Array.isArray(val) ? (val as T[]) : [];
  }
  return [];
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const { user } = useAuthStore();
  const currency = getLocaleMeta(locale).currency;
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [activeRes, histRes] = await Promise.all([
          RoomsAPI.listPublic().catch(() => null),
          GamesAPI.historyList().catch(() => null),
        ]);
        setRooms(toArray<Room>(activeRes, 'rooms'));
        setHistory(toArray<Game>(histRes, 'games').slice(0, 5));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden p-6 sm:p-8 wood-panel">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />
        <p className="text-sm text-gold-100/60">{t('home.welcome')}</p>
        <h1 className="font-display mt-1 text-2xl font-bold text-gold-100 sm:text-3xl">
          {user?.firstName || user?.email}
        </h1>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gold-200/50">{t('home.yourBalance')}</p>
            <p className="font-display mt-1 text-3xl font-bold text-gradient-gold sm:text-4xl">
              {formatMoney(user?.balance ?? 0, currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gold-100/70">
            6 nəfərlik canlı otaqlar • açıq otağa daxil olan kimi 10 saniyəlik start geri sayımı başlayır
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <GlassCard className="flex items-center gap-4 p-5 wood-panel">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
            <IconCrown className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gold-100/50">{t('home.gamesWon')}</p>
            <p className="font-display text-xl font-bold text-gold-100">{user?.gamesWon ?? 0}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5 wood-panel">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
            <IconUsers className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs text-gold-100/50">{t('home.gamesPlayed')}</p>
            <p className="font-display text-xl font-bold text-gold-100">{user?.gamesPlayed ?? 0}</p>
          </div>
        </GlassCard>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-gold-100">Hazır otaqlar</h2>
        <span className="text-xs text-gold-300/70">Hamı eyni daşı eyni anda görür</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => (
            <Link key={r.id} href={`/dashboard/game?roomId=${r.id}`}>
              <GlassCard className="group wood-panel p-5 transition-transform hover:-translate-y-0.5 hover:shadow-gold">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-gold-100">{r.name}</h3>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                    {r.currentGameId ? 'LIVE' : r.status === 'countdown' ? 'START' : 'HAZIR'}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gold-100/70">
                  <span className="flex items-center gap-1.5">
                    <IconUsers className="h-4 w-4" /> {r.players?.length ?? 0}/{r.maxPlayers}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IconCoin className="h-4 w-4" /> {formatMoney(r.entryFee, currency)}
                  </span>
                  <span>Fond: {formatMoney(r.totalPrizePool ?? 0, currency)}</span>
                  <span>{r.countdownEndsAt ? '10 san. start' : '3 kart verilir'}</span>
                </div>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-gold-100/70">
                  3 kart • 90 daş • manual seçim • qalib bütün kartı ilk tamamlayan olur
                </div>
                <div className="mt-4 flex items-center justify-end text-xs text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">
                  Otağa gir <IconArrowRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-gold-100">{t('home.recentGames')}</h2>
        <span className="text-xs text-gold-300/70">Son tamamlanan oyunlar</span>
      </div>

      <GlassCard className="divide-y divide-white/5 wood-panel">
        {history.length === 0 ? (
          <div className="flex items-center gap-3 p-6 text-sm text-gold-100/40">
            <IconHistory className="h-4 w-4" /> Hələ tamamlanan oyun yoxdur
          </div>
        ) : (
          history.map((g) => (
            <div key={g.id} className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm">
              <span className="text-gold-100/70">#{g.id?.slice(-6) ?? '—'}</span>
              <span className="text-gold-100/50">{g.totalPool ? formatMoney(g.totalPool, currency) : '—'}</span>
              <span className="truncate text-gold-100/60">{g.winnerName || 'Qalib elan edildi'}</span>
              <span className="text-gold-100/40">{g.completedAt ? new Date(g.completedAt).toLocaleDateString() : '—'}</span>
            </div>
          ))
        )}
      </GlassCard>
    </div>
  );
}
