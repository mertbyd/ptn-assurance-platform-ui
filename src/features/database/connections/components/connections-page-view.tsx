"use client";

import {
  Activity,
  Database,
  Edit3,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Save,
  ShieldCheck,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import {
  dbApi,
  type CreateDatabaseConnectionDto,
  type DatabaseConnectionDto,
  type UpdateDatabaseConnectionDto,
} from "@/api/db";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { extractUserMessage } from "@/lib/error-messages";
import { searchable } from "@/lib/presentation";
import type { LookupCommonDto } from "@/types";

/* ── design tokens ───────────────────────────────────────────────── */
const ACC    = "#2d90f5";
const SURFACE = "#131620";
const BORDER  = "rgba(255,255,255,0.08)";
const SUBTLE  = "rgba(255,255,255,0.04)";

const GS = `
@keyframes spin      { to { transform: rotate(360deg); } }
@keyframes fadeUp    { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes overlayIn { from { opacity:0; } to { opacity:1; } }
@keyframes dialogIn  { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
`;

/* ── form state ──────────────────────────────────────────────────── */
interface FormState {
  name: string;
  engineId: string;
  host: string;
  port: string;
  databaseName: string;
  username: string;
  password: string;
  tlsModeCode: string;
  trustServerCertificate: boolean;
  isActive: boolean;
}

const emptyForm: FormState = {
  name: "", engineId: "", host: "", port: "",
  databaseName: "", username: "", password: "", tlsModeCode: "Require",
  trustServerCertificate: false, isActive: true,
};

function formFromConn(c: DatabaseConnectionDto): FormState {
  return {
    name:            c.name,
    engineId:        c.engineId,
    host:           c.host,
    port:           c.port != null ? String(c.port) : "",
    databaseName:   c.databaseName,
    username:        "",
    password:        "",
    tlsModeCode:     c.tlsModeCode,
    trustServerCertificate: c.trustServerCertificate,
    isActive:        c.isActive,
  };
}

/* ── inline primitives ───────────────────────────────────────────── */

function Spin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"
      style={{ animation: "spin .85s linear infinite", flexShrink: 0 }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 0" }}>
      <Spin />
    </div>
  );
}

function Empty({ title, hint, cta }: { title: string; hint?: string; cta?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 20px", textAlign: "center", gap: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: SUBTLE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.18)" }}>
        <Database size={20} strokeWidth={1.4} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>{hint}</div>}
      {cta}
    </div>
  );
}

function Btn({ label, icon: Icon, onClick, variant = "ghost", disabled, loading, small }: {
  label: string; icon?: React.ElementType; onClick?: () => void;
  variant?: "primary" | "ghost" | "danger-dim"; disabled?: boolean; loading?: boolean; small?: boolean;
}) {
  const h = small ? 28 : 32; const px = small ? 10 : 14; const fs = small ? 11.5 : 12.5;
  const styles: Record<string, React.CSSProperties> = {
    primary:     { background: ACC,   color: "#fff", boxShadow: `0 2px 12px ${ACC}44`, fontWeight: 700 },
    ghost:       { background: SUBTLE, color: "rgba(255,255,255,0.55)", border: `1px solid ${BORDER}` },
    "danger-dim": { background: "rgba(239,68,68,0.07)", color: "#f87171", border: "1px solid rgba(239,68,68,0.14)" },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ all: "unset", cursor: disabled || loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, height: h, padding: `0 ${px}px`, borderRadius: 8, fontSize: fs, fontWeight: 580, opacity: disabled ? 0.4 : 1, transition: "opacity 130ms", ...styles[variant] }}>
      {loading ? <Loader2 size={12} style={{ animation: "spin .8s linear infinite" }} /> : Icon ? <Icon size={12} strokeWidth={1.9} /> : null}
      {label}
    </button>
  );
}

function PillBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 650, background: bg, color, whiteSpace: "nowrap" as const }}>{label}</span>;
}

