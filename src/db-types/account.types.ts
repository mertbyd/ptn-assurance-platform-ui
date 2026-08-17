import type { Guid } from "@/db-types/api.types";

// ABP Account native endpointleri (custom password-reset yazilmayacak).

// POST /api/account/send-password-reset-code
export interface SendPasswordResetCodeDto {
  email: string;
  appName: string;
  returnUrl?: string | null;
  returnUrlHash?: string | null;
}

// POST /api/account/verify-password-reset-token -> bool
export interface VerifyPasswordResetTokenInput {
  userId: Guid;
  resetToken: string;
}

// POST /api/account/reset-password
export interface ResetPasswordDto {
  userId: Guid;
  resetToken: string;
  password: string;
}

// POST /api/account/my-profile/change-password (Authorization gerekir)
export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// GET /api/account/my-profile — giris yapmis kullanicinin kendi profili (ABP native).
export interface ProfileDto {
  userName: string;
  email: string;
  name?: string | null;
  surname?: string | null;
  phoneNumber?: string | null;
  isExternal: boolean;
  hasPassword: boolean;
  concurrencyStamp?: string | null;
}

// PUT /api/account/my-profile — kullanici kendi ad/soyad/telefon/e-postasini gunceller.
// Not: e-posta degisince ABP EmailConfirmed'i false yapar (SetEmailAsync); bu yuzden yeni
// adrese yeniden dogrulama gonderilmelidir, aksi halde kullanici bir sonraki giriste kilitlenir.
export interface UpdateProfileDto {
  userName: string;
  email: string;
  name?: string | null;
  surname?: string | null;
  phoneNumber?: string | null;
  concurrencyStamp?: string | null;
}
