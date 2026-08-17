"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { emailApi, type EmailTemplateDto } from "@/api/email.api";
import { queryKeys } from "@/api/query-keys";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { ApiRequestError } from "@/lib/api-request-error";

const PAGE = 20;
const emptyDraft = { name: "", culture: "tr", subject: "", body: "", description: "", isLayout: false };

export function TabEmailTemplates({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [previewing, setPreviewing] = useState<EmailTemplateDto | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const templates = useQuery({
    queryKey: queryKeys.email.templateList(page * PAGE, PAGE),
    queryFn: () => emailApi.templates.list(page * PAGE, PAGE),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["email", "templates"] });
  const remove = useMutation({
    mutationFn: (id: string) => emailApi.templates.remove(id),
    onSuccess: () => { setActionError(null); void invalidate(); },
    onError: (caught) => setActionError(toMessage(caught, "Şablon silinemedi.")),
  });
  const save = useMutation({
    mutationFn: () => editingId
      ? emailApi.templates.update(editingId, draft)
      : emailApi.templates.create(draft),
    onSuccess: () => {
      setShowEditor(false);
      setEditingId(null);
      setDraft(emptyDraft);
      setActionError(null);
      void invalidate();
    },
    onError: (caught) => setActionError(toMessage(caught, "Şablon kaydedilemedi.")),
  });

  const items = templates.data?.items ?? [];
  const total = templates.data?.totalCount ?? 0;
  const pageCount = Math.ceil(total / PAGE);
  const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");
  const filtered = items.filter((item) =>
    !normalizedSearch || `${item.name ?? ""} ${item.subject ?? ""} ${item.culture ?? ""}`.toLocaleLowerCase("tr-TR").includes(normalizedSearch)
  );

  const beginCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setActionError(null);
    setShowEditor(true);
  };
  const beginEdit = (item: EmailTemplateDto) => {
    if (!item.id || item.isInherited) return;
    setEditingId(item.id);
    setDraft({
      name: item.name ?? "",
      culture: item.culture ?? "tr",
      subject: item.subject ?? "",
      body: item.body ?? "",
      description: item.description ?? "",
      isLayout: !!item.isLayout,
    });
    setActionError(null);
    setShowEditor(true);
  };

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em" }}>E-posta Şablonları</h2>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
            {total > 0 ? `${total} etkin şablon · tenant kopyaları host şablonlarını ezer` : "Sisteme kayıtlı e-posta şablonları."}
          </p>
        </div>
        <button disabled={!canManage} title={!canManage ? "Şablon yönetim yetkisi gerekir" : undefined} onClick={beginCreate} style={{
          all: "unset", cursor: canManage ? "pointer" : "not-allowed", padding: "0 14px", height: 32, borderRadius: 7,
          background: "#10b981", color: "#fff", fontSize: 12.5, fontWeight: 640,
          display: "inline-flex", alignItems: "center", gap: 6, opacity: canManage ? 1 : 0.4,
        }}>+ Yeni Şablon</button>
      </div>

      {!canManage && <Notice color="amber">Şablonları ve önizlemelerini görebilirsiniz. Değişiklik için şablon yönetim yetkisi gerekir.</Notice>}
      {actionError && <Notice color="red">{actionError}</Notice>}

      {showEditor && canManage && (
        <form onSubmit={(event) => { event.preventDefault(); save.mutate(); }} style={{ display: "grid", gap: 9, padding: 14, marginBottom: 14, background: "#131620", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 120px", gap: 8 }}>
            <input required maxLength={128} value={draft.name} onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))} placeholder="Şablon adı" style={editorInput} />
            <input maxLength={16} value={draft.culture} onChange={(event) => setDraft((value) => ({ ...value, culture: event.target.value }))} placeholder="Dil: tr" style={editorInput} />
          </div>
          <input maxLength={256} value={draft.subject} onChange={(event) => setDraft((value) => ({ ...value, subject: event.target.value }))} placeholder="E-posta konusu" style={editorInput} />
          <textarea required value={draft.body} onChange={(event) => setDraft((value) => ({ ...value, body: event.target.value }))} placeholder="HTML veya düz metin gövdesi · Scriban: {{ model.Name }}" rows={9} style={{ ...editorInput, minHeight: 180, padding: 10, resize: "vertical" }} />
          <input maxLength={512} value={draft.description} onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))} placeholder="Açıklama (opsiyonel)" style={editorInput} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.62)", fontSize: 12 }}>
            <input type="checkbox" checked={draft.isLayout} onChange={(event) => setDraft((value) => ({ ...value, isLayout: event.target.checked }))} />
            Layout şablonu — ortak HTML kabuğunda {"{{ content }}"} alanını kullanır
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" onClick={() => setShowEditor(false)} style={secondaryButton}>Vazgeç</button>
            <button disabled={save.isPending} style={primaryButton}>{save.isPending ? "Kaydediliyor…" : editingId ? "Değişiklikleri kaydet" : "Şablonu oluştur"}</button>
          </div>
        </form>
      )}

      <div style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Şablon, konu veya dil ara…" style={{ flex: 1, background: "transparent", border: "none", color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          <button onClick={() => void templates.refetch()} style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.48)", fontSize: 12 }}>Yenile</button>
        </div>

        {templates.isLoading && <State text="Yükleniyor…" />}
        {templates.error && <State error text={toMessage(templates.error, "Şablonlar alınamadı.")} />}
        {!templates.isLoading && !templates.error && filtered.length === 0 && <State text="Şablon bulunamadı." />}

        {!templates.isLoading && filtered.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 850, borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                {["Şablon Adı", "Dil / Tür", "Konu", "Kaynak", "İşlem"].map((heading, index) => (
                  <th key={heading} style={{ padding: "9px 16px", textAlign: index === 4 ? "right" : "left", fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>{heading}</th>
                ))}
              </tr></thead>
              <tbody>{filtered.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: index < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <td style={{ padding: "10px 16px", color: "#eaedf4", fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.52)", whiteSpace: "nowrap" }}>{item.culture || "Tüm diller"} · {item.isLayout ? "Layout" : "E-posta"}</td>
                  <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.55)" }}>{item.subject || "—"}</td>
                  <td style={{ padding: "10px 16px", color: item.isInherited ? "#f59e0b" : "#4ade80", whiteSpace: "nowrap" }}>{item.isInherited ? "Host mirası" : "Bu tenant"}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => setPreviewing(item)} style={rowButton}>Önizle</button>
                    <button disabled={!canManage || item.isInherited} title={item.isInherited ? "Host şablonu değiştirilemez; aynı ad ve dilde tenant kopyası oluşturun." : undefined} onClick={() => beginEdit(item)} style={{ ...rowButton, color: "rgba(96,165,250,0.8)", opacity: !canManage || item.isInherited ? 0.25 : 1 }}>Düzenle</button>
                    <button disabled={!canManage || item.isInherited} onClick={() => { if (item.id && window.confirm("Şablonu silmek istiyor musunuz?")) remove.mutate(item.id); }} style={{ ...rowButton, color: "rgba(239,68,68,0.7)", opacity: !canManage || item.isInherited ? 0.25 : 1 }}>Sil</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}

        {pageCount > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{total} kayıt · Sayfa {page + 1}/{pageCount}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <Pager label="← Önceki" disabled={page === 0} onClick={() => setPage((value) => value - 1)} />
              <Pager label="Sonraki →" disabled={page >= pageCount - 1} onClick={() => setPage((value) => value + 1)} />
            </div>
          </div>
        )}
      </div>

      {previewing && <TemplatePreview template={previewing} onClose={() => setPreviewing(null)} />}
    </div>
  );
}

