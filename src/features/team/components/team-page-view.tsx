"use client";

import { Box, Button, Grid, Stack, Tabs, Text } from "@chakra-ui/react";
import { Building2, Plus, UsersRound } from "lucide-react";
import { useState } from "react";

import type { IdentityUserDto, TenantDto } from "@/api/team.api";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { usePermissionsQuery } from "@/features/permissions";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";

import { useAssignableRolesQuery, useDeleteTenantMutation, useDeleteUserMutation, useOperatorsQuery, useTenantsQuery, useTenantUsersQuery, useUserPermissionsQuery, useUserRolesQuery } from "../hooks/use-team-queries";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { CreateTenantDialog } from "./create-tenant-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { OperatorList } from "./operator-list";
import { PermissionEditorDialog } from "./permission-editor-dialog";
import { RenameTenantDialog } from "./rename-tenant-dialog";
import { TenantList } from "./tenant-list";
import { UserFormDialog } from "./user-form-dialog";
import { UserList } from "./user-list";

export function TeamPageView() {
  const { data: granted = emptyGrantedPermissions } = usePermissionsQuery();
  const canManageTenants = hasPermission(granted, Permissions.tenants.manage);
  const canViewOperators = hasPermission(granted, Permissions.operators.view);
  const tenantsQuery = useTenantsQuery(canManageTenants);
  const operatorsQuery = useOperatorsQuery(canViewOperators);
  const [selectedTenantId, setSelectedTenantId] = useState<string>();
  const tenants = tenantsQuery.data?.items ?? [];
  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? tenants[0];
  const usersQuery = useTenantUsersQuery(selectedTenant?.id);
  const rolesQuery = useAssignableRolesQuery(selectedTenant?.id);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [renamingTenant, setRenamingTenant] = useState<TenantDto>();
  const [deletingTenant, setDeletingTenant] = useState<TenantDto>();
  const [editingUser, setEditingUser] = useState<IdentityUserDto>();
  const [permissionsUser, setPermissionsUser] = useState<IdentityUserDto>();
  const [deletingUser, setDeletingUser] = useState<IdentityUserDto>();
  const userRolesQuery = useUserRolesQuery(selectedTenant?.id, editingUser?.id);
  const userPermissionsQuery = useUserPermissionsQuery(selectedTenant?.id, permissionsUser?.id);
  const deleteTenant = useDeleteTenantMutation();
  const deleteUser = useDeleteUserMutation();
  const failure = tenantsQuery.error ?? operatorsQuery.error ?? usersQuery.error ?? rolesQuery.error ?? userRolesQuery.error ?? userPermissionsQuery.error ?? deleteTenant.error ?? deleteUser.error;
  const requestError = failure instanceof ApiRequestError ? failure : null;
  const retry = () => void Promise.all([tenantsQuery.refetch(), operatorsQuery.refetch(), usersQuery.refetch(), rolesQuery.refetch()]);

  const confirmTenantDelete = async () => {
    if (!deletingTenant?.id) return;
    try { await deleteTenant.mutateAsync(deletingTenant.id); setDeletingTenant(undefined); setSelectedTenantId(undefined); } catch { /* Page owns safe feedback. */ }
  };
  const confirmUserDelete = async () => {
    if (!selectedTenant?.id || !deletingUser?.id) return;
    try { await deleteUser.mutateAsync({ tenantId: selectedTenant.id, userId: deletingUser.id }); setDeletingUser(undefined); } catch { /* Page owns safe feedback. */ }
  };

  return (
    <Stack gap="7">
      <PageHeading actions={canManageTenants && <Button bg="accent.solid" color="ink.onAccent" onClick={() => setIsCreateOpen(true)}><Plus size={16} />{t.team.actions.createTenant}</Button>} description={t.team.description} eyebrow={t.team.eyebrow} title={t.team.title} />
      {requestError && <ErrorState description={getApiErrorMessage(requestError)} onRetry={retry} title={t.team.loadErrorTitle} />}
      <Tabs.Root defaultValue={canManageTenants ? "tenants" : "operators"} lazyMount variant="enclosed">
        <Tabs.List bg="app.subtle" borderRadius="control" p="1">
          {canManageTenants && <Tabs.Trigger value="tenants"><Building2 size={15} />{t.team.tabs.tenants}</Tabs.Trigger>}
          {canViewOperators && <Tabs.Trigger value="operators"><UsersRound size={15} />{t.team.tabs.operators}</Tabs.Trigger>}
        </Tabs.List>
        {canManageTenants && <Tabs.Content value="tenants" pt="5">
          {tenantsQuery.isPending ? <LoadingState /> : (
            <Grid gap="5" templateColumns={{ base: "1fr", xl: "minmax(280px, 0.72fr) minmax(0, 1.6fr)" }}>
              <Panel description={t.team.tenants.description} title={t.team.tenants.title}><TenantList onCreate={() => setIsCreateOpen(true)} onDelete={setDeletingTenant} onEdit={setRenamingTenant} onSelect={(tenant) => setSelectedTenantId(tenant.id)} selectedId={selectedTenant?.id} tenants={tenants} /></Panel>
              <Panel action={selectedTenant && <Button onClick={() => setIsInviteOpen(true)} size="sm" variant="outline"><Plus size={15} />{t.team.actions.invite}</Button>} description={selectedTenant ? t.team.users.description(selectedTenant.name ?? "") : t.team.users.noTenantDescription} title={t.team.users.title}>
                {!selectedTenant ? <Box px="5" pb="5"><Text color="ink.muted" fontSize="sm">{t.team.users.noTenantDescription}</Text></Box> : usersQuery.isPending ? <Box p="5"><LoadingState /></Box> : <UserList onDelete={setDeletingUser} onEdit={setEditingUser} onInvite={() => setIsInviteOpen(true)} onPermissions={setPermissionsUser} users={usersQuery.data?.items ?? []} />}
              </Panel>
            </Grid>
          )}
        </Tabs.Content>}
        {canViewOperators && <Tabs.Content value="operators" pt="5"><Panel description={t.team.operators.description} title={t.team.operators.title}>{operatorsQuery.isPending ? <Box p="5"><LoadingState /></Box> : <OperatorList operators={operatorsQuery.data?.items ?? []} />}</Panel></Tabs.Content>}
      </Tabs.Root>
      <CreateTenantDialog onClose={() => setIsCreateOpen(false)} open={isCreateOpen} />
      <RenameTenantDialog onClose={() => setRenamingTenant(undefined)} tenant={renamingTenant} />
      <InviteMemberDialog onClose={() => setIsInviteOpen(false)} open={isInviteOpen} roles={rolesQuery.data?.items ?? []} tenantId={selectedTenant?.id} />
      {editingUser && !userRolesQuery.isPending && <UserFormDialog assignedRoles={userRolesQuery.data?.items ?? []} key={editingUser.id} onClose={() => setEditingUser(undefined)} roles={rolesQuery.data?.items ?? []} tenantId={selectedTenant?.id} user={editingUser} />}
      {permissionsUser && selectedTenant?.id && userPermissionsQuery.data && <PermissionEditorDialog data={userPermissionsQuery.data} key={permissionsUser.id} onClose={() => setPermissionsUser(undefined)} tenantId={selectedTenant.id} user={permissionsUser} />}
      <ConfirmDeleteDialog description={t.team.deleteTenant.description(deletingTenant?.name ?? "")} isPending={deleteTenant.isPending} onClose={() => setDeletingTenant(undefined)} onConfirm={() => void confirmTenantDelete()} open={Boolean(deletingTenant)} title={t.team.deleteTenant.title} />
      <ConfirmDeleteDialog description={t.team.deleteUser.description(deletingUser?.userName ?? "")} isPending={deleteUser.isPending} onClose={() => setDeletingUser(undefined)} onConfirm={() => void confirmUserDelete()} open={Boolean(deletingUser)} title={t.team.deleteUser.title} />
    </Stack>
  );
}
