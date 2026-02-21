import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { clearTokens, loadTokensFromStorage } from '../api/authStorage';

export interface User {
  id?: number;
  fullName: string;
  email: string;
  poste: string;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

function authUserToUser(a: authApi.AuthUser): User {
  return {
    id: a.id,
    fullName: a.fullName ?? '',
    email: a.email ?? '',
    poste: a.poste ?? '',
    avatarUrl: a.avatarUrl ?? null,
  };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const tokens = loadTokensFromStorage();
      if (!tokens) {
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        let u: authApi.AuthUser;
        try {
          u = await authApi.getMe(tokens.access);
        } catch (e) {
          if (e instanceof Error && e.message === 'UNAUTHORIZED') {
            await authApi.refresh();
            u = await authApi.getMe();
          } else {
            throw e;
          }
        }
        if (!cancelled) setUser(authUserToUser(u));
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setUser(authUserToUser(data.user));
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    const payload: authApi.UpdateMePayload = {};
    if (updates.fullName !== undefined) payload.fullName = updates.fullName;
    if (updates.poste !== undefined) payload.poste = updates.poste;
    if (updates.email !== undefined) payload.email = updates.email;
    const u = await authApi.updateMe(payload);
    setUser(authUserToUser(u));
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authApi.getMe();
    setUser(authUserToUser(u));
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
