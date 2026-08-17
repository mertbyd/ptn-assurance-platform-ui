"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamApi } from "@/api/team.api";
import { queryKeys } from "@/api/query-keys";

const PAGE = 20;

interface TenantAccess {
  create: boolean;
  passivate: boolean;
  reactivate: boolean;
  read: boolean;
  rename: boolean;
}

export function TabTenants({ access }: { access: TenantAccess }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [newTenantName, setNewTenantName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.team.tenants(page * PAGE, PAGE),
    queryFn: () => teamApi.listTenants(page * PAGE, PAGE),
    enabled: access.read,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["team", "tenants"] });
  const create = useMutation({
    mutationFn: () => teamApi.createTenant({ name: newTenantName.trim() }),
    onSuccess: () => { setNewTenantName(""); setShowCreate(false); void refresh(); },
  });
  const setActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      active ? teamApi.reactivateTenant(id) : teamApi.passivateTenant(id),
    onSuccess: () => void refresh(),
  });
  const rename = useMutation({
    mutationFn: () => teamApi.updateTenant(renaming!.id, { name: renameName.trim() }),
    onSuccess: () => {
      setRenaming(null);
      setRenameName("");
      void refresh();
    },
  });

  const items = data?.items ?? [];
  const total = data?.totalCount ?? 0;
  const pageCount = Math.ceil(total / PAGE);
  const filtered = items.filter((x) =>
    (x.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em" }}>
            Organizasyonlar
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            {total > 0 ? `${total} tenant` : "Sistemdeki izole kiracıları yönetin."}
          </p>
        </div>
        {access.create && <button onClick={() => setShowCreate((value) => !value)} style={{
          all: "unset", cursor: "pointer",
          padding: "0 14px", height: 32, borderRadius: 7,
          background: "#8b5cf6", color: "#fff", fontSize: 12.5, fontWeight: 640,
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>+ Yeni Tenant</button>}
      </div>

      {showCreate && (
        <form onSubmit={(event) => { event.preventDefault(); if (newTenantName.trim()) create.mutate(); }} style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input value={newTenantName} onChange={(event) => setNewTenantName(event.target.value)} autoFocus placeholder="Tenant adı"
            style={{ flex: 1, height: 34, borderRadius: 7, border: "1px solid rgba(255,255,255,0.12)", background: "#131620", color: "#eaedf4", padding: "0 12px", outline: "none" }} />
          <button disabled={!newTenantName.trim() || create.isPending} style={{ border: 0, borderRadius: 7, padding: "0 16px", background: "#8b5cf6", color: "white", fontWeight: 650, cursor: "pointer" }}>
            {create.isPending ? "Oluşturuluyor…" : "Oluştur"}
          </button>
        </form>
      )}

      {renaming && (
        <form onSubmit={(event) => { event.preventDefault(); if (renameName.trim()) rename.mutate(); }} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ color: "rgba(255,255,255,.45)", fontSize: 12, minWidth: 96 }}>Adı değiştir</span>
          <input value={renameName} onChange={(event) => setRenameName(event.target.value)} autoFocus aria-label="Yeni tenant adı"
            style={{ flex: 1, height: 34, borderRadius: 7, border: "1px solid rgba(139,92,246,.5)", background: "#131620", color: "#eaedf4", padding: "0 12px", outline: "none" }} />
          <button disabled={!renameName.trim() || rename.isPending} style={{ border: 0, borderRadius: 7, padding: "0 16px", height: 34, background: "#8b5cf6", color: "white", fontWeight: 650, cursor: "pointer" }}>{rename.isPending ? "Kaydediliyor…" : "Kaydet"}</button>
          <button type="button" onClick={() => setRenaming(null)} style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 7, padding: "0 12px", height: 34, background: "transparent", color: "rgba(255,255,255,.55)", cursor: "pointer" }}>Vazgeç</button>
        </form>
      )}

      {(create.error || rename.error || setActive.error) && (
        <div style={{ marginBottom: 12, color: "#f87171", fontSize: 12 }}>İşlem tamamlanamadı. Yetkinizi ve girilen değeri kontrol edin.</div>
      )}

      <div style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tenant adı ara…"
            style={{ flex: 1, background: "transparent", border: "none", color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        </div>

        {isLoading && <div style={{ padding: "32px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Yükleniyor…</div>}
        {error && <div style={{ padding: "24px", textAlign: "center", color: "#f87171", fontSize: 13 }}>Tenantlar alınamadı.</div>}
        {!isLoading && !error && filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Tenant bulunamadı.</div>
        )}

        {filtered.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Tenant Adı", "Durum", "İşlem"].map((h, i) => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: i === 2 ? "right" : "left", fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <td style={{ padding: "10px 16px", color: "#eaedf4", fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: "10px 16px", color: item.isActive ? "#4ade80" : "#f59e0b" }}>{item.isActive ? "Aktif" : "Pasif"}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    {access.rename && <button onClick={() => { setRenaming({ id: item.id, name: item.name }); setRenameName(item.name); }}
                      style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,.6)", padding: "4px 8px", fontSize: 12, fontWeight: 650 }}>
                      Adı değiştir
                    </button>}
                    {((item.isActive && access.passivate) || (!item.isActive && access.reactivate)) && <button onClick={() => item.id && setActive.mutate({ id: item.id, active: !item.isActive })}
                      style={{ all: "unset", cursor: "pointer", color: item.isActive ? "rgba(239,68,68,0.8)" : "#4ade80", padding: "4px 8px", fontSize: 12, fontWeight: 650 }}>
                      {item.isActive ? "Pasifleştir" : "Etkinleştir"}
                    </button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pageCount > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{total} kayıt · Sayfa {page + 1}/{pageCount}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ l: "← Önceki", f: () => setPage(p => p - 1), d: page === 0 }, { l: "Sonraki →", f: () => setPage(p => p + 1), d: page >= pageCount - 1 }]
                .map(({ l, f, d }) => (
                  <button key={l} onClick={f} disabled={d} style={{ all: "unset", cursor: d ? "not-allowed" : "pointer", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.06)", color: d ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}>{l}</button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
