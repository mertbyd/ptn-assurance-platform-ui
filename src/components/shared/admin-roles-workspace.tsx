"use client";

import { useCallback, useMemo, useState } from "react";
import { Edit3, Plus, RefreshCw, Save, ShieldCheck, Trash2, Users } from "lucide-react";
import { Badge } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@chakra-ui/react";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionTreeEditor } from "@/components/shared/permission-tree-editor";
import { cn, mapPool } from "@/lib/utils";
import { extractUserMessage } from "@/lib/error-messages";
import { buildPermissionRelations, initialGrants, togglePermission, type PermissionRelations } from "@/lib/permissions";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { identityRolesService, identityUsersService } from "@/services/identity.service";
import { permissionsService } from "@/services/permissions.service";
import type { GetPermissionListResultDto, IdentityRoleDto } from "@/types";

interface RoleFormState {
  name: string;
  isDefault: boolean;
  isPublic: boolean;
}

const emptyRoleForm: RoleFormState = { name: "", isDefault: false, isPublic: true };

// Rol -> uye kullanici adlari. ABP'de "rolde kac kisi var" icin dogrudan bir uc
// olmadigindan, kullanicilar + her birinin rolleri cekilip rol adina gore sayilir.
async function loadRoleMembers(): Promise<Record<string, string[]>> {
  const users = await identityUsersService.getList({ maxResultCount: 1000, sorting: "userName" });
  const perUser = await mapPool(users.items, 8, async (user) => ({
    userName: user.userName,
    roleNames: (await identityUsersService.getRoles(user.id)).items.map((role) => role.name),
  }));
  const membersByRole: Record<string, string[]> = {};
  perUser.forEach(({ userName, roleNames }) => {
    roleNames.forEach((roleName) => {
      (membersByRole[roleName] ??= []).push(userName);
    });
  });
  return membersByRole;
}

