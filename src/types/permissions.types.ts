// ABP Permission Management native DTO'lari — /api/permission-management/permissions

export interface PermissionProviderInfoDto {
  providerName: string;
  providerKey?: string | null;
}

export interface PermissionGrantInfoDto {
  name: string;
  displayName: string;
  parentName?: string | null;
  isGranted: boolean;
  allowedProviders: string[];
  grantedProviders: PermissionProviderInfoDto[];
}

export interface PermissionGroupDto {
  name: string;
  displayName: string;
  permissions: PermissionGrantInfoDto[];
}

export interface GetPermissionListResultDto {
  entityDisplayName: string;
  groups: PermissionGroupDto[];
}

export interface UpdatePermissionDto {
  name: string;
  isGranted: boolean;
}

export interface UpdatePermissionsDto {
  permissions: UpdatePermissionDto[];
}
