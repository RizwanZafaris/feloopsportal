'use client';

import { create } from 'zustand';
import { useEffect } from 'react';
import type { AdminUser } from '@/types/admin';
import { getCurrentUser } from '@/lib/api';
import { getSession, clearSession } from '@/lib/auth';

interface AuthState {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AdminUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    clearSession();
    set({ user: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const session = getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then((u) => {
        setUser(u);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [setUser, setLoading]);

  return { user, isLoading, isAuthenticated, logout };
}
