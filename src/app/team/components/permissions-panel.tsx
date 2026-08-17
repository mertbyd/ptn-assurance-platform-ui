"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@/api/team.api";
import { queryKeys } from "@/api/query-keys";

export function TabPermissions({ canManage }: { canManage: boolean }) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.team.roles(),
    queryFn: () => teamApi.listAssignableRoles(),
  });
  const permissions = useQuery({
    queryKey: ["team", "role-permissions", selectedRole],
    queryFn: () => teamApi.rolePermissions(selectedRole!),
    enabled: Boolean(selectedRole),
  });
  const updatePermission = useMutation({
    mutationFn: ({ name, isGranted }: { name: string; isGranted: boolean }) =>
      teamApi.updateRolePermissions(selectedRole!, { permissions: [{ name, isGranted }] }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["team", "role-permissions", selectedRole] }),
  });

  const items = data?.items ?? [];
  const filtered = items.filter((r) =>
    (r.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em" }}>
          Rol ve İzinler
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          Sistemdeki rolleri ve atanmış yetkileri görüntüleyin{canManage ? " ve düzenleyin" : ""}.
        </p>
      </div>

      <div style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rol adı ara…"
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none",
            }}
          />
        </div>

        {isLoading && (
          <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            Yükleniyor…
          </div>
        )}

        {error && (
          <div style={{ padding: "24px", textAlign: "center", color: "#f87171", fontSize: 13 }}>
            Roller alınamadı. Backend bağlantısını kontrol edin.
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            Rol bulunamadı.
          </div>
        )}

        {filtered.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Rol Adı", "Tür", "Erişim"].map((h) => (
                  <th key={h} style={{
                    padding: "9px 16px", textAlign: "left",
                    fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((role, i) => (
                <tr key={role.name} onClick={() => role.name && setSelectedRole(role.name)} style={{ cursor: "pointer", borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", background: selectedRole === role.name ? "rgba(139,92,246,0.08)" : undefined }}>
                  <td style={{ padding: "10px 16px", color: "#eaedf4", fontWeight: 600 }}>{role.name}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      background: role.isStatic ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.05)",
                      color: role.isStatic ? "#eab308" : "rgba(255,255,255,0.5)",
                    }}>
                      {role.isStatic ? "Sabit" : "Özel"}
                    </span>
                    {role.isDefault && (
                      <span style={{
                        marginLeft: 6, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: "rgba(74,222,128,0.1)", color: "#4ade80",
                      }}>Varsayılan</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.5)" }}>
                    {role.isPublic ? "Herkese Açık" : "Özel"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedRole && (
        <div style={{ marginTop: 14, background: "#131620", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#eaedf4" }}>{selectedRole} izinleri</h3>
          {permissions.isLoading && <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>İzinler yükleniyor…</p>}
          {permissions.data?.groups?.map((group) => (
            <div key={group.name} style={{ marginBottom: 14 }}>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>{group.displayName || group.name}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 6 }}>
                {group.permissions?.map((permission) => (
                  <label key={permission.name} style={{ display: "flex", gap: 8, alignItems: "center", color: permission.isEditable === false ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.62)", fontSize: 12 }}>
                    <input type="checkbox" checked={Boolean(permission.isGranted)} disabled={!canManage || permission.isEditable === false || updatePermission.isPending}
                      onChange={(event) => permission.name && updatePermission.mutate({ name: permission.name, isGranted: event.target.checked })} />
                    {permission.displayName || permission.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
