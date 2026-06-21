export type LocaleCode = 'en' | 'az' | 'ru' | 'tr' | 'ge' | 'ar' | 'cn';

export type PaymentMode = 'bank' | 'crypto';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  balance: number;
  role: 'user' | 'admin' | 'superadmin';
  language?: LocaleCode;
  isBanned?: boolean;
  gamesWon?: number;
  gamesPlayed?: number;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Room {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  roomCode?: string;
  entryFee: number;
  maxPlayers: number;
  status: 'waiting' | 'active' | 'finished';
  players: RoomPlayer[];
  spectators?: number;
  prizePool?: number;
  createdAt?: string;
}

export interface RoomPlayer {
  id: string;
  email: string;
  firstName?: string;
  avatar?: string;
  balance: number;
  gamesWon: number;
  isReady?: boolean;
}

export interface RoomMessage {
  userId: string;
  username: string;
  message: string;
  createdAt: string;
}

export interface GameTicket {
  id: string;
  gameId: string;
  userId: string;
  numbers: number[][];
  markedNumbers: number[];
}

export interface Game {
  id: string;
  roomId: string;
  status: 'pending' | 'active' | 'completed';
  drawnNumbers: number[];
  currentNumber?: number;
  winnerId?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdraw';
  method: PaymentMode;
  amount: number;
  currency: string;
  status: 'pending' | 'accepted' | 'rejected';
  proofUrl?: string;
  walletAddress?: string;
  cardNumber?: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalDeposits: number;
  totalWithdraws: number;
  activeGames: number;
  pendingDeposits: number;
  pendingWithdraws: number;
}
