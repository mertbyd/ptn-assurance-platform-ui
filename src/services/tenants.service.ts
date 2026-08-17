import authClient from "@/lib/auth-client";
import hostClient from "@/lib/host-client";
import { requireEntityId } from "@/lib/guid";
import type {
  FindTenantResultDto,
  GetPermissionListResultDto,
  GetTenantsInput,
  Guid,
  IdentityRoleDto,
  IdentityUserDto,
  IdentityUserUpdateDto,
  InviteMemberDto,
  ListResultDto,
  PagedResultDto,
  PagedResultRequestDto,
  TenantCreateDto,
  TenantDto,
  TenantUpdateDto,
  UpdatePermissionsDto,
} from "@/types";

// Sirket secim ekranlari tenant kimligini isimden cozecekse kullanabilecegi anonim ABP ucu.
// Cozulen kimlik yalniz login body/context'ine verilir; global header'a donusturulmez.
export const tenantsService = {
  getByName(name: string): Promise<FindTenantResultDto> {
    return authClient.get(`/api/abp/multi-tenancy/tenants/by-name/${encodeURIComponent(name)}`);
  },
} as const;

// ABP TenantManagement — host (TenantId = null) yoneticisi icindir. hostClient tenant
// header'i gondermez; bu uclar tenant baglaminda 403 doner.
export const tenantManagementService = {
  getList(input?: GetTenantsInput): Promise<PagedResultDto<TenantDto>> {
    return hostClient.get("/api/multi-tenancy/tenants", {
      params: {
        Filter: input?.filter,
        SkipCount: input?.skipCount ?? 0,
        MaxResultCount: input?.maxResultCount ?? 100,
        Sorting: input?.sorting,
      },
    });
  },

  create(dto: TenantCreateDto): Promise<TenantDto> {
    return hostClient.post("/api/multi-tenancy/tenants", dto);
  },

  update(id: Guid, dto: TenantUpdateDto): Promise<TenantDto> {
    return hostClient.put(`/api/multi-tenancy/tenants/${requireEntityId(id, "Şirket")}`, dto);
  },

  remove(id: Guid): Promise<void> {
    return hostClient.delete(`/api/multi-tenancy/tenants/${requireEntityId(id, "Şirket")}`);
  },
} as const;

// Host admin'in bir tenant'in kullanicilarini uctan uca yonetmesi (KBP-55).
//
// Neden ayri (route-tabanli) uc: ABP'de aktif tenant, authenticate kullanicinin TOKEN
// CLAIM'inden cozulur. Host admin'in token'inda tenant claim'i yoktur, bu yuzden stok
// /api/identity/* + /api/permission-management/* uclari (ve __tenant basligi) tenant'i
// DEGISTIREMEZ ve hep HOST'ta calisir. Tenant kimligi burada ROUTE'ta gider; backend
// her cagriyı CurrentTenant.Change ile hedef tenant kapsaminda ABP'nin kendi servislerine
// devreder. hostClient tenant header'i gondermez; yetki host TenantManagement iznidir.
export const tenantUsersService = {
  getList(tenantId: Guid, input?: PagedResultRequestDto): Promise<PagedResultDto<IdentityUserDto>> {
    return hostClient.get(`${base(tenantId)}`, {
      params: { SkipCount: input?.skipCount ?? 0, MaxResultCount: input?.maxResultCount ?? 100 },
    });
  },

  get(tenantId: Guid, userId: Guid): Promise<IdentityUserDto> {
    return hostClient.get(`${base(tenantId)}/${requireEntityId(userId, "Kullanıcı")}`);
  },

  update(tenantId: Guid, userId: Guid, dto: IdentityUserUpdateDto): Promise<IdentityUserDto> {
    return hostClient.put(`${base(tenantId)}/${requireEntityId(userId, "Kullanıcı")}`, dto);
  },

  remove(tenantId: Guid, userId: Guid): Promise<void> {
    return hostClient.delete(`${base(tenantId)}/${requireEntityId(userId, "Kullanıcı")}`);
  },

  getRoles(tenantId: Guid, userId: Guid): Promise<ListResultDto<IdentityRoleDto>> {
    return hostClient.get(`${base(tenantId)}/${requireEntityId(userId, "Kullanıcı")}/roles`);
  },

  getAssignableRoles(tenantId: Guid): Promise<ListResultDto<IdentityRoleDto>> {
    return hostClient.get(`${base(tenantId)}/assignable-roles`);
  },

  invite(tenantId: Guid, dto: InviteMemberDto): Promise<Guid> {
    return hostClient.post(`${base(tenantId)}/invite`, dto);
  },

  getPermissions(tenantId: Guid, userId: Guid): Promise<GetPermissionListResultDto> {
    return hostClient.get(`${base(tenantId)}/${requireEntityId(userId, "Kullanıcı")}/permissions`);
  },

  updatePermissions(tenantId: Guid, userId: Guid, dto: UpdatePermissionsDto): Promise<void> {
    return hostClient.put(`${base(tenantId)}/${requireEntityId(userId, "Kullanıcı")}/permissions`, dto);
  },
} as const;

function base(tenantId: Guid): string {
  return `/api/multi-tenancy/tenants/${requireEntityId(tenantId, "Şirket")}/users`;
}
