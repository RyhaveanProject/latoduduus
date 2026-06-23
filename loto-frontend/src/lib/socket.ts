import { io, Socket } from 'socket.io-client';
import { tokenStore } from './api';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;
let currentUserId: string | null = null;

export function getSocket(userId?: string): Socket {
  if (userId) {
    currentUserId = userId;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      auth: () => ({ token: tokenStore.get(), userId: currentUserId }),
      query: { userId: currentUserId ?? '' },
    });
  }
  return socket;
}

export function connectSocket(userId?: string): Socket {
  const s = getSocket(userId);
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}

export const SOCKET_EVENTS = {
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  ROOM_UPDATED: 'room:updated',
  ROOM_JOINED: 'room:joined',
  ROOM_LEFT: 'room:left',
  MESSAGE: 'room:message',
  GAME_STARTED: 'game:started',
  NUMBER_DRAWN: 'game:number_drawn',
  NUMBER_MARKED: 'game:number_marked',
  GAME_COMPLETED: 'game:completed',
  TICKET_UPDATED: 'game:ticket_updated',
  MARK_NUMBER: 'game:mark_number',
  ERROR: 'error',
} as const;
