"use client";

import { useQuery } from "@tanstack/react-query";

import { permissionsApi } from "@/api/permissions.api";
import { queryKeys } from "@/api/query-keys";
import { getGrantedPermissions } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";

export function usePermissionsQuery() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    enabled: Boolean(session),
    queryFn: permissionsApi.getCurrent,
    queryKey: queryKeys.permissions.current(session?.tenantId, session?.userId ?? "anonymous"),
    select: getGrantedPermissions,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useAuthPermissionsQuery() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    enabled: Boolean(session),
    queryFn: permissionsApi.getCurrentAuth,
    queryKey: queryKeys.permissions.authCurrent(session?.tenantId, session?.userId ?? "anonymous"),
    select: getGrantedPermissions,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
