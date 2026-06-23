'use client';

import { create } from 'zustand';
import { User } from '@/types';
import { AuthAPI, tokenStore } from './api';
import { disconnectSocket } from './socket';

interface AuthState {
  user: User | null;
  loading: boolean;
  hydrated: boolean;
  setUser: (u: User | null) => void;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { email: string; password: string; firstName?: string; lastName?: string; language?: string }) => Promise<User>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  hydrated: false,
  setUser: (u) => set({ user: u }),
  hydrate: async () => {
    const token = tokenStore.get();
    if (!token) {
      set({ hydrated: true });
      return;
    }
    set({ loading: true });
    try {
      const me = await AuthAPI.me();
      set({ user: me as User, loading: false, hydrated: true });
    } catch {
      tokenStore.clear();
      set({ user: null, loading: false, hydrated: true });
    }
  },
  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = (await AuthAPI.login({ email, password })) as { accessToken: string; refreshToken: string; user: User };
      tokenStore.set(res.accessToken, res.refreshToken);
      set({ user: res.user, loading: false, hydrated: true });
      return res.user;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },
  register: async (payload) => {
    set({ loading: true });
    try {
      const res = (await AuthAPI.register(payload)) as { accessToken: string; refreshToken: string; user: User };
      tokenStore.set(res.accessToken, res.refreshToken);
      set({ user: res.user, loading: false, hydrated: true });
      return res.user;
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },
  logout: async () => {
    try {
      if (tokenStore.get()) {
        await AuthAPI.logout();
      }
    } catch {
      // ignore logout API errors and clear local session anyway
    } finally {
      disconnectSocket();
      tokenStore.clear();
      set({ user: null, hydrated: true, loading: false });
    }
  },
}));
