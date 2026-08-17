/**
 * Auth API — Authenticator host endpoint'leri
 * Route kaynak: AuthenticatorRoutes.cs (pintern-authenticator-latest-api)
 * Base: AUTH_ORIGIN (https://localhost:44323)
 */
import { authClient } from "@/lib/api-client";

// ─── DTO'lar ──────────────────────────────────────────────────────────────────

export interface LoginRequestDto {
  userName: string;
  password: string;
  tenantId?: string | null;
  organizationUnitId?: string | null;
  applicationScopeId?: string | null;
}

export interface TokenResponseDto {
  userId: string;
  tenantId?: string | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

export interface RefreshRequestDto {
  refreshToken: string;
}

export interface RegisterRequestDto {
  userName: string;
  emailAddress: string;
  password: string;
  name?: string;
  surname?: string;
}

export interface InviteRequestDto {
  email: string;
  userName?: string;
  roleNames: string[];
}

export interface AcceptInvitationRequestDto {
  userId: string;
  token: string;
  userName: string;
  password: string;
  passwordConfirm: string;
}

export interface ResendEmailConfirmationDto {
  emailAddress: string;
}

export interface CurrentUserDto {
  userId?: string | null;
  userName?: string | null;
  email?: string;
  name?: string;
  surname?: string;
  tenantId?: string;
  roles: string[];
}

export interface TenantDto {
  id: string;
  name: string;
  isActive: boolean;
  creationTime: string;
}

export interface CreateTenantDto {
  name: string;
}

export interface OrganizationUnitDto {
  id: string;
  displayName: string;
  code: string;
  parentId?: string;
  children?: OrganizationUnitDto[];
}

export interface CreateOrganizationUnitDto {
  displayName: string;
  parentId?: string;
}

export interface SelectedContextDto {
  contextId: string;
  tenantId?: string;
  organizationUnitId?: string;
  applicationScopeId?: string;
  roles?: string[];
}

export interface CreateSelectedContextDto {
  tenantId?: string;
  organizationUnitId?: string;
  applicationScopeId?: string;
}

// ─── API fonksiyonları ────────────────────────────────────────────────────────

export const authApi = {
  // Auth
  login: (data: LoginRequestDto) =>
    authClient.post<TokenResponseDto, LoginRequestDto>(
      "/api/authenticator/auth/login",
      data,
    ),

  refresh: (data: RefreshRequestDto) =>
    authClient.post<TokenResponseDto, RefreshRequestDto>(
      "/api/authenticator/auth/refresh",
      data,
    ),

  logout: (refreshToken: string) =>
    authClient.post<void, { refreshToken: string }>("/api/authenticator/auth/logout", {
      refreshToken,
    }),

  register: (data: RegisterRequestDto) =>
    authClient.post<void, RegisterRequestDto>(
      "/api/authenticator/auth/register",
      data,
    ),

  invite: (data: InviteRequestDto) =>
    authClient.post<void, InviteRequestDto>(
      "/api/authenticator/auth/invite",
      data,
    ),

  acceptInvitation: (data: AcceptInvitationRequestDto) =>
    authClient.post<void, AcceptInvitationRequestDto>(
      "/api/authenticator/auth/accept-invitation",
      data,
    ),

  me: () =>
    authClient.get<CurrentUserDto>("/api/authenticator/auth/me"),

  // Email onay
  confirmEmail: (token: string, userId: string) =>
    authClient.get<void>(
      `/api/authenticator/account/email-confirmation`,
      { params: { token, userId } },
    ),

  resendConfirmation: (data: ResendEmailConfirmationDto) =>
    authClient.post<void, ResendEmailConfirmationDto>(
      "/api/authenticator/account/email-confirmation/resend",
      data,
    ),

  // Tenant yönetimi
  tenants: {
    list: (params?: { skipCount?: number; maxResultCount?: number }) =>
      authClient.get<{ totalCount: number; items: TenantDto[] }>(
        "/api/authenticator/tenants",
        { params },
      ),

    get: (id: string) =>
      authClient.get<TenantDto>(`/api/authenticator/tenants/${id}`),

    create: (data: CreateTenantDto) =>
      authClient.post<TenantDto, CreateTenantDto>(
        "/api/authenticator/tenants",
        data,
      ),

    rename: (id: string, name: string) =>
      authClient.put<TenantDto, { name: string }>(
        `/api/authenticator/tenants/${id}/name`,
        { name },
      ),

    passivate: (id: string) =>
      authClient.post<TenantDto>(`/api/authenticator/tenants/${id}/passivate`),

    reactivate: (id: string) =>
      authClient.post<TenantDto>(`/api/authenticator/tenants/${id}/reactivate`),
  },

  // Organization Unit
  orgUnits: {
    list: (tenantId: string) =>
      authClient.get<OrganizationUnitDto[]>(
        `/api/authenticator/tenants/${tenantId}/organization-units`,
      ),

    create: (tenantId: string, data: CreateOrganizationUnitDto) =>
      authClient.post<OrganizationUnitDto, CreateOrganizationUnitDto>(
        `/api/authenticator/tenants/${tenantId}/organization-units`,
        data,
      ),

    rename: (tenantId: string, id: string, displayName: string) =>
      authClient.put<OrganizationUnitDto, { displayName: string }>(
        `/api/authenticator/tenants/${tenantId}/organization-units/${id}/name`,
        { displayName },
      ),

    delete: (tenantId: string, id: string) =>
      authClient.delete<void>(
        `/api/authenticator/tenants/${tenantId}/organization-units/${id}`,
      ),

    addMember: (tenantId: string, ouId: string, userId: string) =>
      authClient.post<void>(
        `/api/authenticator/tenants/${tenantId}/organization-units/${ouId}/members/${userId}`,
      ),

    removeMember: (tenantId: string, ouId: string, userId: string) =>
      authClient.delete<void>(
        `/api/authenticator/tenants/${tenantId}/organization-units/${ouId}/members/${userId}`,
      ),
  },

  // Seçili bağlam (selected context)
  contexts: {
    list: () =>
      authClient.get<SelectedContextDto[]>("/api/authenticator/contexts"),

    create: (data: CreateSelectedContextDto) =>
      authClient.post<SelectedContextDto, CreateSelectedContextDto>(
        "/api/authenticator/contexts",
        data,
      ),

    authorize: (resource: string, action: string) =>
      authClient.post<{ isAuthorized: boolean }>(
        "/api/authenticator/contexts/authorize",
        { resource, action },
      ),
  },
} as const;
