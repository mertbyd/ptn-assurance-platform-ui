"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Edit3, KeyRound, Mail, MailCheck, MailPlus, RefreshCw, Search, Trash2, UserCog, Users } from "lucide-react";
import { Badge } from "@chakra-ui/react";
import { Button } from "@chakra-ui/react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@chakra-ui/react";
import { Input } from "@chakra-ui/react";
import { EmptyState } from "@/components/shared/empty-state";
import { Modal } from "@/components/shared/modal";
import { ErrorState, LoadingRows } from "@/components/shared/panel-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionTreeEditor } from "@/components/shared/permission-tree-editor";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { extractUserMessage } from "@/lib/error-messages";
import { buildPermissionRelations, initialGrants, inheritedProviders, togglePermission } from "@/lib/permissions";
import { searchable } from "@/lib/presentation";
import { INVITABLE_ROLES } from "@/lib/roles";
import { makeUserAdminClient, type UserListItem } from "@/services/user-admin.service";
import type { GetPermissionListResultDto, IdentityUserDto, IdentityUserUpdateDto } from "@/types";

interface UserFormState {
  userName: string;
  email: string;
  name: string;
  surname: string;
  phoneNumber: string;
  isActive: boolean;
  roleNames: string[];
}

interface InviteFormState {
  email: string;
  roleNames: string[];
}

const emptyForm: UserFormState = { userName: "", email: "", name: "", surname: "", phoneNumber: "", isActive: true, roleNames: [] };
const emptyInviteForm: InviteFormState = { email: "", roleNames: ["DatabaseUser"] };

