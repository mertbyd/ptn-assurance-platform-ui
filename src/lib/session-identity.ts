import type { AuthSession } from "./auth-storage";

interface TokenClaims {
  email?: string;
  name?: string;
  preferred_username?: string;
  unique_name?: string;
}

export interface SessionIdentity {
  displayName: string;
  initials: string;
}

function readTokenClaims(accessToken: string): TokenClaims | null {
  const payload = accessToken.split(".")[1];
  if (!payload || typeof window === "undefined") {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded)) as TokenClaims;
  } catch {
    return null;
  }
}

function createInitials(displayName: string): string {
  return displayName
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

export function getSessionIdentity(session: AuthSession | null, fallbackName: string): SessionIdentity {
  const claims = session ? readTokenClaims(session.accessToken) : null;
  const displayName = claims?.name || claims?.preferred_username || claims?.unique_name || claims?.email || fallbackName;
  const initials = createInitials(displayName) || createInitials(fallbackName);

  return { displayName, initials };
}
