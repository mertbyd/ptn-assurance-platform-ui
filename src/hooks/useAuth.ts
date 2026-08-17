"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { canWrite, isAdmin, isHost, isHostAdmin, isReadOnly } from "@/lib/roles";

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

// Backend (KBP-49): yalnizca butonlari gizlemek icin. Asil yetki backend'de.
export function useCanWrite() {
  return useAuthStore((state) => canWrite(state.user));
}

export function useIsReadOnly() {
  return useAuthStore((state) => isReadOnly(state.user));
}

export function useIsAdmin() {
  return useAuthStore((state) => isAdmin(state.user));
}

export function useIsHost() {
  return useAuthStore((state) => isHost(state.user));
}

export function useIsHostAdmin() {
  return useAuthStore((state) => isHostAdmin(state.user));
}
