import type { Guid, PagedResultRequestDto } from "@/db-types/api.types";

// ABP multi-tenancy FindTenantResultDto — /api/abp/multi-tenancy/tenants/by-name/{name}
export interface FindTenantResultDto {
  success: boolean;
  tenantId?: Guid | null;
  name?: string | null;
  normalizedName?: string | null;
  isActive?: boolean | null;
}

// ABP TenantManagement — /api/multi-tenancy/tenants (host baglaminda)
export interface TenantDto {
  id: Guid;
  name: string;
  concurrencyStamp?: string | null;
}

export interface GetTenantsInput extends PagedResultRequestDto {
  filter?: string;
}

export interface TenantCreateDto {
  name: string;
  adminEmailAddress: string;
  adminPassword: string;
  // ABP tenant-create ekstra alani: kurucu yoneticinin kullanici adi (jenerik "admin" yerine).
  extraProperties?: Record<string, string>;
}

export interface TenantUpdateDto {
  name: string;
  concurrencyStamp?: string | null;
}
