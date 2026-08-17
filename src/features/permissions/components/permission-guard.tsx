"use client";

import type { PermissionName } from "@/lib/permissions";
import { emptyGrantedPermissions, hasAnyPermission } from "@/lib/permissions";

import { usePermissionsQuery } from "../hooks/use-permissions-query";
import { AccessDenied } from "./access-denied";

export function PermissionGuard({
  anyOf,
  children,
}: Readonly<{ anyOf: readonly PermissionName[]; children: React.ReactNode }>) {
  const { data = emptyGrantedPermissions } = usePermissionsQuery();

  if (!hasAnyPermission(data, anyOf)) {
    return <AccessDenied />;
  }

  return children;
}
