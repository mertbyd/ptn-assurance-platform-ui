import type { Guid } from "@/db-types/api.types";

export interface PasswordLoginDto {
  userName: string;
  password: string;
  tenantId?: Guid;
}

export interface RegisterDto {
  userName: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

export interface ConfirmEmailDto {
  userId: Guid;
  token: string;
}

export interface ResendEmailConfirmationDto {
  email: string;
}

export interface InviteMemberDto {
  email: string;
  userName?: string | null;
  roleNames: string[];
}

export interface AcceptInvitationDto {
  userId: Guid;
  userName: string;
  token: string;
  password: string;
  passwordConfirm: string;
}

export interface TokenResponse {
  userId: Guid;
  tenantId: Guid | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn: number;
  tokenType: string;
}

export interface CurrentUserDto {
  userId: Guid | null;
}

// Backend (KBP-49) roller. Frontend yalnizca butonlari gizlemek icin kullanir;
// asil guvenlik backend'de, yetkisiz istekte 403 beklenir.
export type AppRole = "Admin" | "DatabaseUser" | "ReadOnly";

// Oturumdaki kullaniciyi JWT'den cozup tuttugumuz ozet.
export interface AuthUser {
  userId: Guid | null;
  userName: string | null;
  email: string | null;
  roles: string[];
  // tenantId yoksa kullanici host (platform) baglamindadir.
  tenantId: Guid | null;
}

// Backend (KBP-49) auth hata kodlari.
export const AUTH_ERROR_TENANT_MISSING = "DatabaseChecker.Auth:0010";
export const AUTH_ERROR_EMAIL_NOT_CONFIRMED = "DatabaseChecker.Auth:0012";
export const AUTH_ERROR_TENANT_CONTEXT_MISMATCH = "DatabaseChecker.Auth:0013";
export const AUTH_ERROR_ROLE_NOT_ASSIGNABLE = "DatabaseChecker.Auth:0014";
export const AUTH_ERROR_INVITATION_FAILED = "DatabaseChecker.Auth:0015";
