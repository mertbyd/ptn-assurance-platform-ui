import type { components } from "./generated/schema";
import { authClient } from "@/lib/api-client";

export interface TenantDto { id: string; name: string; isActive: boolean }
export interface TenantCreateDto { name: string }
export interface TenantUpdateDto { name: string }
export interface TenantPage { totalCount: number; items: TenantDto[] }
export type IdentityUserDto = components["schemas"]["Volo.Abp.Identity.IdentityUserDto"];
export type IdentityUserUpdateDto = components["schemas"]["Volo.Abp.Identity.IdentityUserUpdateDto"];
export type IdentityUserPage =
  components["schemas"]["Volo.Abp.Application.Dtos.PagedResultDtoOfVolo.Abp.Identity.IdentityUserDto"];
export type IdentityRoleDto = components["schemas"]["Volo.Abp.Identity.IdentityRoleDto"];
export type IdentityRoleList =
  components["schemas"]["Volo.Abp.Application.Dtos.ListResultDtoOfVolo.Abp.Identity.IdentityRoleDto"];
export interface InviteMemberDto { email: string; userName?: string; roleNames: string[] }
export type PermissionListDto =
  components["schemas"]["Volo.Abp.PermissionManagement.GetPermissionListResultDto"];
export type PermissionGrantInfoDto =
  components["schemas"]["Volo.Abp.PermissionManagement.PermissionGrantInfoDto"];
export type UpdatePermissionsDto = components["schemas"]["Volo.Abp.PermissionManagement.UpdatePermissionsDto"];

export const teamApi = {
  createTenant: (input: TenantCreateDto) =>
    authClient.post<TenantDto, TenantCreateDto>("/api/authenticator/tenants", input),
  passivateTenant: (id: string) =>
    authClient.post<TenantDto>(`/api/authenticator/tenants/${id}/passivate`),
  reactivateTenant: (id: string) =>
    authClient.post<TenantDto>(`/api/authenticator/tenants/${id}/reactivate`),
  deleteUser: (_tenantId: string, userId: string) =>
    authClient.delete<void>(`/api/identity/users/${userId}`),
  inviteUser: (_tenantId: string, input: InviteMemberDto) =>
    authClient.post<string, InviteMemberDto>("/api/authenticator/auth/invite", input),
  listAssignableRoles: () =>
    authClient.get<IdentityRoleList>("/api/identity/roles/all"),
  rolePermissions: (roleName: string) =>
    authClient.get<PermissionListDto>("/api/permission-management/permissions", {
      params: { providerName: "R", providerKey: roleName },
    }),
  updateRolePermissions: (roleName: string, input: UpdatePermissionsDto) =>
    authClient.put<void, UpdatePermissionsDto>("/api/permission-management/permissions", input, {
      params: { providerName: "R", providerKey: roleName },
    }),
  listOperators: (skipCount = 0, maxResultCount = 100) =>
    authClient.get<IdentityUserPage>("/api/identity/users", {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  listTenants: (skipCount = 0, maxResultCount = 100) =>
    authClient.get<TenantPage>("/api/authenticator/tenants", {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  listUsers: (_tenantId: string, skipCount = 0, maxResultCount = 100) =>
    authClient.get<IdentityUserPage>("/api/identity/users", {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  userPermissions: (tenantId: string | undefined, userId: string) =>
    authClient.get<PermissionListDto>("/api/permission-management/permissions", {
      params: { providerName: "U", providerKey: userId, ...(tenantId ? { tenantId } : {}) },
    }),
  userRoles: (_tenantId: string, userId: string) =>
    authClient.get<IdentityRoleList>(`/api/identity/users/${userId}/roles`),
  updateTenant: (id: string, input: TenantUpdateDto) =>
    authClient.put<TenantDto, TenantUpdateDto>(`/api/authenticator/tenants/${id}/name`, input),
  updateUser: (_tenantId: string, userId: string, input: IdentityUserUpdateDto) =>
    authClient.put<IdentityUserDto, IdentityUserUpdateDto>(`/api/identity/users/${userId}`, input),
  updateUserPermissions: (tenantId: string | undefined, userId: string, input: UpdatePermissionsDto) =>
    authClient.put<void, UpdatePermissionsDto>("/api/permission-management/permissions", input, {
      params: { providerName: "U", providerKey: userId, ...(tenantId ? { tenantId } : {}) },
    }),
};
