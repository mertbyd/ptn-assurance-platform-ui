"use client";

import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IdentityRoleDto, IdentityUserDto, PermissionGrantInfoDto, PermissionListDto } from "@/api/team.api";
import { teamApi } from "@/api/team.api";
import { queryKeys } from "@/api/query-keys";
import { useAuthStore } from "@/stores/auth-store";

const PAGE = 20;
const fieldStyle = { height: 34, borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#131620", color: "#eaedf4", padding: "0 12px", outline: "none" } as const;

interface UserAccess {
  delete: boolean;
  invite: boolean;
  managePermissions: boolean;
  update: boolean;
  view: boolean;
}

export function TabUsers({ access }: { access: UserAccess }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [roleNames, setRoleNames] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<IdentityUserDto | null>(null);
  const [permissionUser, setPermissionUser] = useState<IdentityUserDto | null>(null);
  const [deletingUser, setDeletingUser] = useState<IdentityUserDto | null>(null);
  const tenantId = useAuthStore((state) => state.session?.tenantId);
  const queryClient = useQueryClient();

  const users = useQuery({
    queryKey: [...queryKeys.team.operators(), page],
    queryFn: () => teamApi.listOperators(page * PAGE, PAGE),
    enabled: access.view,
  });
  const roles = useQuery({
    queryKey: queryKeys.team.roles(),
    queryFn: () => teamApi.listAssignableRoles(),
    enabled: access.invite || access.update,
  });
  const assignedRoles = useQuery({
    queryKey: queryKeys.team.roles(tenantId ?? "host", editingUser?.id ?? "none"),
    queryFn: () => teamApi.userRoles(tenantId ?? "", editingUser!.id!),
    enabled: Boolean(editingUser?.id && access.update),
  });
  const userPermissions = useQuery({
    queryKey: queryKeys.team.permissions(tenantId ?? "host", permissionUser?.id ?? "none"),
    queryFn: () => teamApi.userPermissions(tenantId ?? undefined, permissionUser!.id!),
    enabled: Boolean(permissionUser?.id && access.managePermissions),
  });

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: queryKeys.team.operators() });
  const invite = useMutation({
    mutationFn: () => teamApi.inviteUser(tenantId ?? "", {
      email: email.trim(),
      userName: userName.trim() || undefined,
      roleNames,
    }),
    onSuccess: () => {
      setEmail("");
      setUserName("");
      setRoleNames([]);
      setShowInvite(false);
      void refreshUsers();
    },
  });
  const remove = useMutation({
    mutationFn: (userId: string) => teamApi.deleteUser(tenantId ?? "", userId),
    onSuccess: () => {
      setDeletingUser(null);
      void refreshUsers();
    },
  });

  const items = users.data?.items ?? [];
  const total = users.data?.totalCount ?? 0;
  const pageCount = Math.ceil(total / PAGE);
  const filtered = items.filter((item) =>
    (item.userName ?? "").toLowerCase().includes(search.toLowerCase())
    || (item.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em" }}>Kullanıcılar</h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{total > 0 ? `${total} kullanıcı` : "Platform kullanıcılarını yönetin."}</p>
        </div>
        {access.invite && <button disabled={!tenantId} title={!tenantId ? "Davet için tenant bağlamıyla giriş yapın" : undefined} onClick={() => setShowInvite((value) => !value)} style={{
          all: "unset", cursor: tenantId ? "pointer" : "not-allowed", padding: "0 14px", height: 32, borderRadius: 7,
          background: "#8b5cf6", color: "#fff", fontSize: 12.5, fontWeight: 640, display: "inline-flex", alignItems: "center", gap: 6,
          opacity: tenantId ? 1 : 0.45,
        }}>+ Davet Et</button>}
      </div>

      {showInvite && tenantId && (
        <form onSubmit={(event) => { event.preventDefault(); if (email.trim()) invite.mutate(); }} style={{ padding: 14, marginBottom: 14, border: "1px solid rgba(139,92,246,.22)", borderRadius: 10, background: "rgba(139,92,246,.045)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(180px,1.2fr) minmax(160px,1fr) auto", gap: 8 }}>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta" style={fieldStyle} />
            <input value={userName} onChange={(event) => setUserName(event.target.value)} placeholder="Kullanıcı adı (opsiyonel)" style={fieldStyle} />
            <button disabled={invite.isPending} style={{ border: 0, borderRadius: 7, padding: "0 16px", background: "#8b5cf6", color: "white", fontWeight: 650, cursor: "pointer" }}>{invite.isPending ? "Gönderiliyor…" : "Davet gönder"}</button>
          </div>
          <RoleChecklist roles={roles.data?.items ?? []} value={roleNames} onChange={setRoleNames} />
          {invite.error && <p style={{ margin: "10px 0 0", color: "#f87171", fontSize: 12 }}>Davet gönderilemedi. Adres, tenant bağlamı ve yetkinizi kontrol edin.</p>}
        </form>
      )}
      {access.invite && !tenantId && <p style={{ margin: "-8px 0 14px", color: "rgba(245,158,11,0.8)", fontSize: 12 }}>Kullanıcı daveti için tenant bağlamıyla giriş yapın.</p>}

      <div style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kullanıcı adı veya e-posta ara…" style={{ flex: 1, background: "transparent", border: "none", color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        </div>

        {users.isLoading && <EmptyText>Yükleniyor…</EmptyText>}
        {users.error && <EmptyText color="#f87171">Kullanıcılar alınamadı.</EmptyText>}
        {!users.isLoading && !users.error && filtered.length === 0 && <EmptyText>Kullanıcı bulunamadı.</EmptyText>}

        {filtered.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {["Kullanıcı", "E-posta", "Durum", "İşlemler"].map((heading, index) => <th key={heading} style={{ padding: "9px 16px", textAlign: index === 3 ? "right" : "left", fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>{heading}</th>)}
            </tr></thead>
            <tbody>{filtered.map((item, index) => (
              <tr key={item.id} style={{ borderBottom: index < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <td style={{ padding: "10px 16px", color: "#eaedf4", fontWeight: 600 }}>{item.userName}<small style={{ display: "block", marginTop: 2, color: "rgba(255,255,255,.32)", fontWeight: 400 }}>{[item.name, item.surname].filter(Boolean).join(" ") || "—"}</small></td>
                <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.55)", fontFamily: "monospace", fontSize: 12 }}>{item.email}</td>
                <td style={{ padding: "10px 16px", color: item.isActive ? "#4ade80" : "#f59e0b" }}>{item.isActive ? "Aktif" : "Pasif"}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                  {access.managePermissions && <ActionButton onClick={() => setPermissionUser(item)}>İzinler</ActionButton>}
                  {access.update && <ActionButton onClick={() => setEditingUser(item)}>Düzenle</ActionButton>}
                  {access.delete && <ActionButton danger onClick={() => setDeletingUser(item)}>Sil</ActionButton>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}

        {pageCount > 1 && <Pager page={page} pageCount={pageCount} total={total} onPage={setPage} />}
      </div>

      {editingUser && assignedRoles.data && (
        <UserEditor assignedRoles={assignedRoles.data.items ?? []} key={editingUser.id} onClose={() => setEditingUser(null)} onSaved={() => { setEditingUser(null); void refreshUsers(); }} roles={roles.data?.items ?? []} tenantId={tenantId ?? ""} user={editingUser} />
      )}
      {editingUser && assignedRoles.isLoading && <OverlayCard title="Kullanıcı rolleri yükleniyor…" onClose={() => setEditingUser(null)} />}
      {permissionUser && userPermissions.data && (
        <UserPermissionEditor data={userPermissions.data} key={permissionUser.id} onClose={() => setPermissionUser(null)} tenantId={tenantId ?? undefined} user={permissionUser} />
      )}
      {permissionUser && userPermissions.isLoading && <OverlayCard title="Kullanıcı izinleri yükleniyor…" onClose={() => setPermissionUser(null)} />}
      {deletingUser && (
        <OverlayCard title={`${deletingUser.userName ?? "Kullanıcı"} silinsin mi?`} onClose={() => setDeletingUser(null)}>
          <p style={{ color: "rgba(255,255,255,.48)", fontSize: 12, lineHeight: 1.6 }}>Bu işlem Identity kullanıcısını siler. Devam etmeden önce üyelik ve sahiplik etkisini kontrol edin.</p>
          {remove.error && <p style={{ color: "#f87171", fontSize: 12 }}>Kullanıcı silinemedi.</p>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}><DialogButton onClick={() => setDeletingUser(null)}>Vazgeç</DialogButton><DialogButton danger disabled={remove.isPending} onClick={() => deletingUser.id && remove.mutate(deletingUser.id)}>{remove.isPending ? "Siliniyor…" : "Sil"}</DialogButton></div>
        </OverlayCard>
      )}
    </div>
  );
}

function RoleChecklist({ roles, value, onChange }: { roles: IdentityRoleDto[]; value: string[]; onChange: (next: string[]) => void }) {
  if (!roles.length) return <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,.34)", fontSize: 11 }}>Atanabilir rol bulunamadı.</p>;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 11 }}>{roles.map((role) => role.name && (
    <label key={role.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,.62)", fontSize: 11 }}>
      <input type="checkbox" checked={value.includes(role.name)} onChange={(event) => onChange(event.target.checked ? [...value, role.name!] : value.filter((name) => name !== role.name))} />{role.name}
    </label>
  ))}</div>;
}

function UserEditor({ assignedRoles, onClose, onSaved, roles, tenantId, user }: { assignedRoles: IdentityRoleDto[]; onClose: () => void; onSaved: () => void; roles: IdentityRoleDto[]; tenantId: string; user: IdentityUserDto }) {
  const [draft, setDraft] = useState({
    email: user.email ?? "", isActive: user.isActive ?? true, lockoutEnabled: user.lockoutEnabled ?? true,
    name: user.name ?? "", phoneNumber: user.phoneNumber ?? "", roleNames: assignedRoles.flatMap((role) => role.name ? [role.name] : []),
    surname: user.surname ?? "", userName: user.userName ?? "",
  });
  const update = useMutation({
    mutationFn: () => teamApi.updateUser(tenantId, user.id!, {
      concurrencyStamp: user.concurrencyStamp, email: draft.email.trim(), isActive: draft.isActive,
      lockoutEnabled: draft.lockoutEnabled, name: draft.name.trim() || null, phoneNumber: draft.phoneNumber.trim() || null,
      roleNames: draft.roleNames, surname: draft.surname.trim() || null, userName: draft.userName.trim(),
    }),
    onSuccess: onSaved,
  });
  return <OverlayCard title="Kullanıcıyı düzenle" onClose={onClose}>
    <form onSubmit={(event) => { event.preventDefault(); if (draft.email.trim() && draft.userName.trim()) update.mutate(); }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <input required value={draft.userName} onChange={(event) => setDraft((current) => ({ ...current, userName: event.target.value }))} placeholder="Kullanıcı adı" style={fieldStyle} />
        <input required type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} placeholder="E-posta" style={fieldStyle} />
        <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ad" style={fieldStyle} />
        <input value={draft.surname} onChange={(event) => setDraft((current) => ({ ...current, surname: event.target.value }))} placeholder="Soyad" style={fieldStyle} />
        <input value={draft.phoneNumber} onChange={(event) => setDraft((current) => ({ ...current, phoneNumber: event.target.value }))} placeholder="Telefon" style={fieldStyle} />
      </div>
      <RoleChecklist roles={roles} value={draft.roleNames} onChange={(nextRoleNames) => setDraft((current) => ({ ...current, roleNames: nextRoleNames }))} />
      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <label style={{ color: "rgba(255,255,255,.62)", fontSize: 11 }}><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} /> Aktif</label>
        <label style={{ color: "rgba(255,255,255,.62)", fontSize: 11 }}><input type="checkbox" checked={draft.lockoutEnabled} onChange={(event) => setDraft((current) => ({ ...current, lockoutEnabled: event.target.checked }))} /> Kilitleme etkin</label>
      </div>
      {update.error && <p style={{ color: "#f87171", fontSize: 12 }}>Kullanıcı güncellenemedi. Alanları ve yetkinizi kontrol edin.</p>}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}><DialogButton onClick={onClose}>Vazgeç</DialogButton><DialogButton primary disabled={update.isPending} type="submit">{update.isPending ? "Kaydediliyor…" : "Kaydet"}</DialogButton></div>
    </form>
  </OverlayCard>;
}

function UserPermissionEditor({ data, onClose, tenantId, user }: { data: PermissionListDto; onClose: () => void; tenantId?: string; user: IdentityUserDto }) {
  const permissions = (data.groups ?? []).flatMap((group) => group.permissions ?? []);
  const [grants, setGrants] = useState<Record<string, boolean>>(() => Object.fromEntries(permissions.flatMap((permission) => permission.name ? [[permission.name, Boolean(permission.isGranted)]] : [])));
  const update = useMutation({
    mutationFn: () => teamApi.updateUserPermissions(tenantId, user.id!, { permissions: permissions.flatMap((permission) => permission.name && permission.isEditable ? [{ name: permission.name, isGranted: grants[permission.name] ?? false }] : []) }),
    onSuccess: onClose,
  });
  return <OverlayCard title={`${user.userName ?? "Kullanıcı"} izinleri`} onClose={onClose} wide>
    <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>{(data.groups ?? []).map((group) => (
      <section key={group.name} style={{ marginBottom: 16 }}><h4 style={{ margin: "0 0 7px", color: "#d9deeb", fontSize: 12 }}>{group.displayName ?? group.name}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 6 }}>{(group.permissions ?? []).map((permission) => permission.name && (
          <label key={permission.name} style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", paddingLeft: permission.parentName ? 22 : 9, borderRadius: 7, background: "rgba(255,255,255,.03)", color: permission.isEditable ? "rgba(255,255,255,.62)" : "rgba(255,255,255,.25)", fontSize: 11 }}>
            <input type="checkbox" checked={grants[permission.name] ?? false} disabled={!permission.isEditable} onChange={(event) => setGrants((current) => updateGrantTree(current, permissions, permission.name!, event.target.checked))} />{permission.displayName ?? permission.name}
          </label>
        ))}</div>
      </section>
    ))}</div>
    {update.error && <p style={{ color: "#f87171", fontSize: 12 }}>İzinler kaydedilemedi.</p>}
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}><DialogButton onClick={onClose}>Vazgeç</DialogButton><DialogButton primary disabled={update.isPending} onClick={() => update.mutate()}>{update.isPending ? "Kaydediliyor…" : "İzinleri kaydet"}</DialogButton></div>
  </OverlayCard>;
}

