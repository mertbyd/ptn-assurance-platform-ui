export interface AuthSession {
  accessToken: string;
  refreshToken?: string | null;
  tenantId?: string | null;
  expiresAt: number;
  userId: string;
}

const sessionStorageKey = "acc.auth.session.v1";
const authRedirectReasonStorageKey = "acc.auth.redirect-reason.v1";

export type AuthRedirectReason = "expired";

export const authSessionChangedEvent = "acc:auth-session-changed";
export const authUnauthorizedEvent = "acc:auth-unauthorized";

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<AuthSession>;
  return (
    typeof c.accessToken === "string" && c.accessToken.length > 0 &&
    typeof c.userId === "string"      && c.userId.length > 0 &&
    typeof c.expiresAt === "number"
  );
}

export function readAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const serialized = window.sessionStorage.getItem(sessionStorageKey);
  if (!serialized) return null;

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!isAuthSession(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAuthSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(session));
  window.dispatchEvent(new Event(authSessionChangedEvent));
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(sessionStorageKey);
  window.dispatchEvent(new Event(authSessionChangedEvent));
}

export function setAuthRedirectReason(reason: AuthRedirectReason): void {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(authRedirectReasonStorageKey, reason);
  }
}

export function takeAuthRedirectReason(): AuthRedirectReason | null {
  if (typeof window === "undefined") return null;
  const reason = window.sessionStorage.getItem(authRedirectReasonStorageKey);
  window.sessionStorage.removeItem(authRedirectReasonStorageKey);
  return reason === "expired" ? reason : null;
}

export function notifyUnauthorized(): void {
  if (typeof window === "undefined") return;
  setAuthRedirectReason("expired");
  clearAuthSession();
  window.dispatchEvent(new Event(authUnauthorizedEvent));
}