export function AdminRolesWorkspace() {
  const loader = useCallback(() => identityRolesService.getList(), []);
  const { data, isLoading, error, reload } = useAsyncResource(loader);

  const membersLoader = useCallback(() => loadRoleMembers(), []);
  const { data: memberMap, isLoading: membersLoading, error: membersError, reload: reloadMembers } = useAsyncResource(membersLoader);

  const [selectedRole, setSelectedRole] = useState<IdentityRoleDto | null>(null);
  const [permData, setPermData] = useState<GetPermissionListResultDto | null>(null);
  const [grants, setGrants] = useState<Record<string, boolean>>({});
  const [permLoading, setPermLoading] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [isSavingPerm, setIsSavingPerm] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<IdentityRoleDto | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormState>(emptyRoleForm);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);

  const roles = useMemo(() => data?.items ?? [], [data]);
  const relations = useMemo<PermissionRelations>(() => buildPermissionRelations(permData), [permData]);
  const selectedMembers = useMemo(
    () => (selectedRole ? memberMap?.[selectedRole.name] ?? [] : []),
    [memberMap, selectedRole],
  );

  function refreshAll() {
    void reload();
    void reloadMembers();
  }

  async function selectRole(role: IdentityRoleDto) {
    setSelectedRole(role);
    setPermLoading(true);
    setPermError(null);
    setPermData(null);
    try {
      const result = await permissionsService.getForRole(role.name);
      setPermData(result);
      setGrants(initialGrants(result));
    } catch (caught) {
      setPermError(extractUserMessage(caught, "İzinler yüklenemedi."));
    } finally {
      setPermLoading(false);
    }
  }

  function handleToggle(name: string, value: boolean) {
    setGrants((current) => togglePermission(current, relations, name, value));
  }

  async function savePermissions() {
    if (!selectedRole || !permData) return;
    setIsSavingPerm(true);
    setPermError(null);
    try {
      const permissions = permData.groups.flatMap((group) => group.permissions.map((permission) => ({ name: permission.name, isGranted: Boolean(grants[permission.name]) })));
      await permissionsService.updateForRole(selectedRole.name, { permissions });
      await selectRole(selectedRole);
    } catch (caught) {
      setPermError(extractUserMessage(caught, "İzinler kaydedilemedi."));
    } finally {
      setIsSavingPerm(false);
    }
  }

  function openCreateRole() {
    setEditingRole(null);
    setRoleForm({ ...emptyRoleForm });
    setRoleError(null);
    setModalOpen(true);
  }

  function openEditRole(role: IdentityRoleDto) {
    setEditingRole(role);
    setRoleForm({ name: role.name, isDefault: role.isDefault, isPublic: role.isPublic });
    setRoleError(null);
    setModalOpen(true);
  }

  async function saveRole() {
    if (!roleForm.name.trim()) {
      setRoleError("Rol adı zorunludur.");
      return;
    }
    setIsSavingRole(true);
    setRoleError(null);
    try {
      if (editingRole) await identityRolesService.update(editingRole.id, { ...roleForm, concurrencyStamp: editingRole.concurrencyStamp });
      else await identityRolesService.create(roleForm);
      setModalOpen(false);
      await reload();
    } catch (caught) {
      setRoleError(extractUserMessage(caught, "Rol kaydedilemedi."));
    } finally {
      setIsSavingRole(false);
    }
  }

  async function removeRole(role: IdentityRoleDto) {
    if (!window.confirm(`“${role.name}” rolünü silmek istiyor musunuz?`)) return;
    try {
      await identityRolesService.remove(role.id);
      if (selectedRole?.id === role.id) {
        setSelectedRole(null);
        setPermData(null);
      }
      refreshAll();
    } catch (caught) {
      setPermError(extractUserMessage(caught, "Rol silinemedi."));
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Rol ve izin yönetimi" title="Roller ve İzinler" description="Tenant rollerini yönetin, her role hangi permission’ların verildiğini belirleyin ve rollerdeki kullanıcı sayısını görün." actions={<><Button variant="outline" onClick={refreshAll}><RefreshCw />Yenile</Button><Button onClick={openCreateRole}><Plus />Yeni rol</Button></>} />
      {error ? <ErrorState message={error} /> : null}
      {isLoading || !data ? <LoadingRows /> : (
        <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card className="h-fit">
            <CardHeader><CardTitle>Roller</CardTitle><p className="mt-1 text-sm text-slate-500">{roles.length} rol</p></CardHeader>
            <CardContent className="space-y-2">
              {roles.map((role) => {
                const memberCount = memberMap?.[role.name]?.length ?? 0;
                return (
                  <div key={role.id} className={cn("flex items-center justify-between gap-2 rounded-xl border p-3 transition-colors", selectedRole?.id === role.id ? "border-sky-400/35 bg-sky-400/[0.07]" : "border-slate-700/70 bg-slate-950/25 hover:bg-slate-800/45")}>
                    <button type="button" onClick={() => void selectRole(role)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <ShieldCheck className={cn("size-4 shrink-0", selectedRole?.id === role.id ? "text-sky-300" : "text-slate-500")} />
                      <span className="min-w-0"><span className="block truncate font-semibold text-slate-100">{role.name}</span><span className="mt-0.5 flex flex-wrap items-center gap-1">{role.isStatic ? <Badge variant="neutral">Sabit</Badge> : null}{role.isDefault ? <Badge variant="neutral">Varsayılan</Badge> : null}<MemberBadge count={memberCount} loading={membersLoading} unavailable={Boolean(membersError)} /></span></span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditRole(role)} aria-label="Rolü düzenle"><Edit3 /></Button>
                      {!role.isStatic ? <Button variant="ghost" size="icon" onClick={() => void removeRole(role)} aria-label="Rolü sil"><Trash2 /></Button> : null}
                    </div>
                  </div>
                );
              })}
              {!roles.length ? <EmptyState icon={ShieldCheck} title="Rol yok" description="İlk rolü oluşturun." /> : null}
            </CardContent>
          </Card>

          <Card className="min-h-[300px]">
            {!selectedRole ? (
              <CardContent className="flex h-full items-center justify-center py-16"><EmptyState icon={ShieldCheck} title="Bir rol seçin" description="Soldan bir rol seçerek izinlerini görüntüleyin ve düzenleyin." /></CardContent>
            ) : (
              <>
                <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><CardTitle>{selectedRole.name} · izinler</CardTitle><p className="mt-1 text-sm text-slate-500">{permData?.entityDisplayName ?? "İzin grupları"}</p></div>
                  <Button onClick={() => void savePermissions()} disabled={isSavingPerm || permLoading || !permData}><Save />{isSavingPerm ? "Kaydediliyor…" : "İzinleri kaydet"}</Button>
                </CardHeader>
                <CardContent>
                  <RoleMembers members={selectedMembers} loading={membersLoading} unavailable={Boolean(membersError)} />
                  {permError ? <ErrorState message={permError} /> : null}
                  {permLoading || !permData ? <LoadingRows /> : (
                    <PermissionTreeEditor data={permData} grants={grants} providerName="R" onToggle={handleToggle} />
                  )}
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingRole ? "Rolü düzenle" : "Yeni rol"} size="md" footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Vazgeç</Button><Button onClick={() => void saveRole()} disabled={isSavingRole}>{isSavingRole ? "Kaydediliyor…" : "Kaydet"}</Button></>}>
        <div className="space-y-4">
          {roleError ? <ErrorState message={roleError} /> : null}
          <label className="block"><span className="text-sm font-semibold text-slate-200">Rol adı</span><Input className="mt-2" value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))} disabled={Boolean(editingRole?.isStatic)} /></label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-700/70 bg-slate-950/25 p-3.5"><span><span className="block text-sm font-semibold text-slate-200">Varsayılan rol</span><span className="mt-0.5 block text-xs text-slate-500">Yeni kullanıcılara otomatik atanır.</span></span><input type="checkbox" checked={roleForm.isDefault} onChange={(event) => setRoleForm((current) => ({ ...current, isDefault: event.target.checked }))} className="size-5 accent-sky-400" /></label>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-700/70 bg-slate-950/25 p-3.5"><span><span className="block text-sm font-semibold text-slate-200">Herkese açık</span><span className="mt-0.5 block text-xs text-slate-500">Rol listelerinde görünür.</span></span><input type="checkbox" checked={roleForm.isPublic} onChange={(event) => setRoleForm((current) => ({ ...current, isPublic: event.target.checked }))} className="size-5 accent-sky-400" /></label>
        </div>
      </Modal>
    </div>
  );
}

