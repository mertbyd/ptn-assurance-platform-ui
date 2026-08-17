import apiClient from "@/lib/api-client";
import { requireEntityId } from "@/lib/guid";
import type {
  GetIdentityUsersInput,
  Guid,
  IdentityRoleCreateDto,
  IdentityRoleDto,
  IdentityRoleUpdateDto,
  IdentityUserCreateDto,
  IdentityUserDto,
  IdentityUserUpdateDto,
  IdentityUserUpdateRolesDto,
  ListResultDto,
  PagedResultDto,
} from "@/types";

// ABP Identity native endpointleri (custom admin route yazilmayacak).
export const identityUsersService = {
  getList(input?: GetIdentityUsersInput & { tenantId?: string }): Promise<PagedResultDto<IdentityUserDto>> {
    return apiClient.get("/api/identity/users", {
      headers: input?.tenantId ? { __tenant: input.tenantId } : undefined,
      params: {
        Filter: input?.filter,
        SkipCount: input?.skipCount ?? 0,
        MaxResultCount: input?.maxResultCount ?? 100,
        Sorting: input?.sorting,
      },
    });
  },

  getById(id: Guid, tenantId?: string): Promise<IdentityUserDto> {
    return apiClient.get(`/api/identity/users/${requireEntityId(id, "Kullanıcı")}`, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  create(dto: IdentityUserCreateDto, tenantId?: string): Promise<IdentityUserDto> {
    return apiClient.post("/api/identity/users", dto, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  update(id: Guid, dto: IdentityUserUpdateDto, tenantId?: string): Promise<IdentityUserDto> {
    return apiClient.put(`/api/identity/users/${requireEntityId(id, "Kullanıcı")}`, dto, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  remove(id: Guid, tenantId?: string): Promise<void> {
    return apiClient.delete(`/api/identity/users/${requireEntityId(id, "Kullanıcı")}`, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  getRoles(id: Guid, tenantId?: string): Promise<ListResultDto<IdentityRoleDto>> {
    return apiClient.get(`/api/identity/users/${requireEntityId(id, "Kullanıcı")}/roles`, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  updateRoles(id: Guid, dto: IdentityUserUpdateRolesDto, tenantId?: string): Promise<void> {
    return apiClient.put(`/api/identity/users/${requireEntityId(id, "Kullanıcı")}/roles`, dto, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  getAssignableRoles(tenantId?: string): Promise<ListResultDto<IdentityRoleDto>> {
    return apiClient.get("/api/identity/users/assignable-roles", {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },
} as const;

export const identityRolesService = {
  getList(tenantId?: string): Promise<PagedResultDto<IdentityRoleDto>> {
    return apiClient.get("/api/identity/roles", {
      headers: tenantId ? { __tenant: tenantId } : undefined,
      params: { SkipCount: 0, MaxResultCount: 1000 },
    });
  },

  getAll(tenantId?: string): Promise<ListResultDto<IdentityRoleDto>> {
    return apiClient.get("/api/identity/roles/all", {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  create(dto: IdentityRoleCreateDto, tenantId?: string): Promise<IdentityRoleDto> {
    return apiClient.post("/api/identity/roles", dto, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  update(id: Guid, dto: IdentityRoleUpdateDto, tenantId?: string): Promise<IdentityRoleDto> {
    return apiClient.put(`/api/identity/roles/${requireEntityId(id, "Rol")}`, dto, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },

  remove(id: Guid, tenantId?: string): Promise<void> {
    return apiClient.delete(`/api/identity/roles/${requireEntityId(id, "Rol")}`, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
    });
  },
} as const;
