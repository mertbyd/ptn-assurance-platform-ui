import type { AppRole, AuthUser } from "@/types";

const ADMIN_ROLES: AppRole[] = ["SuperAdmin", "TenantAdmin", "OrganizationAdmin", "Admin"];
const WRITE_ROLES: AppRole[] = [...ADMIN_ROLES, "DatabaseUser"];
export const INVITABLE_ROLES = ["DatabaseUser", "ReadOnly"] as const satisfies readonly AppRole[];

function normalizeRole(role: string): string {
  return role.trim().toLocaleLowerCase("en-US");
}

export function hasRole(user: AuthUser | null, role: AppRole): boolean {
  const expected = normalizeRole(role);
  return Boolean(user?.roles.some((candidate) => normalizeRole(candidate) === expected));
}

export function isInvitableRole(role: string): boolean {
  const normalized = normalizeRole(role);
  return INVITABLE_ROLES.some((candidate) => normalizeRole(candidate) === normalized);
}

export function isAdmin(user: AuthUser | null): boolean {
  return ADMIN_ROLES.some((role) => hasRole(user, role));
}

export function canWrite(user: AuthUser | null): boolean {
  return Boolean(user) && WRITE_ROLES.some((role) => hasRole(user, role));
}

export function isReadOnly(user: AuthUser | null): boolean {
  return Boolean(user) && !canWrite(user);
}

export function isHost(user: AuthUser | null): boolean {
  return Boolean(user) && !user?.tenantId;
}

export function isHostAdmin(user: AuthUser | null): boolean {
  return isHost(user) && isAdmin(user);
}

export function primaryRoleLabel(user: AuthUser | null): string {
  if (isAdmin(user)) return "Yönetici";
  if (hasRole(user, "DatabaseUser")) return "Veritabanı kullanıcısı";
  if (hasRole(user, "ReadOnly")) return "Salt okunur";
  return "Kullanıcı";
}
