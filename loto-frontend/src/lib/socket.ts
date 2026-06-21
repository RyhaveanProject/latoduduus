import { io, Socket } from 'socket.io-client';
import { tokenStore } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: () => ({ token: tokenStore.get() }),
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

// Canonical event names exposed by the game.gateway.ts backend.
export const SOCKET_EVENTS = {
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_UPDATED: 'room:updated',
  PLAYER_JOINED: 'room:player_joined',
  PLAYER_LEFT: 'room:player_left',
  MESSAGE: 'room:message',
  GAME_STARTED: 'game:started',
  NUMBER_DRAWN: 'game:number_drawn',
  GAME_COMPLETED: 'game:completed',
  TICKET_UPDATED: 'game:ticket_updated',
  ERROR: 'error',
} as const;