export function AdminUsersWorkspace({ tenantId }: { tenantId?: string }) {
  // tenantId varsa tenant baglaminda (route-tabanli uclar), yoksa host baglaminda calisir.
  const client = useMemo(() => makeUserAdminClient(tenantId), [tenantId]);
  const loader = useCallback(async () => {
    const [users, assignableRoles] = await Promise.all([
      client.listUsers(),
      client.listAssignableRoles(),
    ]);
    return { users, assignableRoles };
  }, [client]);
  const { data, isLoading, error, reload } = useAsyncResource(loader);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IdentityUserDto | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [inviteForm, setInviteForm] = useState<InviteFormState>(emptyInviteForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Kullanici bazli izinler (ABP provider "U"): rol tabanli yetkinin yaninda dogrudan izin.
  const [permUser, setPermUser] = useState<UserListItem | null>(null);
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permData, setPermData] = useState<GetPermissionListResultDto | null>(null);
  const [permGrants, setPermGrants] = useState<Record<string, boolean>>({});
  const [permLoading, setPermLoading] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);
  const [isSavingPerm, setIsSavingPerm] = useState(false);
  const permRelations = useMemo(() => buildPermissionRelations(permData), [permData]);

  const roles = useMemo(() => data?.assignableRoles ?? [], [data]);
  const displayedRoles = useMemo(
    () => editing
      ? roles.map((role) => ({ key: role.id, name: role.name }))
      : INVITABLE_ROLES.map((roleName) => ({ key: roleName, name: roleName })),
    [editing, roles],
  );
  const filteredUsers = useMemo(() => {
    const normalized = searchable(query.trim());
    return (data?.users ?? []).filter((user) =>
      !normalized || searchable(`${user.userName} ${user.email ?? ""} ${user.name ?? ""} ${user.surname ?? ""} ${(user.roleNames ?? []).join(" ")}`).includes(normalized),
    );
  }, [data, query]);

  function openCreate() {
    setEditing(null);
    setInviteForm({ ...emptyInviteForm, roleNames: [...emptyInviteForm.roleNames] });
    setFormError(null);
    setSuccessMessage(null);
    setModalOpen(true);
  }

  async function openEdit(user: UserListItem) {
    setRowError(null);
    try {
      // Liste satiri concurrencyStamp/phoneNumber tasimaz; duzenleme icin tam kullaniciyi cekiyoruz.
      const [full, roleNames] = await Promise.all([client.getUserForEdit(user.id), client.getUserRoles(user.id)]);
      setEditing(full);
      setForm({ userName: full.userName, email: full.email, name: full.name ?? "", surname: full.surname ?? "", phoneNumber: full.phoneNumber ?? "", isActive: full.isActive, roleNames });
      setFormError(null);
      setModalOpen(true);
    } catch (caught) {
      setRowError(extractUserMessage(caught, "Kullanıcı bilgileri yüklenemedi."));
    }
  }

  function updateField<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleRole(roleName: string) {
    if (editing) {
      setForm((current) => ({ ...current, roleNames: current.roleNames.includes(roleName) ? current.roleNames.filter((name) => name !== roleName) : [...current.roleNames, roleName] }));
      return;
    }

    setInviteForm((current) => ({ ...current, roleNames: current.roleNames.includes(roleName) ? current.roleNames.filter((name) => name !== roleName) : [...current.roleNames, roleName] }));
  }

  async function save() {
    if (editing) {
      if (!form.userName.trim() || !form.email.trim()) {
        setFormError("Kullanıcı adı ve e-posta zorunludur.");
        return;
      }
    } else {
      if (!inviteForm.email.trim()) {
        setFormError("Davet e-postası zorunludur.");
        return;
      }
      if (!inviteForm.roleNames.length) {
        setFormError("DatabaseUser veya ReadOnly rollerinden en az birini seçin.");
        return;
      }
    }
    setIsSaving(true);
    setFormError(null);
    try {
      if (editing) {
        const dto: IdentityUserUpdateDto = {
          concurrencyStamp: editing.concurrencyStamp,
          userName: form.userName.trim(),
          email: form.email.trim(),
          name: form.name.trim() || null,
          surname: form.surname.trim() || null,
          phoneNumber: form.phoneNumber.trim() || null,
          isActive: form.isActive,
          lockoutEnabled: true,
          roleNames: form.roleNames,
        };
        await client.updateUser(editing.id, dto);
      } else {
        await client.invite({
          email: inviteForm.email.trim(),
          roleNames: inviteForm.roleNames,
        });
        setSuccessMessage(`${inviteForm.email.trim()} adresine davet bağlantısı gönderildi.`);
      }
      setModalOpen(false);
      await reload();
    } catch (caught) {
      setFormError(extractUserMessage(caught, editing ? "Kullanıcı kaydedilemedi." : "Davet gönderilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(user: UserListItem) {
    if (!window.confirm(`“${user.userName}” kullanıcısını silmek istiyor musunuz?`)) return;
    setRowError(null);
    try {
      await client.deleteUser(user.id);
      await reload();
    } catch (caught) {
      setRowError(extractUserMessage(caught, "Kullanıcı silinemedi."));
    }
  }

  async function openPermissions(user: UserListItem) {
    setPermUser(user);
    setPermModalOpen(true);
    setPermData(null);
    setPermError(null);
    setPermLoading(true);
    try {
      const result = await client.getUserPermissions(user.id);
      setPermData(result);
      setPermGrants(initialGrants(result));
    } catch (caught) {
      setPermError(extractUserMessage(caught, "Kullanıcı izinleri yüklenemedi."));
    } finally {
      setPermLoading(false);
    }
  }

  function togglePerm(name: string, value: boolean) {
    setPermGrants((current) => togglePermission(current, permRelations, name, value));
  }

  async function savePermissions() {
    if (!permUser || !permData) return;
    setIsSavingPerm(true);
    setPermError(null);
    try {
      // Yalnizca dogrudan kullaniciya ait (rolden miras olmayan) izinleri gonderiyoruz;
      // boylece rol kaynakli yetkilere dokunmadan kullaniciya ozel grant'lar yonetilir.
      const permissions = permData.groups.flatMap((group) =>
        group.permissions
          .filter((permission) => inheritedProviders(permission, "U").length === 0)
          .map((permission) => ({ name: permission.name, isGranted: Boolean(permGrants[permission.name]) })),
      );
      await client.updateUserPermissions(permUser.id, { permissions });
      setPermModalOpen(false);
    } catch (caught) {
      setPermError(extractUserMessage(caught, "Kullanıcı izinleri kaydedilemedi."));
    } finally {
      setIsSavingPerm(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Tenant kullanıcı yönetimi" title="Kullanıcılar" description="Üyeleri e-postayla davet edin, rollerini atayın ve erişimlerini yönetin." actions={<><Button variant="outline" onClick={() => void reload()}><RefreshCw />Yenile</Button><Button onClick={openCreate}><MailPlus />Üye davet et</Button></>} />
      {error ? <ErrorState message={error} /> : null}
      {rowError ? <ErrorState message={rowError} /> : null}
      {successMessage ? <div className="mb-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{successMessage}</div> : null}
      {isLoading || !data ? <LoadingRows /> : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/65 p-4">
            <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-3.5 size-4 text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Kullanıcı adı, e-posta veya rol ara" className="pl-10" /></div>
          </div>
          {filteredUsers.length ? (
            <div className="grid gap-3 xl:grid-cols-2">{filteredUsers.map((user) => <UserRow key={user.id} user={user} onEdit={() => void openEdit(user)} onRemove={() => void remove(user)} onPermissions={() => void openPermissions(user)} />)}</div>
          ) : <EmptyState icon={Users} title="Kullanıcı bulunamadı" description="Arama filtresini temizleyin veya ilk üyeyi davet edin." action={<Button onClick={openCreate}><MailPlus />Üye davet et</Button>} />}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Kullanıcıyı düzenle" : "Üye davet et"} description={editing ? "Kullanıcı temel bilgilerini ve rollerini güncelleyin." : "Üye e-postadaki bağlantıdan kendi parolasını belirleyerek hesabını etkinleştirir."} size="lg" footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Vazgeç</Button><Button onClick={() => void save()} disabled={isSaving}>{isSaving ? (editing ? "Kaydediliyor…" : "Davet gönderiliyor…") : (editing ? "Kaydet" : "Davet gönder")}</Button></>}>
        <div className="space-y-4">
          {formError ? <ErrorState message={formError} /> : null}
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Kullanıcı adı"><Input value={form.userName} onChange={(event) => updateField("userName", event.target.value)} autoComplete="off" /></Field>
              <Field label="E-posta"><Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="off" /></Field>
              <Field label="Ad"><Input value={form.name} onChange={(event) => updateField("name", event.target.value)} /></Field>
              <Field label="Soyad"><Input value={form.surname} onChange={(event) => updateField("surname", event.target.value)} /></Field>
              <Field label="Telefon"><Input value={form.phoneNumber} onChange={(event) => updateField("phoneNumber", event.target.value)} /></Field>
            </div>
          ) : (
            <Field label="Üyenin e-posta adresi"><Input type="email" value={inviteForm.email} onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" placeholder="uye@sirket.com" /></Field>
          )}
          <div>
            <div className="text-sm font-semibold text-slate-200">Roller</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {displayedRoles.map((role) => (
                <label key={role.key} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/25 p-3 text-sm text-slate-200"><Checkbox checked={(editing ? form.roleNames : inviteForm.roleNames).includes(role.name)} onChange={() => toggleRole(role.name)} />{role.name}</label>
              ))}
              {!displayedRoles.length ? <div className="text-sm text-slate-500">Atanabilir rol bulunamadı.</div> : null}
            </div>
            {!editing ? <p className="mt-2 text-xs text-slate-500">Güvenlik nedeniyle Admin rolü davet sırasında verilemez. Gerekirse üyelik etkinleştikten sonra kullanıcı düzenlenerek atanabilir.</p> : null}
          </div>
          {editing ? <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-700/70 bg-slate-950/25 p-4"><span className="text-sm font-semibold text-slate-200">Kullanıcı aktif</span><input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} className="size-5 accent-sky-400" /></label> : null}
        </div>
      </Modal>

      <Modal
        open={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        title={permUser ? `${permUser.userName} · izinler` : "Kullanıcı izinleri"}
        description="Rol tabanlı yetkilerin yanında bu kullanıcıya doğrudan izin verin. Bir rolden gelen izinler kilitlidir; onlar ilgili rol üzerinden yönetilir."
        size="lg"
        footer={<><Button variant="ghost" onClick={() => setPermModalOpen(false)}>Kapat</Button><Button onClick={() => void savePermissions()} disabled={isSavingPerm || permLoading || !permData}><KeyRound />{isSavingPerm ? "Kaydediliyor…" : "İzinleri kaydet"}</Button></>}
      >
        {permError ? <ErrorState message={permError} /> : null}
        {permLoading || !permData ? <LoadingRows /> : (
          <PermissionTreeEditor data={permData} grants={permGrants} providerName="U" onToggle={togglePerm} />
        )}
      </Modal>
    </div>
  );
}

function UserRow({ user, onEdit, onRemove, onPermissions }: { user: UserListItem; onEdit: () => void; onRemove: () => void; onPermissions: () => void }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300"><UserCog className="size-5" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><span className="truncate font-semibold text-slate-100">{user.userName}</span><Badge variant={user.isActive ? "success" : "warning"}>{user.isActive ? "Aktif" : "Pasif"}</Badge>{user.emailConfirmed ? <Badge variant="neutral" className="gap-1"><MailCheck className="size-3" />Doğrulanmış</Badge> : <Badge variant="warning" className="gap-1"><Mail className="size-3" />Doğrulanmamış</Badge>}</div>
            <div className="mt-1 truncate text-sm text-slate-500">{user.email}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">{Array.isArray(user.roleNames) ? (user.roleNames.length ? user.roleNames.map((role) => <Badge key={role} variant="neutral">{role}</Badge>) : <span className="text-xs text-slate-600">Rol atanmamış</span>) : <span className="text-xs text-slate-600">Roller düzenleme sırasında yüklenir</span>}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onPermissions} aria-label="Kullanıcı izinleri" title="Kullanıcı izinleri"><KeyRound /></Button>
          <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Kullanıcıyı düzenle"><Edit3 /></Button>
          <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Kullanıcıyı sil"><Trash2 /></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="text-sm font-semibold text-slate-200">{label}</span><span className="mt-2 block">{children}</span></label>;
}
