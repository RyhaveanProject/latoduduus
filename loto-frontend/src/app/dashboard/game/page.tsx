'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { getLocaleMeta } from '@/lib/locale-config';
import { formatMoney } from '@/lib/utils';
import { RoomsAPI, GamesAPI } from '@/lib/api';
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { Room, RoomMessage, Game, GameTicket } from '@/types';
import { useToast } from '@/components/Toast';
import { IconUsers, IconChat, IconEye, IconCrown, IconCoin } from '@/components/icons';
import { cn } from '@/lib/utils';

const COLUMN_RANGES = [
  [1, 9], [10, 19], [20, 29], [30, 39], [40, 49], [50, 59], [60, 69], [70, 79], [80, 90],
];

export default function GameRoomPage() {
  return (
    <React.Suspense fallback={<div className="grid h-64 place-items-center text-gold-300">Loading...</div>}>
      <GameRoomContent />
    </React.Suspense>
  );
}

function GameRoomContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('roomId') || '';
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user } = useAuthStore();
  const { push } = useToast();
  const currency = getLocaleMeta(locale).currency;

  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [ticket, setTicket] = useState<GameTicket | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [spectator, setSpectator] = useState(false);
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isInRoom = !!room?.players?.some((p) => p.id === user?.id);

  const loadRoom = useCallback(async () => {
    try {
      const r = (await RoomsAPI.get(id)) as Room;
      setRoom(r);
    } catch {
      push('Room not found', 'error');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, push, router]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId: id });

    socket.on(SOCKET_EVENTS.ROOM_UPDATED, (data: Room) => setRoom(data));
    socket.on(SOCKET_EVENTS.PLAYER_JOINED, () => loadRoom());
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, () => loadRoom());
    socket.on(SOCKET_EVENTS.MESSAGE, (msg: RoomMessage) => setMessages((m) => [...m, msg]));
    socket.on(SOCKET_EVENTS.GAME_STARTED, (g: Game) => setGame(g));
    socket.on(SOCKET_EVENTS.NUMBER_DRAWN, (g: Game) => setGame(g));
    socket.on(SOCKET_EVENTS.GAME_COMPLETED, (g: Game) => {
      setGame(g);
      push('Game completed', 'info');
    });
    socket.on(SOCKET_EVENTS.TICKET_UPDATED, (tk: GameTicket) => setTicket(tk));
    socket.on(SOCKET_EVENTS.ERROR, (err: { message?: string }) => push(err?.message || 'Connection error', 'error'));

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId: id });
      socket.off(SOCKET_EVENTS.ROOM_UPDATED);
      socket.off(SOCKET_EVENTS.PLAYER_JOINED);
      socket.off(SOCKET_EVENTS.PLAYER_LEFT);
      socket.off(SOCKET_EVENTS.MESSAGE);
      socket.off(SOCKET_EVENTS.GAME_STARTED);
      socket.off(SOCKET_EVENTS.NUMBER_DRAWN);
      socket.off(SOCKET_EVENTS.GAME_COMPLETED);
      socket.off(SOCKET_EVENTS.TICKET_UPDATED);
      socket.off(SOCKET_EVENTS.ERROR);
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const join = async () => {
    try {
      await RoomsAPI.join({ roomId: id });
      await loadRoom();
      push('Joined room', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      push(msg || 'Could not join room', 'error');
    }
  };

  const spectate = async () => {
    try {
      await RoomsAPI.spectate(id);
      setSpectator(true);
      push('Spectating', 'info');
    } catch {
      push('Could not spectate', 'error');
    }
  };

  const leave = async () => {
    try {
      await RoomsAPI.leave(id);
      router.push('/dashboard');
    } catch {
      push('Could not leave room', 'error');
    }
  };

  const buyTicket = async () => {
    if (!game) return;
    try {
      const tk = (await GamesAPI.buyTicket(game.id)) as GameTicket;
      setTicket(tk);
      push('Ticket purchased', 'success');
    } catch {
      push('Could not buy ticket', 'error');
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const socket = connectSocket();
    socket.emit(SOCKET_EVENTS.MESSAGE, { roomId: id, message: chatInput.trim() });
    setChatInput('');
  };

  if (loading || !room) {
    return <div className="grid h-64 place-items-center text-gold-300">{t('common.loading')}</div>;
  }

  const drawn = new Set(game?.drawnNumbers ?? []);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <GlassCard className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h1 className="font-display text-xl font-bold text-gold-100">{room.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-xs text-gold-100/50">
              <span className="flex items-center gap-1"><IconUsers className="h-3.5 w-3.5" />{room.players?.length ?? 0}/{room.maxPlayers}</span>
              <span className="flex items-center gap-1"><IconCoin className="h-3.5 w-3.5" />{formatMoney(room.entryFee, currency)}</span>
              <span className={cn('rounded-full px-2 py-0.5 uppercase tracking-wide', room.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gold-500/15 text-gold-300')}>
                {room.status === 'active' ? t('game.live') : room.status === 'finished' ? t('game.finished') : t('game.waiting')}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {!isInRoom && !spectator && (
              <>
                <Button size="sm" onClick={join}>{t('game.joinRoom')}</Button>
                <Button size="sm" variant="secondary" icon={<IconEye className="h-4 w-4" />} onClick={spectate}>{t('game.spectate')}</Button>
              </>
            )}
            {isInRoom && <Button size="sm" variant="danger" onClick={leave}>{t('game.leaveRoom')}</Button>}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-gold-200/70">
            <IconCrown className="h-4 w-4" /> {t('game.drawnNumbers')}
          </h2>
          <div className="grid grid-cols-9 gap-2">
            {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-lg border text-xs font-semibold transition-all',
                  drawn.has(n) ? 'border-gold-400 bg-gradient-to-b from-gold-300 to-gold-600 text-bg shadow-gold animate-pop' : 'border-white/5 bg-white/[0.02] text-gold-100/30'
                )}
              >
                {n}
              </div>
            ))}
          </div>
          {game?.currentNumber && (
            <div className="mt-5 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-gold-200 to-gold-600 font-display text-2xl font-bold text-bg shadow-gold animate-pulse-glow">
                {game.currentNumber}
              </span>
            </div>
          )}
        </GlassCard>

        {isInRoom && (
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-gold-200/70">{t('game.yourCard')}</h2>
              {!ticket && game && <Button size="sm" onClick={buyTicket}>{t('game.yourCard')}</Button>}
            </div>
            {ticket ? (
              <div className="grid grid-cols-9 gap-1.5 rounded-xl bg-white/[0.02] p-3">
                {ticket.numbers.flat().map((n, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md text-[11px] font-medium',
                      n === 0 ? 'bg-transparent' : ticket.markedNumbers?.includes(n) ? 'bg-gold-500 text-bg' : 'bg-white/5 text-gold-100/80'
                    )}
                  >
                    {n !== 0 ? n : ''}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gold-100/40">No ticket yet — buy one once the game starts.</p>
            )}
          </GlassCard>
        )}
      </div>

      <div className="space-y-5">
        <GlassCard className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-gold-200/70">
            <IconUsers className="h-4 w-4" /> {t('game.players')}
          </h2>
          <div className="space-y-2.5">
            {room.players?.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Avatar name={p.firstName} email={p.email} src={p.avatar} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-gold-100/85">{p.firstName || p.email}</p>
                </div>
                {p.gamesWon > 0 && <span className="flex items-center gap-1 text-[10px] text-gold-400"><IconCrown className="h-3 w-3" />{p.gamesWon}</span>}
              </div>
            ))}
            {(!room.players || room.players.length === 0) && <p className="text-sm text-gold-100/40">{t('game.waiting')}</p>}
          </div>
        </GlassCard>

        <GlassCard className="flex h-[420px] flex-col p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-gold-200/70">
            <IconChat className="h-4 w-4" /> {t('game.chat')}
          </h2>
          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
            {messages.map((m, i) => (
              <div key={i} className="text-sm">
                <span className="text-gold-300/80">{m.username}: </span>
                <span className="text-gold-100/70">{m.message}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={sendMessage} className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('game.sendMessage')}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gold-50 outline-none placeholder:text-gold-100/30 focus:border-gold-500/60"
            />
            <Button size="sm" type="submit">{t('common.submit')}</Button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
