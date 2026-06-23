import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'loto_access_token';
const REFRESH_KEY = 'loto_refresh_token';

export const tokenStore = {
  get: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  getRefresh: () => (typeof window === 'undefined' ? null : localStorage.getItem(REFRESH_KEY)),
  set: (access: string, refresh: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const requestUrl = original?.url ?? '';
    const isAuthRoute = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register') || requestUrl.includes('/auth/logout') || requestUrl.includes('/auth/refresh-token');
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      const refreshToken = tokenStore.getRefresh();
      if (!refreshToken) {
        tokenStore.clear();
        return Promise.reject(error);
      }
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${API_URL}/auth/refresh-token`, { refreshToken })
            .then((r) => {
              const data = r.data?.data ?? r.data;
              tokenStore.set(data.accessToken, data.refreshToken);
              return data.accessToken as string;
            })
            .catch(() => {
              tokenStore.clear();
              return null;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const newToken = await refreshing;
        if (newToken) {
          original.headers = original.headers ?? {};
          (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        tokenStore.clear();
      }
    }
    return Promise.reject(error);
  }
);

function unwrap<T>(p: Promise<{ data: unknown }>): Promise<T> {
  return p.then((r) => {
    const body = r.data as { data?: T };
    return (body && typeof body === 'object' && 'data' in body ? body.data : (r.data as T)) as T;
  });
}

export const AuthAPI = {
  register: (payload: { email: string; password: string; firstName?: string; lastName?: string; language?: string }) =>
    unwrap(api.post('/auth/register', payload)),
  login: (payload: { email: string; password: string }) => unwrap(api.post('/auth/login', payload)),
  google: (payload: { idToken: string; accessToken?: string }) => unwrap(api.post('/auth/google', payload)),
  forgotPassword: (email: string) => unwrap(api.post('/auth/forgot-password', { email })),
  resetPassword: (payload: { token: string; newPassword: string }) => unwrap(api.post('/auth/reset-password', payload)),
  verifyEmail: (token: string) => unwrap(api.get(`/auth/verify-email`, { params: { token } })),
  me: () => unwrap(api.get('/auth/me')),
  logout: () => unwrap(api.post('/auth/logout')),
};

export const UsersAPI = {
  profile: () => unwrap(api.get('/users/profile')),
  updateProfile: (payload: Record<string, unknown>) => unwrap(api.put('/users/profile', payload)),
  stats: () => unwrap(api.get('/users/stats')),
  transactions: () => unwrap(api.get('/users/transactions')),
  list: (params?: Record<string, unknown>) => unwrap(api.get('/users/list', { params })),
};

export const RoomsAPI = {
  create: (payload: Record<string, unknown>) => unwrap(api.post('/rooms/create', payload)),
  join: (payload: { roomId: string; roomCode?: string }) => unwrap(api.post('/rooms/join', payload)),
  leave: (roomId: string) => unwrap(api.post(`/rooms/${roomId}/leave`)),
  spectate: (roomId: string) => unwrap(api.post(`/rooms/${roomId}/spectate`)),
  message: (roomId: string, message: string) => unwrap(api.post(`/rooms/${roomId}/message`, { roomId, message })),
  get: (roomId: string) => unwrap(api.get(`/rooms/${roomId}`)),
  update: (roomId: string, payload: Record<string, unknown>) => unwrap(api.put(`/rooms/${roomId}`, payload)),
  listAll: () => unwrap(api.get('/rooms/list/all')),
  listPublic: () => unwrap(api.get('/rooms/list/public')),
  prizePool: (roomId: string) => unwrap(api.get(`/rooms/${roomId}/prize-pool`)),
};

export const GamesAPI = {
  create: (payload: Record<string, unknown>) => unwrap(api.post('/games/create', payload)),
  buyTicket: (gameId: string) => unwrap(api.post(`/games/${gameId}/ticket`)),
  draw: (gameId: string) => unwrap(api.post(`/games/${gameId}/draw`)),
  get: (gameId: string) => unwrap(api.get(`/games/${gameId}`)),
  tickets: (gameId: string) => unwrap(api.get(`/games/${gameId}/tickets`)),
  myTicket: (gameId: string) => unwrap(api.get(`/games/${gameId}/my-ticket`)),
  myTickets: (gameId: string) => unwrap(api.get(`/games/${gameId}/my-tickets`)),
  complete: (gameId: string) => unwrap(api.post(`/games/${gameId}/complete`)),
  activeList: () => unwrap(api.get('/games/active/list')),
  historyList: () => unwrap(api.get('/games/history/list')),
};

export const DepositsAPI = {
  create: (payload: FormData | Record<string, unknown>) =>
    unwrap(
      api.post('/deposits/create', payload, {
        headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      })
    ),
  myDeposits: () => unwrap(api.get('/deposits/my-deposits')),
  list: (params?: Record<string, unknown>) => unwrap(api.get('/deposits/list', { params })),
  pending: () => unwrap(api.get('/deposits/pending')),
};

export const WithdrawAPI = {
  create: (payload: Record<string, unknown>) => unwrap(api.post('/withdraws/create', payload)),
  myWithdraws: () => unwrap(api.get('/withdraws/my-withdraws')),
  list: (params?: Record<string, unknown>) => unwrap(api.get('/withdraws/list', { params })),
  pending: () => unwrap(api.get('/withdraws/pending')),
};

export const AdminAPI = {
  createAdmin: (payload: Record<string, unknown>) => unwrap(api.post('/admin/create-admin', payload)),
  updateAdmin: (adminId: string, payload: Record<string, unknown>) => unwrap(api.put(`/admin/admin/${adminId}`, payload)),
  banUser: (userId: string, reason?: string) => unwrap(api.post('/admin/ban-user', { userId, reason })),
  unbanUser: (userId: string) => unwrap(api.post(`/admin/unban-user/${userId}`)),
  setBalance: (payload: { userId: string; amount: number; operation?: 'set' | 'increase' | 'decrease'; reason?: string }) =>
    unwrap(api.post('/admin/set-balance', payload)),
  stats: () => unwrap(api.get('/admin/stats')),
  adminsList: (params?: Record<string, unknown>) => unwrap(api.get('/admin/admins/list', { params })),
  usersList: (params?: Record<string, unknown>) => unwrap(api.get('/admin/users/list', { params })),
  depositsHistory: (params?: Record<string, unknown>) => unwrap(api.get('/admin/deposits/history', { params })),
  approveDeposit: (depositId: string) => unwrap(api.post('/admin/deposits/approve', { depositId })),
  rejectDeposit: (depositId: string, reason: string) => unwrap(api.post('/admin/deposits/reject', { depositId, reason })),
  withdrawsHistory: (params?: Record<string, unknown>) => unwrap(api.get('/admin/withdraws/history', { params })),
  approveWithdraw: (withdrawId: string) => unwrap(api.post('/admin/withdraws/approve', { withdrawId })),
  rejectWithdraw: (withdrawId: string, reason: string) => unwrap(api.post('/admin/withdraws/reject', { withdrawId, reason })),
  telegramLogs: (params?: Record<string, unknown>) => unwrap(api.get('/admin/telegram/logs', { params })),
};