function MemberBadge({ count, loading, unavailable }: { count: number; loading: boolean; unavailable: boolean }) {
  if (loading) return <Badge variant="neutral" className="gap-1 opacity-60"><Users className="size-3" />…</Badge>;
  if (unavailable) return <Badge variant="neutral" className="gap-1 opacity-70" title="Kullanıcı sayısı alınamadı."><Users className="size-3" />—</Badge>;
  return <Badge variant={count ? "default" : "neutral"} className="gap-1"><Users className="size-3" />{count} kişi</Badge>;
}

function RoleMembers({ members, loading, unavailable }: { members: string[]; loading: boolean; unavailable: boolean }) {
  return (
    <div className="mb-4 rounded-xl border border-slate-700/70 bg-slate-950/25 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Users className="size-4 text-slate-400" />
        {loading ? "Kullanıcılar yükleniyor…" : unavailable ? "Kullanıcı listesi alınamadı" : `Bu rolde ${members.length} kullanıcı`}
      </div>
      {!loading && !unavailable && members.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {members.map((userName) => <Badge key={userName} variant="neutral">{userName}</Badge>)}
        </div>
      ) : null}
      {!loading && !unavailable && !members.length ? <p className="mt-1 text-xs text-slate-500">Bu role atanmış kullanıcı yok.</p> : null}
    </div>
  );
}
