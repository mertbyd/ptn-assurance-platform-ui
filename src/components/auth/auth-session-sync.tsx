"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { authSessionChangedEvent, authUnauthorizedEvent, setAuthRedirectReason } from "@/lib/auth-storage";
import { useAuthStore } from "@/stores/auth-store";

export function AuthSessionSync() {
  const router = useRouter();
  const expiresAt = useAuthStore((state) => state.session?.expiresAt);

  useEffect(() => {
    useAuthStore.getState().hydrate();

    const syncSession = () => useAuthStore.getState().syncFromStorage();
    const handleUnauthorized = () => {
      setAuthRedirectReason("expired");
      void useAuthStore.getState().signOut();
      router.replace("/login?reason=expired");
    };

    window.addEventListener(authSessionChangedEvent, syncSession);
    window.addEventListener(authUnauthorizedEvent, handleUnauthorized);

    return () => {
      window.removeEventListener(authSessionChangedEvent, syncSession);
      window.removeEventListener(authUnauthorizedEvent, handleUnauthorized);
    };
  }, [router]);

  useEffect(() => {
    if (expiresAt && expiresAt <= Date.now()) {
      useAuthStore.getState().syncFromStorage();
    }
  }, [expiresAt]);

  return null;
}
