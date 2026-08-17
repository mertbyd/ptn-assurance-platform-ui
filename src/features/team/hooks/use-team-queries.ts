"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/query-keys";
import { teamApi, type IdentityUserUpdateDto, type InviteMemberDto, type TenantCreateDto, type TenantUpdateDto, type UpdatePermissionsDto } from "@/api/team.api";

export function useOperatorsQuery(enabled: boolean) {
  return useQuery({ enabled, queryFn: () => teamApi.listOperators(), queryKey: queryKeys.team.operators });
}

export function useTenantsQuery(enabled: boolean) {
  return useQuery({ enabled, queryFn: () => teamApi.listTenants(), queryKey: queryKeys.team.tenants });
}

export function useTenantUsersQuery(tenantId?: string) {
  return useQuery({ enabled: Boolean(tenantId), queryFn: () => teamApi.listUsers(tenantId!), queryKey: queryKeys.team.users(tenantId ?? "none") });
}

export function useAssignableRolesQuery(tenantId?: string) {
  return useQuery({ enabled: Boolean(tenantId), queryFn: () => teamApi.listAssignableRoles(tenantId!), queryKey: queryKeys.team.assignableRoles(tenantId ?? "none") });
}

export function useUserRolesQuery(tenantId?: string, userId?: string) {
  return useQuery({ enabled: Boolean(tenantId && userId), queryFn: () => teamApi.userRoles(tenantId!, userId!), queryKey: queryKeys.team.roles(tenantId ?? "none", userId ?? "none") });
}

export function useUserPermissionsQuery(tenantId?: string, userId?: string) {
  return useQuery({ enabled: Boolean(tenantId && userId), queryFn: () => teamApi.userPermissions(tenantId!, userId!), queryKey: queryKeys.team.permissions(tenantId ?? "none", userId ?? "none") });
}

function useInvalidateTeam() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
}

export function useCreateTenantMutation() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: (input: TenantCreateDto) => teamApi.createTenant(input), onSuccess: invalidate });
}

export function useUpdateTenantMutation() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: TenantUpdateDto }) => teamApi.updateTenant(id, input), onSuccess: invalidate });
}

export function useDeleteTenantMutation() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: teamApi.deleteTenant, onSuccess: invalidate });
}

export function useInviteUserMutation() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ tenantId, input }: { tenantId: string; input: InviteMemberDto }) => teamApi.inviteUser(tenantId, input), onSuccess: invalidate });
}

export function useUpdateUserMutation() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ tenantId, userId, input }: { tenantId: string; userId: string; input: IdentityUserUpdateDto }) => teamApi.updateUser(tenantId, userId, input), onSuccess: invalidate });
}

export function useDeleteUserMutation() {
  const invalidate = useInvalidateTeam();
  return useMutation({ mutationFn: ({ tenantId, userId }: { tenantId: string; userId: string }) => teamApi.deleteUser(tenantId, userId), onSuccess: invalidate });
}

export function useUpdateUserPermissionsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, userId, input }: { tenantId: string; userId: string; input: UpdatePermissionsDto }) => teamApi.updateUserPermissions(tenantId, userId, input),
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: queryKeys.team.permissions(variables.tenantId, variables.userId) }),
  });
}
