import type { components } from "@/api/generated/schema";

type ApplicationConfigurationDto =
  components["schemas"]["Volo.Abp.AspNetCore.Mvc.ApplicationConfigurations.ApplicationConfigurationDto"];

export const Permissions = {
  authenticator: {
    auth: {
      inviteMember: "Authenticator.Auth.InviteMember",
    },
    tenants: {
      create: "Authenticator.Tenants.Create",
      passivate: "Authenticator.Tenants.Passivate",
      reactivate: "Authenticator.Tenants.Reactivate",
      read: "Authenticator.Tenants.Read",
      rename: "Authenticator.Tenants.Rename",
    },
  },
  checks: {
    execute: "ApiContractChecker.Checks.Execute",
    view: "ApiContractChecker.Checks.View",
  },
  email: {
    manage: "ApiContractChecker.Email.Manage",
    manageSender: "ApiContractChecker.Email.ManageSender",
    view: "ApiContractChecker.Email.View",
    viewSender: "ApiContractChecker.Email.ViewSender",
  },
  // Sablon uclari Piton.Emailing paketinin kendi izin agacindan yetkilenir; okuma izni
  // paket sozlesmesinde grup adinin kendisidir (`.View` degil).
  emailTemplates: {
    manage: "Piton.Emailing.EmailTemplates.Manage",
    view: "Piton.Emailing.EmailTemplates",
  },
  emailProvider: {
    manage: "Piton.Emailing.Provider.Manage",
    view: "Piton.Emailing.Provider.View",
  },
  identity: {
    roles: {
      managePermissions: "AbpIdentity.Roles.ManagePermissions",
      view: "AbpIdentity.Roles",
    },
    users: {
      delete: "AbpIdentity.Users.Delete",
      managePermissions: "AbpIdentity.Users.ManagePermissions",
      update: "AbpIdentity.Users.Update",
      view: "AbpIdentity.Users",
    },
  },
  lookups: {
    manage: "ApiContractChecker.Lookups.Manage",
    view: "ApiContractChecker.Lookups.View",
  },
  operators: {
    manage: "ApiContractChecker.Operators.Manage",
    view: "ApiContractChecker.Operators.View",
  },
  recipients: {
    manage: "ApiContractChecker.Recipients.Manage",
    view: "ApiContractChecker.Recipients.View",
  },
  sources: {
    manage: "ApiContractChecker.Sources.Manage",
    view: "ApiContractChecker.Sources.View",
  },
  tenants: {
    manage: "AbpTenantManagement.Tenants",
  },
} as const;

type NestedValue<T> = T extends string ? T : { [K in keyof T]: NestedValue<T[K]> }[keyof T];

export type PermissionName = NestedValue<typeof Permissions>;
export type GrantedPermissions = ReadonlySet<string>;

export const emptyGrantedPermissions: GrantedPermissions = new Set<string>();

export function getGrantedPermissions(configuration: ApplicationConfigurationDto): GrantedPermissions {
  const policies = configuration.auth?.grantedPolicies ?? {};
  return new Set(Object.entries(policies).filter(([, isGranted]) => isGranted).map(([name]) => name));
}

export function hasPermission(granted: GrantedPermissions, permission: PermissionName): boolean {
  // "*" wildcard — dev mock session tüm izinlere sahip
  return granted.has("*") || granted.has(permission);
}

export function hasAnyPermission(granted: GrantedPermissions, permissions: readonly PermissionName[]): boolean {
  // "*" wildcard veya boş liste — hepsine izin ver
  return granted.has("*") || permissions.length === 0 || permissions.some((permission) => hasPermission(granted, permission));
}