function updateGrantTree(current: Record<string, boolean>, permissions: PermissionGrantInfoDto[], name: string, checked: boolean) {
  const next = { ...current, [name]: checked };
  if (checked) {
    let parent = permissions.find((permission) => permission.name === name)?.parentName;
    while (parent) { next[parent] = true; parent = permissions.find((permission) => permission.name === parent)?.parentName; }
  } else {
    const queue = [name];
    while (queue.length) {
      const parent = queue.shift();
      permissions.filter((permission) => permission.parentName === parent).forEach((child) => { if (child.name) { next[child.name] = false; queue.push(child.name); } });
    }
  }
  return next;
}

function OverlayCard({ children, onClose, title, wide = false }: { children?: ReactNode; onClose: () => void; title: string; wide?: boolean }) {
  return <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 9200, display: "grid", placeItems: "center", padding: 20, background: "rgba(4,5,9,.72)", backdropFilter: "blur(5px)" }}>
    <div style={{ width: wide ? "min(900px,95vw)" : "min(620px,95vw)", maxHeight: "90vh", overflow: "auto", padding: 18, border: "1px solid rgba(139,92,246,.3)", borderRadius: 13, background: "#11141d", boxShadow: "0 26px 80px rgba(0,0,0,.6)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}><h3 style={{ margin: 0, color: "#edf0f7", fontSize: 15 }}>{title}</h3><button aria-label="Kapat" onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,.45)", fontSize: 21 }}>×</button></div>{children}
    </div>
  </div>;
}

function DialogButton({ children, danger, disabled, onClick, primary, type = "button" }: { children: ReactNode; danger?: boolean; disabled?: boolean; onClick?: () => void; primary?: boolean; type?: "button" | "submit" }) {
  return <button type={type} disabled={disabled} onClick={onClick} style={{ border: `1px solid ${danger ? "rgba(248,113,113,.35)" : primary ? "rgba(139,92,246,.65)" : "rgba(255,255,255,.12)"}`, borderRadius: 7, padding: "8px 13px", background: danger ? "rgba(248,113,113,.1)" : primary ? "#8b5cf6" : "rgba(255,255,255,.04)", color: danger ? "#fca5a5" : "#fff", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1, fontWeight: 650 }}>{children}</button>;
}

function ActionButton({ children, danger, onClick }: { children: ReactNode; danger?: boolean; onClick: () => void }) {
  return <button onClick={onClick} style={{ all: "unset", cursor: "pointer", padding: "4px 7px", color: danger ? "#f87171" : "rgba(255,255,255,.6)", fontSize: 11.5, fontWeight: 650 }}>{children}</button>;
}

function EmptyText({ children, color = "rgba(255,255,255,0.3)" }: { children: ReactNode; color?: string }) {
  return <div style={{ padding: 32, textAlign: "center", color, fontSize: 13 }}>{children}</div>;
}

function Pager({ onPage, page, pageCount, total }: { onPage: (page: number) => void; page: number; pageCount: number; total: number }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{total} kayıt · Sayfa {page + 1}/{pageCount}</span>
    <div style={{ display: "flex", gap: 6 }}><DialogButton disabled={page === 0} onClick={() => onPage(page - 1)}>← Önceki</DialogButton><DialogButton disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)}>Sonraki →</DialogButton></div>
  </div>;
}
