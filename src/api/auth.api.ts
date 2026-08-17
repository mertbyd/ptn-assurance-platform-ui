import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export type LoginDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Auth.LoginDto"];
export type RegisterDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Auth.RegisterDto"];
export type ForgotPasswordDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Auth.ForgotPasswordDto"];
export type ConfirmEmailDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Auth.ConfirmEmailDto"];
export type ResendEmailConfirmationDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Auth.ResendEmailConfirmationDto"];
export type AcceptInvitationDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Auth.AcceptInvitationDto"];
export type TokenResponseDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Auth.TokenResponse"];
export type ResetPasswordDto = components["schemas"]["Volo.Abp.Account.ResetPasswordDto"];

const authBasePath = "/api/auth";

export const authApi = {
  acceptInvitation: (input: AcceptInvitationDto, tenantId: string) =>
    apiClient.post<void, AcceptInvitationDto>(`${authBasePath}/accept-invitation`, input, {
      headers: { __tenant: tenantId },
    }),
  confirmEmail: (input: ConfirmEmailDto, tenantId: string) =>
    apiClient.post<void, ConfirmEmailDto>(`${authBasePath}/confirm-email`, input, {
      headers: { __tenant: tenantId },
    }),
  forgotPassword: (input: ForgotPasswordDto) =>
    apiClient.post<void, ForgotPasswordDto>(`${authBasePath}/forgot-password`, input),
  login: (input: LoginDto) => apiClient.post<TokenResponseDto, LoginDto>(`${authBasePath}/login`, input),
  me: () => apiClient.get<string | null>(`${authBasePath}/me`),
  register: (input: RegisterDto, tenantId: string) =>
    apiClient.post<string, RegisterDto>(`${authBasePath}/register`, input, {
      headers: { __tenant: tenantId },
    }),
  resetPassword: (input: ResetPasswordDto, tenantId?: string) =>
    apiClient.post<void, ResetPasswordDto>("/api/account/reset-password", input, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    }),
  resendEmailConfirmation: (input: ResendEmailConfirmationDto) =>
    apiClient.post<void, ResendEmailConfirmationDto>(`${authBasePath}/resend-email-confirmation`, input),
};
