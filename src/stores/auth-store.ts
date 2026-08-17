import { create } from "zustand";

import { authApi } from "@/api/auth";
import type { AuthUser } from "@/types";
import {
  clearAuthSession,
  readAuthSession,
  type AuthSession,
  writeAuthSession,
} from "@/lib/auth-storage";

interface AuthState {
  isHydrated: boolean;
  session: AuthSession | null;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  hydrate: () => void;
  setSession: (session: AuthSession) => void;
  signOut: () => Promise<void>;
  /** alias for signOut — home/page.tsx uses logout */
  logout: () => void;
  syncFromStorage: () => void;
  clearError: () => void;
  login: (userName: string, password: string, context?: {
    tenantId?: string;
    organizationUnitId?: string;
    applicationScopeId?: string;
  }) => Promise<void>;
}

async function loadCurrentUser(set: (state: Partial<AuthState>) => void): Promise<void> {
  try {
    const current = await authApi.me();
    set({ user: {
      userId: current.userId ?? null,
      userName: current.userName ?? null,
      email: current.email ?? null,
      roles: current.roles ?? [],
      tenantId: current.tenantId ?? null,
    } });
  } catch {
    set({ user: null });
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isHydrated: false,
  session: null,
  user: null,
  isLoading: false,
  error: null,

  hydrate: () => {
    const session = readAuthSession();
    set({ isHydrated: true, session });
    if (session) void loadCurrentUser(set);
  },

  setSession: (session) => {
    writeAuthSession(session);
    set({ isHydrated: true, session });
  },

  signOut: async () => {
    const refreshToken = readAuthSession()?.refreshToken;
    try { if (refreshToken) await authApi.logout(refreshToken); } catch { /* local session must still close */ }
    clearAuthSession();
    set({ isHydrated: true, session: null, user: null });
  },

  logout: () => {
    clearAuthSession();
    set({ isHydrated: true, session: null, user: null });
  },

  syncFromStorage: () => {
    const session = readAuthSession();
    set({ isHydrated: true, session });
    if (session) void loadCurrentUser(set);
  },

  clearError: () => set({ error: null }),

  login: async (userName, password, context) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({
        userName,
        password,
        tenantId: context?.tenantId || null,
        organizationUnitId: context?.organizationUnitId || null,
        applicationScopeId: context?.applicationScopeId || null,
      });
      const newSession: AuthSession = {
        accessToken: response.accessToken ?? "",
        refreshToken: response.refreshToken,
        tenantId: response.tenantId ?? null,
        userId: response.userId,
        expiresAt: Date.now() + response.expiresIn * 1_000,
      };
      writeAuthSession(newSession);
      set({ session: newSession, isLoading: false });
      await loadCurrentUser(set);
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : "Login failed", isLoading: false });
      throw err;
    }
  },
}));
