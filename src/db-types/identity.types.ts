import type { Guid, PagedResultRequestDto } from "@/db-types/api.types";

// ABP Identity native DTO'lari — /api/identity/users, /api/identity/roles

export interface ListResultDto<T> {
  items: T[];
}

export interface IdentityRoleDto {
  id: Guid;
  concurrencyStamp: string;
  name: string;
  isDefault: boolean;
  isStatic: boolean;
  isPublic: boolean;
}

export interface IdentityUserDto {
  id: Guid;
  concurrencyStamp: string;
  userName: string;
  email: string;
  name?: string | null;
  surname?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  emailConfirmed: boolean;
  lockoutEnabled: boolean;
  roleNames?: string[] | null;
  creationTime: string;
}

export interface IdentityUserCreateDto {
  userName: string;
  email: string;
  password: string;
  name?: string | null;
  surname?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  lockoutEnabled: boolean;
  roleNames?: string[] | null;
}

export interface IdentityUserUpdateDto {
  concurrencyStamp: string;
  userName: string;
  email: string;
  password?: string | null;
  name?: string | null;
  surname?: string | null;
  phoneNumber?: string | null;
  isActive: boolean;
  lockoutEnabled: boolean;
  roleNames?: string[] | null;
}

export interface GetIdentityUsersInput extends PagedResultRequestDto {
  filter?: string;
}

export interface IdentityUserUpdateRolesDto {
  roleNames: string[];
}

export interface IdentityRoleCreateDto {
  name: string;
  isDefault: boolean;
  isPublic: boolean;
}

export interface IdentityRoleUpdateDto {
  concurrencyStamp: string;
  name: string;
  isDefault: boolean;
  isPublic: boolean;
}
