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
  bannedReason?: string;
  totalDeposited?: number;
  totalWithdrawn?: number;
  gamesWon?: number;
  gamesPlayed?: number;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RoomPlayer {
  id: string;
  email: string;
  firstName?: string;
  avatar?: string;
  balance: number;
  gamesWon: number;
  isReady?: boolean;
  isBot?: boolean;
}

export interface Room {
  id: string;
  name: string;
  visibility: 'public' | 'private';
  roomCode?: string;
  entryFee: number;
  maxPlayers: number;
  status: 'waiting' | 'countdown' | 'active' | 'finished';
  players: RoomPlayer[];
  spectators?: number;
  prizePool?: number;
  totalPrizePool?: number;
  currentGameId?: string;
  countdownStartedAt?: string;
  countdownEndsAt?: string;
  lastWinnerName?: string;
  createdAt?: string;
}

export interface RoomMessage {
  userId: string;
  username: string;
  message: string;
  createdAt?: string;
  timestamp?: string;
}

export interface GameCardRow {
  row: number;
  cells: number[];
  numbers: number[];
}

export interface GameTicket {
  id: string;
  gameId: string;
  userId: string;
  roomId: string;
  card: GameCardRow[];
  markedNumbers: number[];
  boardIndex: number;
  isBot?: boolean;
  displayName?: string;
  totalWinnings?: number;
}

export interface Game {
  id: string;
  roomId: string;
  status: 'pending' | 'ongoing' | 'completed' | 'active';
  drawNumbers: number[];
  drawnNumbers: number[];
  currentDrawIndex: number;
  currentNumber?: number | null;
  winnerId?: string;
  winnerType?: 'real' | 'bot' | null;
  winnerName?: string;
  commissionRate?: number;
  commissionAmount?: number;
  payoutAmount?: number;
  startedAt?: string;
  completedAt?: string;
  totalPool?: number;
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
  totalActiveGames: number;
  totalRevenue: number;
  pendingDeposits: number;
  pendingWithdraws: number;
  bannedUsers: number;
  totalRooms?: number;
  activeRooms?: number;
}

export interface AdminUserListResponse {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminListItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  permissions: string[];
  isSuperAdmin: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt?: string;
}

export interface AdminListResponse {
  admins: AdminListItem[];
  total: number;
  page: number;
  pageSize: number;
}