/* ── FormInput ───────────────────────────────────────────────────── */
function FormInput({ label, error, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string; hint?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <span style={{ fontSize: 12.5, fontWeight: 650, color: "rgba(255,255,255,0.65)" }}>{label}</span>}
      {hint && <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>{hint}</span>}
      <input {...props}
        style={{ width: "100%", height: 36, padding: "0 12px", background: SUBTLE, border: `1px solid ${error ? "rgba(239,68,68,0.5)" : BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
        onFocus={(e) => { e.currentTarget.style.borderColor = `${ACC}66`; if (props.onFocus) props.onFocus(e); }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : BORDER; if (props.onBlur) props.onBlur(e); }}
      />
      {error && <span style={{ fontSize: 11.5, color: "#f87171" }}>{error}</span>}
    </label>
  );
}

function FormSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <span style={{ fontSize: 12.5, fontWeight: 650, color: "rgba(255,255,255,0.65)" }}>{label}</span>}
      <select {...props}
        style={{ width: "100%", height: 36, padding: "0 10px", background: "#1a1e2a", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}>
        {children}
      </select>
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ConnectionCard
═══════════════════════════════════════════════════════════════════ */
function ConnectionCard({ conn, testResult, isTesting, onTest, onEdit, onPassivate }: {
  conn: DatabaseConnectionDto;
  testResult?: { ok: boolean; msg: string };
  isTesting: boolean;
  onTest: () => void;
  onEdit: () => void;
  onPassivate: () => void;
}) {
  const engineLabel = conn.engineName || conn.engineCode;

  return (
    <article style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 240ms ease both", transition: "border-color 180ms ease-out, transform 220ms cubic-bezier(0.16,1,0.3,1)" }}
      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${ACC}44`; el.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = BORDER; el.style.transform = "translateY(0)"; }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
            <span style={{ fontSize: 14.5, fontWeight: 750, color: "#eaedf4", letterSpacing: "-0.02em" }}>{conn.name}</span>
            <PillBadge label={conn.isActive ? "Aktif" : "Pasif"} color={conn.isActive ? "#4ade80" : "rgba(255,255,255,0.35)"} bg={conn.isActive ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.06)"} />
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 3, fontFamily: "monospace" }}>
            {conn.host}{conn.port ? `:${conn.port}` : ""} / {conn.databaseName}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <PillBadge label={engineLabel} color={ACC} bg={`${ACC}1a`} />
          <button onClick={onEdit}
            style={{ all: "unset", cursor: "pointer", width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.35)", transition: "background 120ms, color 120ms" }}
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.07)"; el.style.color = "rgba(255,255,255,0.75)"; }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.color = "rgba(255,255,255,0.35)"; }}
            aria-label="Düzenle">
            <Edit3 size={13} />
          </button>
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div style={{ borderRadius: 8, padding: "8px 12px", fontSize: 12, background: testResult.ok ? "rgba(74,222,128,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${testResult.ok ? "rgba(74,222,128,0.18)" : "rgba(239,68,68,0.18)"}`, color: testResult.ok ? "#4ade80" : "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
          {testResult.ok ? <Activity size={12} /> : <WifiOff size={12} />}
          {testResult.msg}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn label={isTesting ? "Test ediliyor…" : "Bağlantıyı test et"} icon={Activity} disabled={!conn.isActive} loading={isTesting} onClick={onTest} />
        {conn.isActive && <Btn label="Pasife al" icon={Power} variant="danger-dim" onClick={onPassivate} />}
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ConnectionFormModal
═══════════════════════════════════════════════════════════════════ */
function ConnectionFormModal({ editing, engines, onClose, onSaved }: {
  editing: DatabaseConnectionDto | null;
  engines: LookupCommonDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    if (editing) return formFromConn(editing);
    const firstEngine = engines.find((engine) => engine.isActive);
    return {
      ...emptyForm,
      engineId: firstEngine?.id ?? "",
      port: firstEngine?.code === "PostgreSql" ? "5432" : firstEngine?.code === "SqlServer" ? "1433" : "",
    };
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((cur) => ({ ...cur, [k]: v }));
  }

  function handleEngineChange(engineId: string) {
    const engine = engines.find((item) => item.id === engineId);
    const defaultPort = engine?.code === "PostgreSql" ? "5432" : engine?.code === "SqlServer" ? "1433" : "";
    setForm((cur) => ({ ...cur, engineId, port: cur.port || defaultPort }));
  }

  async function save() {
    if (!form.name.trim() || !form.engineId || !form.host.trim() || !form.port || !form.databaseName.trim()) {
      setFormError("Bağlantı adı, motor, sunucu ve veritabanı alanları zorunludur.");
      return;
    }
    if (!editing && (!form.username.trim() || !form.password)) {
      setFormError("Yeni bağlantı için kullanıcı adı ve parola gereklidir.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const common = {
        engineId:        form.engineId,
        name:            form.name.trim(),
        host:           form.host.trim(),
        port:           Number(form.port),
        databaseName:   form.databaseName.trim(),
        tlsModeCode:     form.tlsModeCode,
        trustServerCertificate: form.trustServerCertificate,
        isActive:        form.isActive,
      };
      if (editing) {
        const payload: UpdateDatabaseConnectionDto = {
          ...common,
          username: form.username.trim() || null,
          password: form.password || null,
        };
        await dbApi.connections.update(editing.id, payload);
      } else {
        const payload: CreateDatabaseConnectionDto = {
          ...common,
          username: form.username.trim(),
          password: form.password,
        };
        await dbApi.connections.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setFormError(extractUserMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", zIndex: 500, animation: "overlayIn 180ms ease both" }} />

      {/* Dialog */}
      <div style={{ position: "fixed", inset: 0, zIndex: 501, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, pointerEvents: "none" }}>
        <div style={{ background: "#0f1118", border: `1px solid ${BORDER}`, borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "calc(100dvh - 32px)", display: "flex", flexDirection: "column", boxShadow: "0 32px 96px rgba(0,0,0,0.7)", animation: "dialogIn 200ms cubic-bezier(0.16,1,0.3,1) both", pointerEvents: "auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px 14px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em" }}>
              {editing ? "Bağlantıyı düzenle" : "Yeni veritabanı bağlantısı"}
            </span>
            <button onClick={onClose} style={{ all: "unset", cursor: "pointer", width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.35)", transition: "background 130ms, color 130ms" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ overflowY: "auto", padding: "20px 22px", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {formError && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#f87171" }}>
                {formError}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <FormInput label="Bağlantı adı" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Üretim PostgreSQL" />
              <FormSelect label="Veritabanı motoru" value={form.engineId} onChange={(e) => handleEngineChange(e.target.value)}>
                <option value="">Motor seçin</option>
                {engines.filter((engine) => engine.isActive).map((engine) => <option key={engine.id} value={engine.id}>{engine.name}</option>)}
              </FormSelect>
              <FormInput label="Sunucu / host" value={form.host} onChange={(e) => set("host", e.target.value)} placeholder="db.company.local" />
              <FormInput label="Port" type="number" value={form.port} onChange={(e) => set("port", e.target.value)} placeholder="5432" />
              <div style={{ gridColumn: "1 / -1" }}>
                <FormInput label="Veritabanı adı" value={form.databaseName} onChange={(e) => set("databaseName", e.target.value)} placeholder="production_db" />
              </div>
            </div>

            {/* Secure credentials section */}
            <div style={{ background: `${ACC}08`, border: `1px solid ${ACC}22`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
                <ShieldCheck size={14} color={ACC} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>Güvenli erişim bilgileri</span>
              </div>
              <p style={{ margin: "0 0 14px", fontSize: 11.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
                {editing ? "Yalnız değiştirmek istiyorsanız yeni değer girin; boş bırakırsanız mevcut bilgiler korunur." : "Bu bilgiler şifreli gizli kasa üzerinden saklanır."}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <FormInput label="Kullanıcı adı" autoComplete="off" value={form.username} onChange={(e) => set("username", e.target.value)} placeholder={editing ? "Değişmeyecekse boş bırakın" : "db_user"} />
                <FormInput label="Parola" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder={editing ? "Değişmeyecekse boş bırakın" : "••••••••"} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
                <FormSelect label="TLS politikası" value={form.tlsModeCode} onChange={(e) => set("tlsModeCode", e.target.value)}>
                  <option value="Require">Require</option>
                  <option value="Prefer">Prefer</option>
                  <option value="Disable">Disable</option>
                </FormSelect>
                <label style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "end", height: 36, fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>
                  <input type="checkbox" checked={form.trustServerCertificate} onChange={(event) => set("trustServerCertificate", event.target.checked)} style={{ accentColor: ACC }} />
                  Sunucu sertifikasına güven
                </label>
              </div>
            </div>

            {/* Active toggle */}
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.8)" }}>Bağlantı aktif</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Aktif bağlantılar yeni karşılaştırmalarda seçilebilir.</div>
              </div>
              <div onClick={() => set("isActive", !form.isActive)} style={{ width: 36, height: 20, borderRadius: 999, background: form.isActive ? ACC : "rgba(255,255,255,0.12)", position: "relative", flexShrink: 0, transition: "background 160ms" }}>
                <div style={{ position: "absolute", top: 2, left: form.isActive ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 160ms", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
              </div>
            </label>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "14px 22px 18px", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <button onClick={onClose} style={{ all: "unset", cursor: "pointer", padding: "0 16px", height: 34, borderRadius: 8, fontSize: 13, fontWeight: 580, color: "rgba(255,255,255,0.45)", border: `1px solid ${BORDER}`, background: SUBTLE }}>
              Vazgeç
            </button>
            <button onClick={() => void save()} disabled={isSaving}
              style={{ all: "unset", cursor: isSaving ? "not-allowed" : "pointer", padding: "0 18px", height: 34, borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#fff", background: ACC, display: "inline-flex", alignItems: "center", gap: 7, opacity: isSaving ? 0.65 : 1, boxShadow: `0 2px 12px ${ACC}44` }}>
              {isSaving ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} /> : <Save size={13} />}
              {editing ? "Değişiklikleri kaydet" : "Bağlantıyı oluştur"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ConnectionsPageView
═══════════════════════════════════════════════════════════════════ */
export function ConnectionsPageView() {
  const loader = useCallback(async () => {
    const [connections, engines] = await Promise.all([
      dbApi.connections.list({ maxResultCount: 1000 }),
      dbApi.lookups.list("database-engines", { maxResultCount: 100 }),
    ]);
    return { connections, engines };
  }, []);
  const { data, isLoading, error, reload } = useAsyncResource(loader);

  const [search,      setSearch]      = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [testResults,  setTestResults]  = useState<Record<string, { ok: boolean; msg: string }>>({});
  const [testingId,    setTestingId]    = useState<string | null>(null);
  const [formOpen,     setFormOpen]     = useState(false);
  const [editing,      setEditing]      = useState<DatabaseConnectionDto | null>(null);
  const [actionError,  setActionError]  = useState<string | null>(null);

  const connections = useMemo(() => data?.connections.items ?? [], [data?.connections.items]);
  const engines = useMemo(() => data?.engines.items ?? [], [data?.engines.items]);

  const filtered = useMemo(() => {
    const q = searchable(search.trim());
    return connections.filter((c) => {
      const matchesSearch = !q || searchable(`${c.name} ${c.host} ${c.databaseName} ${c.engineCode}`).includes(q);
      return matchesSearch && (showInactive || c.isActive);
    });
  }, [connections, search, showInactive]);

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(c: DatabaseConnectionDto) { setEditing(c); setFormOpen(true); }

  async function handleTest(id: string) {
    setTestingId(id);
    try {
      const result = await dbApi.connections.test(id);
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          ok: result.succeeded,
          msg: result.succeeded
            ? `Bağlantı başarılı${result.serverVersion ? ` · ${result.serverVersion}` : ""}${result.privilegeWarningCode ? ` · Uyarı: ${result.privilegeWarningCode}` : ""}`
            : (result.message ?? "Bağlantı başarısız"),
        },
      }));
    } catch (err) {
      setTestResults((prev) => ({ ...prev, [id]: { ok: false, msg: extractUserMessage(err) } }));
    } finally {
      setTestingId(null);
    }
  }

  async function handlePassivate(c: DatabaseConnectionDto) {
    if (!window.confirm(`"${c.name}" bağlantısını pasife almak istiyor musunuz? Geçmiş raporlar korunur.`)) return;
    setActionError(null);
    try {
      await dbApi.connections.passivate(c.id);
      await reload();
    } catch (err) {
      setActionError(extractUserMessage(err));
    }
  }

  return (
    <>
      <style>{GS}</style>

      <div style={{ padding: "28px 32px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Veritabanı Bağlantıları</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>Karşılaştırmalarda kullanılacak kaynak ve hedefleri yönetin; erişimi kaydetmeden önce gerçek sunucuda test edin.</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Yenile" icon={RefreshCw} onClick={() => void reload()} />
            <Btn label="Yeni Bağlantı" icon={Plus} variant="primary" onClick={openCreate} />
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" as const }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bağlantı, sunucu veya veritabanı ara…"
            style={{ height: 32, padding: "0 12px", background: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 12.5, fontFamily: "inherit", outline: "none", width: 300, boxSizing: "border-box" as const }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} style={{ accentColor: ACC }} />
            Pasif bağlantıları göster
          </label>
          {(search || showInactive) && (
            <button onClick={() => { setSearch(""); setShowInactive(false); }}
              style={{ all: "unset", cursor: "pointer", fontSize: 12, color: ACC }}>
              Filtreleri temizle
            </button>
          )}
        </div>

        {actionError && (
          <div style={{ marginBottom: 16, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#f87171" }}>
            {actionError}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <Loading />
        ) : error ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            <Empty title="API'ye ulaşılamadı" hint={error} cta={<Btn label="Yeniden Dene" icon={RefreshCw} onClick={() => void reload()} />} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            <Empty
              title={search ? "Eşleşen bağlantı bulunamadı" : "Henüz bağlantı eklenmemiş"}
              hint={search ? "Arama kriterini değiştirin." : "Yeni bir veritabanı bağlantısı ekleyin."}
              cta={!search ? <Btn label="Yeni Bağlantı" icon={Plus} variant="primary" onClick={openCreate} /> : undefined}
            />
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>
              {filtered.length} / {connections.length} bağlantı gösteriliyor
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
              {filtered.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  conn={conn}
                  testResult={testResults[conn.id]}
                  isTesting={testingId === conn.id}
                  onTest={() => void handleTest(conn.id)}
                  onEdit={() => openEdit(conn)}
                  onPassivate={() => void handlePassivate(conn)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <ConnectionFormModal
          editing={editing}
          engines={engines}
          onClose={() => setFormOpen(false)}
          onSaved={() => void reload()}
        />
      )}
    </>
  );
}
