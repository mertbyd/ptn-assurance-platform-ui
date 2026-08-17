import apiClient from "@/lib/api-client";
import authClient from "@/lib/auth-client";
import { requireEntityId } from "@/lib/guid";
import { tenantRequestConfig } from "@/lib/tenant";
import type {
  ChangePasswordInput,
  ProfileDto,
  ResetPasswordDto,
  SendPasswordResetCodeDto,
  UpdateProfileDto,
  VerifyPasswordResetTokenInput,
} from "@/types";

// ABP reset linki (email) tenantId tasir; verify/reset o tenant icinde yapilmali.
function tenantConfig(tenantId?: string | null) {
  return tenantId ? tenantRequestConfig(tenantId) : undefined;
}

// ABP Account native akisi. Sifre sifirlama tenant-scoped ama anonimdir (authClient);
// change-password login olmus kullanici icindir (apiClient, Bearer + tenant).
export const accountService = {
  sendPasswordResetCode(dto: SendPasswordResetCodeDto, tenantId?: string | null): Promise<void> {
    return authClient.post("/api/account/send-password-reset-code", dto, tenantConfig(tenantId));
  },

  verifyPasswordResetToken(input: VerifyPasswordResetTokenInput, tenantId?: string | null): Promise<boolean> {
    requireEntityId(input.userId, "Kullanıcı");
    return authClient.post("/api/account/verify-password-reset-token", input, tenantConfig(tenantId));
  },

  resetPassword(dto: ResetPasswordDto, tenantId?: string | null): Promise<void> {
    requireEntityId(dto.userId, "Kullanıcı");
    return authClient.post("/api/account/reset-password", dto, tenantConfig(tenantId));
  },

  changePassword(input: ChangePasswordInput): Promise<void> {
    return apiClient.post("/api/account/my-profile/change-password", input);
  },

  // Giris yapmis kullanicinin kendi profili. apiClient token'daki tenant baglamini kullanir,
  // yani tenant kullanicisi kendi tenant'i icinde calisir; __tenant juggling'e gerek yoktur.
  getMyProfile(): Promise<ProfileDto> {
    return apiClient.get("/api/account/my-profile");
  },

  updateMyProfile(dto: UpdateProfileDto): Promise<ProfileDto> {
    return apiClient.put("/api/account/my-profile", dto);
  },
} as const;
