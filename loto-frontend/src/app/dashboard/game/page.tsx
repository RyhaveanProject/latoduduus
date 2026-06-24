'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
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

function playDrawTone() {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const context = new AudioCtx();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(540, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(240, context.currentTime + 0.24);
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.3);
  oscillator.onended = () => {
    void context.close();
  };
}

function getRemainingSeconds(countdownEndsAt?: string) {
  if (!countdownEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(countdownEndsAt).getTime() - Date.now()) / 1000));
}

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
  const [winnerVisible, setWinnerVisible] = useState(false);
  const [countdownLeft, setCountdownLeft] = useState(0);
  const previousNumberRef = useRef<number | null>(null);
  const confettiPlayedForRef = useRef<string | null>(null);
  const currentGameIdRef = useRef<string | null>(null);
  const ticketsCountRef = useRef(0);

  const isJoined = !!room?.players?.some((player) => player.id === user?.id && !player.isBot);
  const visiblePlayers = room?.players ?? [];
  const currentNumber = game?.currentNumber ?? null;
  const smallHistory = useMemo(() => (game?.drawnNumbers ?? []).slice(-4, -1).reverse(), [game?.drawnNumbers]);
  const allHistory = useMemo(() => (game?.drawnNumbers ?? []).slice().reverse(), [game?.drawnNumbers]);
  const drawnSet = useMemo(() => new Set(game?.drawnNumbers ?? []), [game?.drawnNumbers]);
  const winnerName = game?.winnerName || room?.lastWinnerName || 'Qalib';

  const triggerConfetti = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const confetti = (await import('canvas-confetti')).default;
    const originY = 0.7;
    confetti({ particleCount: 120, spread: 72, startVelocity: 36, origin: { x: 0.5, y: originY } });
    setTimeout(() => {
      confetti({ particleCount: 90, spread: 96, startVelocity: 28, origin: { x: 0.2, y: originY } });
      confetti({ particleCount: 90, spread: 96, startVelocity: 28, origin: { x: 0.8, y: originY } });
    }, 180);
  }, []);

  const loadMyTickets = useCallback(async (gameId: string) => {
    if (!user?.id) return;
    try {
      const myTickets = (await GamesAPI.myTickets(gameId)) as GameTicket[];
      setTickets(myTickets);
    } catch {
      // silent refresh
    }
  }, [user?.id]);

  const syncGameState = useCallback(async (nextRoom: Room | null, forceTickets: boolean = false) => {
    if (!nextRoom?.currentGameId) {
      currentGameIdRef.current = null;
      if (forceTickets) {
        setTickets([]);
      }
      return;
    }

    try {
      const currentGame = (await GamesAPI.get(nextRoom.currentGameId)) as Game;
      currentGameIdRef.current = currentGame.id;
      setGame(currentGame);
      previousNumberRef.current = currentGame.currentNumber ?? null;
      if (user?.id && (forceTickets || currentGame.status !== 'completed')) {
        await loadMyTickets(currentGame.id);
      }
    } catch {
      // game may still be propagating, retry fallback effect will handle it
    }
  }, [loadMyTickets, user?.id]);

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    try {
      const response = (await RoomsAPI.get(roomId)) as Room;
      setRoom(response);
      setCountdownLeft(getRemainingSeconds(response.countdownEndsAt));
      if (response.currentGameId) {
        await syncGameState(response, true);
      } else {
        currentGameIdRef.current = null;
        setGame(null);
        setTickets([]);
      }
    } catch {
      push('Otaq tapılmadı', 'error');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [roomId, push, router, syncGameState]);

  useEffect(() => {
    loadRoom();
  }, [loadRoom]);

  useEffect(() => {
    ticketsCountRef.current = tickets.length;
  }, [tickets.length]);

  useEffect(() => {
    if (!room?.countdownEndsAt) {
      setCountdownLeft(0);
      return;
    }

    const update = () => setCountdownLeft(getRemainingSeconds(room.countdownEndsAt));
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [room?.countdownEndsAt]);

  useEffect(() => {
    if (!isJoined || !room?.currentGameId || tickets.length > 0) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void syncGameState(room, true);
      if (attempts >= 8) {
        window.clearInterval(timer);
      }
    }, 900);

    return () => window.clearInterval(timer);
  }, [isJoined, room, syncGameState, tickets.length]);

  useEffect(() => {
    if (!game?.id || !room) return;
    const current = game.currentNumber ?? null;
    const previous = previousNumberRef.current;
    if (current && current !== previous) {
      if (soundOn) playDrawTone();
    }
    previousNumberRef.current = current;
  }, [game?.currentNumber, game?.id, room, soundOn]);

  useEffect(() => {
    if (game?.status === 'completed' && game.id !== confettiPlayedForRef.current) {
      confettiPlayedForRef.current = game.id;
      setWinnerVisible(true);
      void triggerConfetti();
      push(`${winnerName} qalib oldu`, 'success');
    }

    if (room?.status === 'countdown' && countdownLeft > 0) {
      setWinnerVisible(false);
    }
  }, [countdownLeft, game?.id, game?.status, push, room?.status, triggerConfetti, winnerName]);

  useEffect(() => {
    if (!user?.id || !roomId) return;
    const socket = connectSocket(user.id);

    const onRoomUpdated = (nextRoom: Room) => {
      setRoom(nextRoom);
      setCountdownLeft(getRemainingSeconds(nextRoom.countdownEndsAt));

      if (nextRoom.currentGameId) {
        const shouldRefreshTickets = currentGameIdRef.current !== nextRoom.currentGameId || ticketsCountRef.current === 0;
        void syncGameState(nextRoom, shouldRefreshTickets);
        return;
      }

      currentGameIdRef.current = null;
      if (nextRoom.status !== 'active') {
        setTickets([]);
      }
    };

    const onGameStarted = (nextGame: Game) => {
      currentGameIdRef.current = nextGame.id;
      previousNumberRef.current = nextGame.currentNumber ?? null;
      setGame(nextGame);
      setWinnerVisible(false);
      confettiPlayedForRef.current = null;
      loadMyTickets(nextGame.id);
    };

    const onNumberDrawn = (nextGame: Game) => {
      setGame(nextGame);
    };

    const onTicketUpdated = (nextTickets: GameTicket[]) => setTickets(nextTickets);

    const onCompleted = (nextGame: Game) => {
      currentGameIdRef.current = nextGame.id;
      setGame(nextGame);
      loadMyTickets(nextGame.id);
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
  }, [loadMyTickets, push, roomId, syncGameState, user?.id]);

  const joinRoom = async () => {
    try {
      const joinedRoom = (await RoomsAPI.join({ roomId })) as Room;
      setRoom(joinedRoom);
      setCountdownLeft(getRemainingSeconds(joinedRoom.countdownEndsAt));
      if (joinedRoom.currentGameId) {
        await syncGameState(joinedRoom, true);
      }
      connectSocket(user?.id).emit(SOCKET_EVENTS.JOIN_ROOM, { roomId });
      push('Otağa qoşuldunuz. 10 saniyəlik geri sayım başlayır.', 'success');
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
    if (!game || game.status === 'completed' || marking === `${ticketId}-${number}`) return;

    if (!drawnSet.has(number)) {
      push('Bu daş hələ çıxmayıb', 'error');
      return;
    }

    setMarking(`${ticketId}-${number}`);
    try {
      connectSocket(user?.id).emit(SOCKET_EVENTS.MARK_NUMBER, { gameId: game.id, ticketId, number });
    } finally {
      window.setTimeout(() => setMarking(null), 280);
    }
  };

  if (loading || !room) {
    return <div className="grid h-64 place-items-center text-gold-300">{t('common.loading')}</div>;
  }

  return (
    <div className="space-y-5">
      <GlassCard className="wood-panel overflow-hidden p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
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

          <div className="relative flex flex-1 flex-col items-center justify-center px-2">
            <div className="lotto-stage-ring">
              <AnimatePresence mode="wait">
                {currentNumber ? (
                  <motion.div
                    key={`ball-${currentNumber}`}
                    initial={{ scale: 0.35, rotate: -140, opacity: 0, y: 26 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
                    exit={{ scale: 0.7, rotate: 20, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="lotto-ball-hero"
                  >
                    <span>{currentNumber}</span>
                  </motion.div>
                ) : (
                  <motion.div key="empty-ball" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lotto-ball-placeholder">
                    {countdownLeft > 0 ? countdownLeft : ''}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {room.status === 'countdown' && countdownLeft > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3 rounded-full border border-gold-900/15 bg-black/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-gold-950/80"
                >
                  Start {countdownLeft}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="w-[140px] rounded-[28px] border border-black/10 bg-black/10 px-3 py-2">
            <div className="mb-1 text-right text-[10px] uppercase tracking-[0.2em] text-gold-900/70">Tarixçə</div>
            <div className="flex justify-end gap-2">
              <AnimatePresence initial={false}>
                {smallHistory.length === 0 ? <span className="text-sm text-gold-900/50">—</span> : null}
                {smallHistory.map((value) => (
                  <motion.span
                    key={value}
                    layout
                    initial={{ opacity: 0, scale: 0.6, x: 12 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="history-chip"
                  >
                    {value}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gold-950/80">
          <div>
            <h1 className="font-display text-xl font-bold text-gold-950">{room.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gold-950/60">
              <span className="flex items-center gap-1"><IconUsers className="h-3.5 w-3.5" /> {room.players.length}/{room.maxPlayers}</span>
              <span className="flex items-center gap-1"><IconCoin className="h-3.5 w-3.5" /> {formatMoney(room.entryFee, currency)}</span>
              <span>Komissiya: {Math.round((game?.commissionRate ?? 0.08) * 100)}%</span>
              <span>Status: {room.currentGameId ? 'Canlı oyun' : room.status === 'countdown' ? 'Geri sayım' : 'Gözləmə'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {!isJoined ? (
              <Button size="sm" onClick={joinRoom}>Qoşul</Button>
            ) : (
              <Button size="sm" variant="danger" onClick={leaveRoom}>Çıx</Button>
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            {visiblePlayers.map((player) => (
              <motion.div key={player.id} layout className="wood-player-card min-w-[92px]">
                <Avatar name={player.firstName} email={player.email} src={player.avatar} size={46} />
                <div className="mt-2 truncate text-center text-xs font-semibold text-gold-950">
                  {player.firstName || player.email}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </GlassCard>

      <AnimatePresence>
        {winnerVisible && game?.status === 'completed' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="winner-overlay"
          >
            <motion.div
              initial={{ scale: 0.8, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              className="winner-card"
            >
              <div className="winner-crown">👑</div>
              <div className="text-xs uppercase tracking-[0.3em] text-gold-900/65">Qalib</div>
              <div className="mt-2 font-display text-3xl font-bold text-gold-950">{winnerName}</div>
              <div className="mt-3 text-sm text-gold-950/70">
                Uduş: {formatMoney(game.payoutAmount ?? 0, currency)}
              </div>
              <div className="mt-5 flex justify-center">
                <Button size="sm" onClick={() => setWinnerVisible(false)}>Bağla</Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
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
                    const isDrawn = !isEmpty && drawnSet.has(cell);
                    const isPending = marking === `${ticket.id}-${cell}`;
                    return (
                      <motion.button
                        layout
                        whileTap={!isEmpty && !isMarked ? { scale: 0.96 } : undefined}
                        key={`${rowIndex}-${cellIndex}-${cell}`}
                        type="button"
                        disabled={isEmpty || isMarked || !isJoined}
                        onClick={() => !isEmpty && markNumber(ticket.id, cell)}
                        className={[
                          'ticket-cell',
                          isEmpty ? 'ticket-cell-empty' : '',
                          isMarked ? 'ticket-cell-marked' : '',
                          !isMarked && isDrawn ? 'ticket-cell-active' : '',
                          !isMarked && !isEmpty && !isDrawn ? 'ticket-cell-idle' : '',
                          isPending ? 'ticket-cell-pending' : '',
                        ].join(' ')}
                      >
                        {cell === 0 ? '' : cell}
                      </motion.button>
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
            <h2 className="font-display text-lg font-semibold text-gold-950">Oyun axını</h2>
            <div className="mt-3 space-y-2 text-sm text-gold-950/75">
              <p>Otağa daxil olan kimi server 10 saniyəlik geri sayımı başlayır.</p>
              <p>Daşlar server tərəfindən qarışdırılır və hamı eyni anda eyni daşı görür.</p>
              <p>Yalnız çıxmış nömrəni özünüz seçə bilərsiniz.</p>
              <p>3 kartdan hər hansını tam dolduran ilk oyunçu qalib olur.</p>
            </div>
          </GlassCard>

          <GlassCard className="wood-panel p-5">
            <h2 className="font-display text-lg font-semibold text-gold-950">Cari vəziyyət</h2>
            <div className="mt-3 space-y-2 text-sm text-gold-950/75">
              <p>Çıxan daş sayı: {game?.drawnNumbers.length ?? 0}/90</p>
              <p>Son daş: {currentNumber ?? '—'}</p>
              <p>Ümumi fond: {formatMoney(game?.totalPool ?? room.totalPrizePool ?? 0, currency)}</p>
              <p>Net uduş: {formatMoney(game?.payoutAmount ?? 0, currency)}</p>
              {room.status === 'countdown' ? <p>Yeni oyun startı: {countdownLeft} san.</p> : null}
            </div>
          </GlassCard>

          <GlassCard className="wood-panel p-5">
            <h2 className="font-display text-lg font-semibold text-gold-950">Bütün tarixçə</h2>
            <div className="mt-3 flex max-h-[280px] flex-wrap gap-2 overflow-y-auto pr-1">
              {allHistory.length === 0 ? (
                <span className="text-sm text-gold-950/55">Hələ daş çıxmayıb.</span>
              ) : (
                allHistory.map((value, index) => (
                  <motion.span
                    layout
                    initial={{ opacity: 0, scale: 0.75 }}
                    animate={{ opacity: 1, scale: index === 0 ? 1.04 : 1 }}
                    key={`${value}-${index}`}
                    className={index === 0 ? 'history-chip history-chip-current' : 'history-chip'}
                  >
                    {value}
                  </motion.span>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
