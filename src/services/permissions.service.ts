import apiClient from "@/lib/api-client";
import type { GetPermissionListResultDto, UpdatePermissionsDto } from "@/types";

// ABP Permission Management. Rol icin providerName="R" + rol adi, kullanici icin
// providerName="U" + kullanici id. Ayni uc her iki saglayiciyi da destekler.
export const permissionsService = {
  get(providerName: string, providerKey: string, tenantId?: string): Promise<GetPermissionListResultDto> {
    return apiClient.get("/api/permission-management/permissions", {
      headers: tenantId ? { __tenant: tenantId } : undefined,
      params: { providerName, providerKey },
    });
  },

  update(providerName: string, providerKey: string, dto: UpdatePermissionsDto, tenantId?: string): Promise<void> {
    return apiClient.put("/api/permission-management/permissions", dto, {
      headers: tenantId ? { __tenant: tenantId } : undefined,
      params: { providerName, providerKey },
    });
  },

  getForRole(roleName: string, tenantId?: string) {
    return this.get("R", roleName, tenantId);
  },

  updateForRole(roleName: string, dto: UpdatePermissionsDto, tenantId?: string) {
    return this.update("R", roleName, dto, tenantId);
  },

  getForUser(userId: string, tenantId?: string) {
    return this.get("U", userId, tenantId);
  },

  updateForUser(userId: string, dto: UpdatePermissionsDto, tenantId?: string) {
    return this.update("U", userId, dto, tenantId);
  },
} as const;