function TemplatePreview({ template, onClose }: { template: EmailTemplateDto; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" aria-label="E-posta şablonu önizleme" style={{ position: "fixed", inset: 0, zIndex: 90, display: "grid", placeItems: "center", padding: 24, background: "rgba(3,5,10,0.78)" }} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div style={{ width: "min(880px, 100%)", maxHeight: "88vh", overflow: "auto", background: "#10131c", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, boxShadow: "0 24px 80px rgba(0,0,0,0.55)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div><strong style={{ display: "block", color: "#eaedf4", fontSize: 15 }}>{template.name}</strong><span style={{ color: "rgba(255,255,255,0.38)", fontSize: 12 }}>{template.culture || "Tüm diller"} · {template.isLayout ? "Layout" : "E-posta"} · {template.isInherited ? "Host mirası" : "Tenant şablonu"}</span></div>
          <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.55)", padding: 4 }}>✕</button>
        </div>
        {template.subject && <div style={{ margin: "16px 20px 0", padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.75)", fontSize: 12 }}><b>Konu:</b> {template.subject}</div>}
        <div style={{ padding: 20 }}><iframe title={`${template.name} önizleme`} sandbox="" srcDoc={buildPreview(template)} style={{ width: "100%", minHeight: 440, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, background: "white" }} /></div>
      </div>
    </div>
  );
}

function buildPreview(template: EmailTemplateDto) {
  let body = template.body ?? "";
  if (template.isLayout) body = body.replace(/\{\{\s*content\s*\}\}/gi, '<div style="padding:16px;border:1px dashed #94a3b8;border-radius:8px;color:#475569">E-posta içeriği bu alana yerleşir.</div>');
  if (/<html[\s>]/i.test(body)) return body;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{margin:0;padding:20px;background:#fff;color:#111827;font:14px/1.6 system-ui,sans-serif}img{max-width:100%}</style></head><body>${body}</body></html>`;
}

function toMessage(error: unknown, fallback: string) {
  return error instanceof ApiRequestError ? getApiErrorMessage(error) : fallback;
}

function Notice({ children, color }: { children: React.ReactNode; color: "amber" | "red" }) {
  const red = color === "red";
  return <div style={{ marginBottom: 14, padding: "11px 14px", borderRadius: 8, background: red ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.07)", border: `1px solid ${red ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.16)"}`, color: red ? "#f87171" : "rgba(245,158,11,0.85)", fontSize: 12 }}>{children}</div>;
}

function State({ text, error = false }: { text: string; error?: boolean }) {
  return <div style={{ padding: "34px", textAlign: "center", color: error ? "#f87171" : "rgba(255,255,255,0.28)", fontSize: 13 }}>{text}</div>;
}

function Pager({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return <button onClick={onClick} disabled={disabled} style={{ all: "unset", cursor: disabled ? "not-allowed" : "pointer", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.06)", color: disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)" }}>{label}</button>;
}

const editorInput = { height: 34, padding: "0 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" } as const;
const primaryButton = { border: 0, borderRadius: 7, padding: "8px 14px", background: "#10b981", color: "white", cursor: "pointer", fontWeight: 650 } as const;
const secondaryButton = { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "8px 14px", background: "transparent", color: "rgba(255,255,255,0.6)", cursor: "pointer" } as const;
const rowButton = { all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.62)", padding: "4px 8px", fontSize: 12 } as const;
