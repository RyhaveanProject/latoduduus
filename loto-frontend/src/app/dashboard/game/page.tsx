'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GlassCard } from '@/components/GlassCard';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { useI18n } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth-store';
import { getLocaleMeta } from '@/lib/locale-config';
import { formatMoney } from '@/lib/utils';
import { RoomsAPI, GamesAPI } from '@/lib/api';
import { connectSocket, disconnectSocket, SOCKET_EVENTS } from '@/lib/socket';
import { Room, Game, GameTicket } from '@/types';
import { useToast } from '@/components/Toast';
import { IconCoin, IconUsers } from '@/components/icons';

export default function GameRoomPage() {
  return (
    <React.Suspense fallback={<div className="grid h-64 place-items-center text-gold-300">Loading...</div>}>
      <GameRoomContent />
    </React.Suspense>
  );
}

function GameRoomContent() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get('roomId') || '';
  const router = useRouter();
  const { t, locale } = useI18n();
  const { user } = useAuthStore();
  const { push } = useToast();
  const currency = getLocaleMeta(locale).currency;

  const [room, setRoom] = useState<Room | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [tickets, setTickets] = useState<GameTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const isJoined = !!room?.players?.some((player) => player.id === user?.id && !player.isBot);
  const visiblePlayers = room?.players ?? [];
  const lastDraws = useMemo(() => (game?.drawnNumbers ?? []).slice(-3).reverse(), [game?.drawnNumbers]);

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = (await RoomsAPI.get(roomId)) as Room;
      setRoom(response);
      if (response.currentGameId) {
        const currentGame = (await GamesAPI.get(response.currentGameId)) as Game;
        setGame(currentGame);
        if (user?.id) {
          const myTickets = (await GamesAPI.myTickets(response.currentGameId)) as GameTicket[];
          setTickets(myTickets);
        }
      }
    } catch {
      push('Otaq tapılmadı', 'error');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [roomId, push, router, user?.id]);

  const loadMyTickets = useCallback(async (gameId: string) => {
    if (!user?.id) return;
    try {
      const myTickets = (await GamesAPI.myTickets(gameId)) as GameTicket[];
      setTickets(myTickets);
    } catch {
      // ignore silent refresh errors
    }
  }, [user?.id]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    if (!user?.id || !roomId) return;
    const socket = connectSocket(user.id);

    const onRoomUpdated = (nextRoom: Room) => setRoom(nextRoom);
    const onGameStarted = (nextGame: Game) => {
      setGame(nextGame);
      loadMyTickets(nextGame.id);
    };
    const onNumberDrawn = (nextGame: Game) => setGame(nextGame);
    const onTicketUpdated = (nextTickets: GameTicket[]) => setTickets(nextTickets);
    const onCompleted = (nextGame: Game) => {
      setGame(nextGame);
      loadMyTickets(nextGame.id);
      push(nextGame.winnerType === 'real' ? 'Oyunda qalib var' : 'Bot qalib gəldi', 'info');
    };
    const onError = (err: { message?: string }) => push(err?.message || 'Socket xətası', 'error');

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
    socket.on(SOCKET_EVENTS.ROOM_UPDATED, onRoomUpdated);
    socket.on(SOCKET_EVENTS.GAME_STARTED, onGameStarted);
    socket.on(SOCKET_EVENTS.NUMBER_DRAWN, onNumberDrawn);
    socket.on(SOCKET_EVENTS.TICKET_UPDATED, onTicketUpdated);
    socket.on(SOCKET_EVENTS.GAME_COMPLETED, onCompleted);
    socket.on(SOCKET_EVENTS.ERROR, onError);

    return () => {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { roomId });
      socket.off(SOCKET_EVENTS.ROOM_UPDATED, onRoomUpdated);
      socket.off(SOCKET_EVENTS.GAME_STARTED, onGameStarted);
      socket.off(SOCKET_EVENTS.NUMBER_DRAWN, onNumberDrawn);
      socket.off(SOCKET_EVENTS.TICKET_UPDATED, onTicketUpdated);
      socket.off(SOCKET_EVENTS.GAME_COMPLETED, onCompleted);
      socket.off(SOCKET_EVENTS.ERROR, onError);
      disconnectSocket();
    };
  }, [loadMyTickets, push, roomId, user?.id]);

  const joinRoom = async () => {
    try {
      const joinedRoom = (await RoomsAPI.join({ roomId })) as Room;
      setRoom(joinedRoom);
      connectSocket(user?.id).emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
      push('Otağa qoşuldunuz, oyun başlayır', 'success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      push(msg || 'Otağa qoşulmaq olmadı', 'error');
    }
  };

  const leaveRoom = async () => {
    try {
      await RoomsAPI.leave(roomId);
      router.push('/dashboard');
    } catch {
      push('Otaqdan çıxmaq olmadı', 'error');
    }
  };

  const markNumber = async (ticketId: string, number: number) => {
    if (!game || marking === `${ticketId}-${number}` || !game.drawnNumbers.includes(number)) return;
    setMarking(`${ticketId}-${number}`);
    try {
      connectSocket(user?.id).emit(SOCKET_EVENTS.MARK_NUMBER, { gameId: game.id, ticketId, number });
    } finally {
      setTimeout(() => setMarking(null), 300);
    }
  };

  if (loading || !room) {
    return <div className="grid h-64 place-items-center text-gold-300">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-5">
      <GlassCard className="wood-panel overflow-hidden p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="wood-button h-11 w-11 text-xl"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setSoundOn((s) => !s)}
              className="wood-button h-11 w-11 text-lg"
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-2">
            <div className="lotto-bowl">
              {game?.currentNumber ? <span className="lotto-ball animate-pop-in">{game.currentNumber}</span> : null}
            </div>
          </div>

          <div className="min-w-[140px] rounded-[28px] border border-black/10 bg-black/10 px-3 py-2">
            <div className="mb-1 text-right text-[10px] uppercase tracking-[0.2em] text-gold-900/70">Son daşlar</div>
            <div className="flex justify-end gap-2">
              {lastDraws.length === 0 ? <span className="text-sm text-gold-900/50">—</span> : null}
              {lastDraws.map((value) => (
                <span key={value} className="history-chip">{value}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gold-950/80">
          <div>
            <h1 className="font-display text-xl font-bold text-gold-950">{room.name}</h1>
            <div className="mt-1 flex items-center gap-4 text-xs text-gold-950/60">
              <span className="flex items-center gap-1"><IconUsers className="h-3.5 w-3.5" /> {room.players.length}/{room.maxPlayers}</span>
              <span className="flex items-center gap-1"><IconCoin className="h-3.5 w-3.5" /> {formatMoney(room.entryFee, currency)}</span>
              <span>Komissiya: {Math.round((game?.commissionRate ?? 0.08) * 100)}%</span>
            </div>
          </div>

          <div className="flex gap-2">
            {!isJoined ? (
              <Button size="sm" onClick={joinRoom}>Qoşul və başlat</Button>
            ) : (
              <Button size="sm" variant="danger" onClick={leaveRoom}>Çıx</Button>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            {visiblePlayers.map((player) => (
              <div key={player.id} className="wood-player-card min-w-[92px]">
                <Avatar name={player.firstName} email={player.email} src={player.avatar} size={46} />
                <div className="mt-2 truncate text-center text-xs font-semibold text-gold-950">
                  {player.firstName || player.email}
                </div>
                {player.isBot ? <div className="mt-1 text-center text-[10px] uppercase tracking-wide text-gold-950/60">bot</div> : null}
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-4">
          {isJoined && tickets.length > 0 ? tickets.map((ticket, idx) => (
            <GlassCard key={ticket.id} className="wood-panel p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between text-sm text-gold-950/70">
                <span className="font-display text-lg font-semibold text-gold-950">Kart {idx + 1}</span>
                <span>{ticket.markedNumbers.length}/15 qeyd olunub</span>
              </div>
              <div className="grid grid-cols-9 gap-[2px] rounded-[18px] bg-white/40 p-2 sm:gap-1 sm:p-3">
                {ticket.card.flatMap((row, rowIndex) =>
                  row.cells.map((cell, cellIndex) => {
                    const isEmpty = cell === 0;
                    const isMarked = ticket.markedNumbers.includes(cell);
                    const isDrawable = !isEmpty && !!game?.drawnNumbers.includes(cell);
                    return (
                      <button
                        key={`${rowIndex}-${cellIndex}-${cell}`}
                        type="button"
                        disabled={isEmpty || !isDrawable}
                        onClick={() => !isEmpty && markNumber(ticket.id, cell)}
                        className={[
                          'ticket-cell',
                          isEmpty ? 'ticket-cell-empty' : '',
                          isMarked ? 'ticket-cell-marked' : '',
                          !isMarked && isDrawable ? 'ticket-cell-active' : '',
                        ].join(' ')}
                      >
                        {cell === 0 ? '' : cell}
                      </button>
                    );
                  })
                )}
              </div>
            </GlassCard>
          )) : (
            <GlassCard className="wood-panel p-8 text-center text-gold-950/65">
              {isJoined ? 'Kartlar hazırlanır...' : 'Oyuna daxil olduqda 3 loto kartı avtomatik veriləcək.'}
            </GlassCard>
          )}
        </div>

        <div className="space-y-4">
          <GlassCard className="wood-panel p-5">
            <h2 className="font-display text-lg font-semibold text-gold-950">Oyun qaydası</h2>
            <div className="mt-3 space-y-2 text-sm text-gold-950/75">
              <p>Daşlar avtomatik açılır.</p>
              <p>Öz kartınızdakı uyğun rəqəmlərə toxunaraq qeyd edin.</p>
              <p>Bütün daşları ilk tamamlayan qalib olur.</p>
            </div>
          </GlassCard>

          <GlassCard className="wood-panel p-5">
            <h2 className="font-display text-lg font-semibold text-gold-950">Mərc məlumatı</h2>
            <div className="mt-3 space-y-2 text-sm text-gold-950/75">
              <p>Giriş məbləği: {formatMoney(room.entryFee, currency)}</p>
              <p>Ümumi fond: {formatMoney(game?.totalPool ?? room.entryFee * room.players.length, currency)}</p>
              <p>Net uduş: {formatMoney(game?.payoutAmount ?? 0, currency)}</p>
            </div>
          </GlassCard>

          <GlassCard className="wood-panel p-5">
            <h2 className="font-display text-lg font-semibold text-gold-950">Status</h2>
            <div className="mt-3 text-sm text-gold-950/75">
              {game?.status === 'completed' ? (
                <div className="space-y-2">
                  <p>Oyun tamamlandı.</p>
                  <p>Qalib tipi: {game.winnerType === 'real' ? 'Real user' : game.winnerType === 'bot' ? 'Bot' : '—'}</p>
                  <p>Komissiya: {formatMoney(game.commissionAmount ?? 0, currency)}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>{game ? 'Oyun davam edir.' : 'Real istifadəçi qoşulduqda oyun başlayacaq.'}</p>
                  <p>Son daş: {game?.currentNumber ?? '—'}</p>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
