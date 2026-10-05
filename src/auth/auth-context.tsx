import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setAuthToken, setUnauthorizedHandler } from '@/api/client';
import { api } from '@/api/endpoints';
import type { RegisterRequest } from '@/api/types';
import { loadToken, saveToken } from './token-store';

interface AuthState {
  /** False until the stored token has been read; avoids flashing the login screen. */
  ready: boolean;
  signedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const applyToken = useCallback(async (value: string | null) => {
    setAuthToken(value);
    setToken(value);
    await saveToken(value);
  }, []);

  const logout = useCallback(async () => {
    await applyToken(null);
    queryClient.clear();
  }, [applyToken, queryClient]);

  useEffect(() => {
    loadToken().then((stored) => {
      setAuthToken(stored);
      setToken(stored);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => void logout());
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      signedIn: !!token,
      login: async (email, password) => {
        queryClient.clear();
        await applyToken((await api.login(email, password)).token);
      },
      register: async (body) => {
        queryClient.clear();
        await applyToken((await api.register(body)).token);
      },
      logout,
    }),
    [ready, token, applyToken, logout, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
