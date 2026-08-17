import authClient from "@/lib/auth-client";
import apiClient from "@/lib/api-client";
import { requireEntityId } from "@/lib/guid";
import { tenantRequestConfig } from "@/lib/tenant";
import type {
  AcceptInvitationDto,
  ConfirmEmailDto,
  Guid,
  InviteMemberDto,
  PasswordLoginDto,
  RegisterDto,
  ResendEmailConfirmationDto,
  TokenResponse,
} from "@/types";

export const authService = {
  login(credentials: PasswordLoginDto): Promise<TokenResponse> {
    return authClient.post("/api/auth/login", credentials);
  },

  register(dto: RegisterDto, tenantId: string): Promise<Guid> {
    return authClient.post("/api/auth/register", dto, tenantRequestConfig(tenantId));
  },

  // Backend (KBP-49): mail linkindeki tenantId, userId ve token ile dogrulama.
  // Bu istek env tenant'i degil, linkteki tenantId'yi header olarak gonderir.
  confirmEmail(dto: ConfirmEmailDto, tenantId: string): Promise<void> {
    requireEntityId(dto.userId, "Kullanıcı");
    return authClient.post("/api/auth/confirm-email", dto, tenantRequestConfig(tenantId));
  },

  // tenantId opsiyoneldir: tenant kullanicisi icin o tenant'a scope'lanir, host kullanicisi
  // (tenantId yok) icin host baglaminda calisir. Anonim uc oldugu icin tenant header'la cozer.
  resendEmailConfirmation(dto: ResendEmailConfirmationDto, tenantId?: string | null): Promise<void> {
    return authClient.post("/api/auth/resend-email-confirmation", dto, tenantId ? tenantRequestConfig(tenantId) : undefined);
  },

  // TEK ekran sifremi-unuttum: tenantId GONDERMEZ; backend e-postadan kullanicinin tenant'ini
  // cozer ve reset baglantisini o tenant kapsaminda gonderir. Hesap yoksa bile basari doner.
  forgotPassword(dto: { email: string; appName: string }): Promise<void> {
    return authClient.post("/api/auth/forgot-password", dto);
  },

  inviteMember(dto: InviteMemberDto, tenantId?: string): Promise<Guid> {
    return apiClient.post("/api/auth/invite", dto, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  acceptInvitation(dto: AcceptInvitationDto, tenantId: string): Promise<void> {
    requireEntityId(dto.userId, "Kullanıcı");
    return authClient.post("/api/auth/accept-invitation", dto, tenantRequestConfig(tenantId));
  },

  getMe(): Promise<Guid | null> {
    return apiClient.get("/api/auth/me");
  },
} as const;
