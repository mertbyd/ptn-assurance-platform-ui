"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Braces,
  ChevronRight,
  Columns3,
  Database,
  KeyRound,
  ListTree,
  Loader2,
  Network,
  RefreshCw,
  Search,
  Table2,
  Zap,
} from "lucide-react";

import { dbApi } from "@/api/db";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { extractUserMessage } from "@/lib/error-messages";
import { formatDateTime, getObjectTypeLabel, searchable } from "@/lib/presentation";
import type {
  SchemaColumnDto,
  SchemaConstraintDto,
  SchemaIndexDto,
  SchemaObjectDefinitionDto,
  SchemaSnapshotDto,
  SchemaTableDto,
  SchemaTriggerDto,
} from "@/types";

/* ── design tokens ───────────────────────────────────────────────── */
const ACC    = "#2d90f5";
const BORDER  = "rgba(255,255,255,0.08)";
const SUBTLE  = "rgba(255,255,255,0.04)";
const SURFACE = "#131620";

const GS = `
@keyframes spin   { to { transform:rotate(360deg); } }
@keyframes fadeUp { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
`;

/* ── types ───────────────────────────────────────────────────────── */
type TableTab = "columns" | "indexes" | "constraints" | "triggers";
type ViewMode = "tree" | "diagram";

const TABLE_TABS: { id: TableTab; label: string; Icon: typeof Columns3 }[] = [
  { id: "columns",     label: "Kolonlar",       Icon: Columns3 },
  { id: "indexes",     label: "İndeksler",      Icon: ListTree },
  { id: "constraints", label: "Kısıtlar",       Icon: KeyRound },
  { id: "triggers",    label: "Tetikleyiciler", Icon: Zap },
];

function tableKey(t: Pick<SchemaTableDto, "schema" | "name">) {
  return `table:${t.schema}.${t.name}`;
}
function objectKey(o: Pick<SchemaObjectDefinitionDto, "schema" | "name" | "objectTypeCode">) {
  return `object:${o.schema}.${o.name}.${o.objectTypeCode}`;
}

/* ── shared primitives ───────────────────────────────────────────── */

function Spin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"
      style={{ animation: "spin .85s linear infinite", flexShrink: 0 }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function LoadingCenter() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}><Spin size={22} /></div>;
}

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 650, background: bg, color, whiteSpace: "nowrap" as const }}>
      {label}
    </span>
  );
}

function Btn({
  label, Icon, onClick, disabled, loading, variant = "ghost",
}: {
  label: string; Icon?: React.ElementType; onClick?: () => void;
  disabled?: boolean; loading?: boolean; variant?: "primary" | "ghost" | "accent";
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: ACC, color: "#fff", boxShadow: `0 2px 12px ${ACC}44`, fontWeight: 700 },
    ghost:   { background: SUBTLE, color: "rgba(255,255,255,0.55)", border: `1px solid ${BORDER}` },
    accent:  { background: `${ACC}18`, color: ACC, border: `1px solid ${ACC}33` },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ all: "unset", cursor: disabled || loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, height: 32, padding: "0 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 580, opacity: disabled ? 0.4 : 1, transition: "opacity 130ms", ...styles[variant] }}>
      {loading ? <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} /> : Icon ? <Icon size={13} strokeWidth={1.9} /> : null}
      {label}
    </button>
  );
}

function StatCard({ label, value, Icon }: { label: string; value: number; Icon: typeof Database }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: `${ACC}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={17} color={ACC} />
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 650, color: "#eaedf4", letterSpacing: "-0.03em" }}>{value.toLocaleString("tr-TR")}</div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>{label}</div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "#f87171" }}>
      {message}
    </div>
  );
}

/* ── TableDetails ─────────────────────────────────────────────────── */

function TableDetails({ table, activeTab, onTabChange }: { table: SchemaTableDto; activeTab: TableTab; onTabChange: (t: TableTab) => void }) {
  const counts: Record<TableTab, number> = { columns: table.columns.length, indexes: table.indexes.length, constraints: table.constraints.length, triggers: table.triggers.length };
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, paddingBottom: 16, borderBottom: `1px solid ${BORDER}`, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: ACC, marginBottom: 4 }}>Tablo</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>{table.name}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>{table.schema}.{table.name}</p>
        </div>
        <Pill label={`${table.columns.length} kolon`} color="rgba(255,255,255,0.5)" bg="rgba(255,255,255,0.06)" />
      </div>

      {/* Tab strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, marginBottom: 16 }}>
        {TABLE_TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} type="button" onClick={() => onTabChange(id)}
              style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "6px 8px", borderRadius: 7, fontSize: 11.5, fontWeight: active ? 700 : 500, color: active ? "#fff" : "rgba(255,255,255,0.4)", background: active ? ACC : "transparent", boxShadow: active ? `0 2px 10px ${ACC}44` : "none", transition: "all 150ms" }}>
              <Icon size={12} />
              {label}
              <span style={{ fontSize: 10, opacity: 0.6 }}>{counts[id]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "columns"     && <ColumnsTable     columns={table.columns} />}
      {activeTab === "indexes"     && <IndexesList      indexes={table.indexes} />}
      {activeTab === "constraints" && <ConstraintsList  constraints={table.constraints} />}
      {activeTab === "triggers"    && <TriggersList     triggers={table.triggers} />}
    </div>
  );
}

/* ── Column / Index / Constraint / Trigger sub-components ─────────── */

function ColumnsTable({ columns }: { columns: SchemaColumnDto[] }) {
  if (!columns.length) return <EmptyHint text="Bu tabloda kolon bulunamadı." />;
  return (
    <div style={{ overflowX: "auto" as const }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
            {["Kolon", "Veri tipi", "Boş olabilir", "Özellikler", "Varsayılan"].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left" as const, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.25)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => (
            <tr key={col.name} style={{ borderBottom: i < columns.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}>
              <td style={{ padding: "9px 12px" }}>
                <div style={{ fontWeight: 600, color: "#eaedf4" }}>{col.name}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Sıra {col.ordinal}</div>
              </td>
              <td style={{ padding: "9px 12px" }}>
                <code style={{ background: "rgba(45,144,245,0.1)", color: ACC, padding: "2px 6px", borderRadius: 5, fontSize: 11.5 }}>{col.rawDataType}</code>
              </td>
              <td style={{ padding: "9px 12px" }}>
                <Pill label={col.isNullable ? "Evet" : "Hayır"} color={col.isNullable ? "rgba(255,255,255,0.5)" : "#fbbf24"} bg={col.isNullable ? "rgba(255,255,255,0.06)" : "rgba(251,191,36,0.1)"} />
              </td>
              <td style={{ padding: "9px 12px" }}>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                  {col.isIdentity && <Pill label="Oto. artış" color="#a78bfa" bg="rgba(167,139,250,0.1)" />}
                  {col.maxLength != null && <Pill label={`Uzunluk ${col.maxLength}`} color="rgba(255,255,255,0.4)" bg="rgba(255,255,255,0.06)" />}
                  {col.numericPrecision != null && <Pill label={`${col.numericPrecision},${col.numericScale ?? 0}`} color="rgba(255,255,255,0.4)" bg="rgba(255,255,255,0.06)" />}
                  {!col.isIdentity && col.maxLength == null && col.numericPrecision == null && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>}
                </div>
              </td>
              <td style={{ padding: "9px 12px" }}>
                <code style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "block" }} title={col.defaultValueSql ?? undefined}>
                  {col.defaultValueSql || "—"}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IndexesList({ indexes }: { indexes: SchemaIndexDto[] }) {
  if (!indexes.length) return <EmptyHint text="Bu tablo için indeks bilgisi gelmedi." />;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
      {indexes.map((idx) => (
        <div key={idx.name} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 650, color: "#eaedf4", fontSize: 13 }}>{idx.name}</span>
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              {idx.isPrimaryKey && <Pill label="PK" color="#4ade80" bg="rgba(74,222,128,0.1)" />}
              {!idx.isPrimaryKey && (idx.isUnique ? <Pill label="Benzersiz" color="#60a5fa" bg="rgba(96,165,250,0.1)" /> : <Pill label="Standart" color="rgba(255,255,255,0.4)" bg="rgba(255,255,255,0.06)" />)}
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
            {idx.columns.map((c) => <code key={c} style={{ background: "rgba(45,144,245,0.1)", color: ACC, padding: "2px 6px", borderRadius: 5, fontSize: 11 }}>{c}</code>)}
          </div>
          {idx.includedColumns.length > 0 && <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>Dahil: <span style={{ color: "rgba(255,255,255,0.55)" }}>{idx.includedColumns.join(", ")}</span></p>}
          {idx.filterDefinition && <pre style={{ margin: "8px 0 0", overflow: "auto", borderRadius: 6, background: "#0a0c12", padding: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{idx.filterDefinition}</pre>}
        </div>
      ))}
    </div>
  );
}

function ConstraintsList({ constraints }: { constraints: SchemaConstraintDto[] }) {
  if (!constraints.length) return <EmptyHint text="Bu tablo için kısıt bilgisi gelmedi." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {constraints.map((con) => (
        <div key={`${con.typeCode}-${con.name}`} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <span style={{ fontWeight: 650, color: "#eaedf4", fontSize: 13 }}>{con.name}</span>
            <Pill label={getObjectTypeLabel(con.typeCode)} color="rgba(255,255,255,0.5)" bg="rgba(255,255,255,0.06)" />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
            {con.columns.map((c) => <code key={c} style={{ background: "rgba(45,144,245,0.1)", color: ACC, padding: "2px 6px", borderRadius: 5, fontSize: 11 }}>{c}</code>)}
          </div>
          {con.referencedTable && (
            <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              Bağlı tablo: <span style={{ color: "#eaedf4" }}>{con.referencedTable}</span>
              {con.referencedColumns.length > 0 && ` (${con.referencedColumns.join(", ")})`}
              {(con.deleteActionCode || con.updateActionCode) && <span style={{ marginLeft: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Sil: {con.deleteActionCode ?? "—"} · Güncelle: {con.updateActionCode ?? "—"}</span>}
            </p>
          )}
          {con.definition && <pre style={{ margin: "8px 0 0", overflow: "auto", whiteSpace: "pre-wrap" as const, borderRadius: 6, background: "#0a0c12", padding: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{con.definition}</pre>}
        </div>
      ))}
    </div>
  );
}

function TriggersList({ triggers }: { triggers: SchemaTriggerDto[] }) {
  if (!triggers.length) return <EmptyHint text="Bu tabloya bağlı tetikleyici yok." />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {triggers.map((trg) => (
        <div key={trg.name} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px" }}>
            <span style={{ fontWeight: 650, color: "#eaedf4", fontSize: 13 }}>{trg.name}</span>
            <Pill label="Tanımlı" color="rgba(255,255,255,0.4)" bg="rgba(255,255,255,0.06)" />
          </div>
          {trg.definition && <pre style={{ margin: 0, maxHeight: 280, overflow: "auto", whiteSpace: "pre-wrap" as const, borderTop: `1px solid ${BORDER}`, background: "#0a0c12", padding: "10px 14px", fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.4)" }}>{trg.definition}</pre>}
        </div>
      ))}
    </div>
  );
}

function ObjectDetails({ object }: { object: SchemaObjectDefinitionDto }) {
  return (
    <div>
      <div style={{ paddingBottom: 16, borderBottom: `1px solid ${BORDER}`, marginBottom: 16 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: ACC, marginBottom: 4 }}>{getObjectTypeLabel(object.objectTypeCode)}</div>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>{object.name}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>{object.schema}.{object.name}</p>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>Tanım</div>
      <pre style={{ maxHeight: 520, overflow: "auto", whiteSpace: "pre-wrap" as const, border: `1px solid ${BORDER}`, borderRadius: 10, background: "#0a0c12", padding: "12px 16px", fontSize: 11.5, lineHeight: 1.65, color: "rgba(255,255,255,0.65)" }}>
        {object.definition || "Bu nesne için tanım metni bulunamadı."}
      </pre>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <div style={{ padding: "32px 0", textAlign: "center" as const, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>{text}</div>;
}

/* ═══════════════════════════════════════════════════════════════════
   SchemaDiscoveryWorkspace — MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */
export function SchemaDiscoveryWorkspace() {
  const loader = useCallback(() => dbApi.connections.list({ maxResultCount: 1000 }), []);
  const { data, isLoading, error } = useAsyncResource(loader);

  const [connectionId,     setConnectionId]     = useState("");
  const [snapshot,         setSnapshot]         = useState<SchemaSnapshotDto | null>(null);
  const [selectedNodeKey,  setSelectedNodeKey]  = useState("");
  const [activeTab,        setActiveTab]        = useState<TableTab>("columns");
  const [viewMode,         setViewMode]         = useState<ViewMode>("tree");
  const [query,            setQuery]            = useState("");
  const [snapshotError,    setSnapshotError]    = useState<string | null>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(false);

  const connections = data?.items ?? [];
  const selectedConnection = connections.find((c) => c.id === connectionId);

  const filteredTables = useMemo(() => {
    if (!snapshot) return [];
    const q = searchable(query.trim());
    if (!q) return snapshot.tables;
    return snapshot.tables.filter((t) => searchable(`${t.schema} ${t.name} ${t.columns.map((c) => c.name).join(" ")}`).includes(q));
  }, [query, snapshot]);

  const filteredObjects = useMemo(() => {
    if (!snapshot) return [];
    const q = searchable(query.trim());
    if (!q) return snapshot.objects;
    return snapshot.objects.filter((o) => searchable(`${o.schema} ${o.name} ${getObjectTypeLabel(o.objectTypeCode)}`).includes(q));
  }, [query, snapshot]);

  const tablesBySchema = useMemo(() => {
    const grouped = new Map<string, SchemaTableDto[]>();
    filteredTables.forEach((t) => grouped.set(t.schema, [...(grouped.get(t.schema) ?? []), t]));
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTables]);

  const selectedTable  = snapshot?.tables.find((t) => tableKey(t) === selectedNodeKey) ?? null;
  const selectedObject = snapshot?.objects.find((o) => objectKey(o) === selectedNodeKey) ?? null;
  const schemaCount    = snapshot ? new Set([...snapshot.tables.map((t) => t.schema), ...snapshot.objects.map((o) => o.schema)]).size : 0;
  const columnCount    = snapshot?.tables.reduce((n, t) => n + t.columns.length, 0) ?? 0;

  async function loadSnapshot() {
    if (!connectionId) return;
    setIsSnapshotLoading(true);
    setSnapshotError(null);
    try {
      const raw = await dbApi.schema.getSnapshot(connectionId);
      const result = raw as unknown as SchemaSnapshotDto;
      setSnapshot(result);
      setQuery("");
      setActiveTab("columns");
      const firstKey = result.tables?.[0] ? `table:${result.tables[0].schema}.${result.tables[0].name}` : "";
      setSelectedNodeKey(firstKey);
    } catch (err) {
      setSnapshotError(extractUserMessage(err));
    } finally {
      setIsSnapshotLoading(false);
    }
  }

  return (
    <>
      <style>{GS}</style>
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>

        {/* ── Page header ──────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Veritabanı Gezgini</h2>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>Bir bağlantıyı seçin; tabloları açın, kolonları ve teknik ayrıntıları tek ekranda inceleyin.</p>
          </div>
          {snapshot && <Btn label="Yeniden tara" Icon={RefreshCw} onClick={() => void loadSnapshot()} loading={isSnapshotLoading} />}
        </div>

        {/* ── Errors ───────────────────────────────────── */}
        {error && <ErrorBanner message={error} />}

        {/* ── Connection selector card ─────────────────── */}
        {isLoading ? <LoadingCenter /> : (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "flex-end" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 12.5, fontWeight: 650, color: "rgba(255,255,255,0.65)" }}>İncelenecek bağlantı</span>
                <select value={connectionId}
                  onChange={(e) => { setConnectionId(e.target.value); setSnapshot(null); setSelectedNodeKey(""); }}
                  style={{ height: 36, padding: "0 10px", background: "#1a1e2a", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                  <option value="">Bir veritabanı seçin</option>
                  {connections.filter((c) => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} · {c.engineCode}</option>
                  ))}
                </select>
              </label>

              <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 14px", minWidth: 200 }}>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Seçili veritabanı</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {selectedConnection ? `${selectedConnection.host}${selectedConnection.port ? `:${selectedConnection.port}` : ""} / ${selectedConnection.databaseName}` : "Henüz seçilmedi"}
                </div>
              </div>

              <Btn label={isSnapshotLoading ? "Taranıyor…" : "Veritabanını tara"} Icon={Database} variant="primary" disabled={!connectionId} loading={isSnapshotLoading} onClick={() => void loadSnapshot()} />
            </div>
          </div>
        )}

        {snapshotError && <ErrorBanner message={snapshotError} />}

        {/* ── Snapshot content ─────────────────────────── */}
        {snapshot ? (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
              <StatCard label="Şema"        value={schemaCount}            Icon={Database} />
              <StatCard label="Tablo"       value={snapshot.tables.length} Icon={Table2} />
              <StatCard label="Kolon"       value={columnCount}            Icon={Columns3} />
              <StatCard label="Diğer nesne" value={snapshot.objects.length} Icon={Braces} />
            </div>

            {/* Main panel */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Toolbar */}
              <div style={{ display: "flex", flexWrap: "wrap" as const, alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
                <div>
                  <span style={{ fontWeight: 650, fontSize: 14, color: "#eaedf4" }}>{snapshot.databaseName}</span>
                  <span style={{ marginLeft: 10, fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>{snapshot.engineCode} · Son tarama {formatDateTime(snapshot.collectedAt)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Search */}
                  <div style={{ position: "relative" as const }}>
                    <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tablo, kolon veya nesne ara"
                      style={{ height: 32, paddingLeft: 32, paddingRight: 12, background: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 12.5, fontFamily: "inherit", outline: "none", width: 240, boxSizing: "border-box" as const }} />
                  </div>
                  {/* View toggle */}
                  <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: 3 }}>
                    {([{ id: "tree" as const, label: "Ağaç", Icon: ListTree }, { id: "diagram" as const, label: "Diyagram", Icon: Network }]).map(({ id, label, Icon }) => (
                      <button key={id} type="button" onClick={() => setViewMode(id)}
                        style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, transition: "all 150ms", background: viewMode === id ? ACC : "transparent", color: viewMode === id ? "#fff" : "rgba(255,255,255,0.4)", boxShadow: viewMode === id ? `0 2px 10px ${ACC}44` : "none" }}>
                        <Icon size={12} />{label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tree / Diagram layout */}
              <div style={{ display: "grid", gridTemplateColumns: viewMode === "tree" ? "340px 1fr" : "1fr 380px", minHeight: 560 }}>
                {/* Left sidebar — tree */}
                <aside style={{ borderRight: `1px solid ${BORDER}`, overflowY: "auto" as const, maxHeight: "72vh", padding: 10, background: "rgba(0,0,0,0.15)" }}>
                  {tablesBySchema.map(([schema, tables]) => (
                    <details key={schema} open style={{ marginBottom: 8 }}>
                      <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)" }}>
                        <span>{schema}</span>
                        <span style={{ padding: "1px 6px", borderRadius: 999, background: "rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{tables.length}</span>
                      </summary>
                      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {tables.map((tbl) => {
                          const k = tableKey(tbl);
                          const active = selectedNodeKey === k;
                          return (
                            <button key={k} type="button" onClick={() => { setSelectedNodeKey(k); setActiveTab("columns"); }}
                              style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: active ? `${ACC}18` : "transparent", transition: "background 120ms" }}
                              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                              <Table2 size={14} color={active ? ACC : "rgba(255,255,255,0.3)"} style={{ flexShrink: 0 }} />
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: 13, fontWeight: 500, color: active ? "#eaedf4" : "rgba(255,255,255,0.6)" }}>{tbl.name}</span>
                                <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{tbl.columns.length} kolon · {tbl.indexes.length} indeks</span>
                              </span>
                              <ChevronRight size={13} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  ))}

                  {filteredObjects.length > 0 && (
                    <details open style={{ marginTop: 8, borderTop: `1px solid ${BORDER}`, paddingTop: 8 }}>
                      <summary style={{ display: "flex", alignItems: "center", justifyContent: "space-between", listStyle: "none", padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)" }}>
                        <span>Diğer nesneler</span>
                        <span style={{ padding: "1px 6px", borderRadius: 999, background: "rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{filteredObjects.length}</span>
                      </summary>
                      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {filteredObjects.map((obj) => {
                          const k = objectKey(obj);
                          const active = selectedNodeKey === k;
                          return (
                            <button key={k} type="button" onClick={() => setSelectedNodeKey(k)}
                              style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: active ? `${ACC}18` : "transparent", transition: "background 120ms" }}
                              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
                              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                              <Braces size={14} color={active ? ACC : "rgba(255,255,255,0.3)"} style={{ flexShrink: 0 }} />
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: 13, fontWeight: 500, color: active ? "#eaedf4" : "rgba(255,255,255,0.6)" }}>{obj.name}</span>
                                <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{obj.schema} · {getObjectTypeLabel(obj.objectTypeCode)}</span>
                              </span>
                              <ChevronRight size={13} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />
                            </button>
                          );
                        })}
                      </div>
                    </details>
                  )}

                  {!filteredTables.length && !filteredObjects.length && (
                    <div style={{ padding: "32px 10px", textAlign: "center" as const, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                      Aramanızla eşleşen nesne yok.
                    </div>
                  )}
                </aside>

                {/* Right detail panel */}
                <main style={{ overflowY: "auto" as const, maxHeight: "72vh", padding: "20px 22px" }}>
                  {selectedTable
                    ? <TableDetails table={selectedTable} activeTab={activeTab} onTabChange={setActiveTab} />
                    : selectedObject
                      ? <ObjectDetails object={selectedObject} />
                      : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 20px", gap: 10, textAlign: "center" as const }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: SUBTLE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Table2 size={20} color="rgba(255,255,255,0.18)" />
                          </div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>İncelemek için bir tablo seçin</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>Sol taraftaki ağaçtan tabloya veya başka bir veritabanı nesnesine tıklayın.</div>
                        </div>
                      )
                  }
                </main>
              </div>
            </div>
          </>
        ) : !isLoading && (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 20px", gap: 10, textAlign: "center" as const }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: SUBTLE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Database size={20} color="rgba(255,255,255,0.18)" />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Veritabanı yapısı henüz yüklenmedi</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", maxWidth: 360 }}>Bağlantıyı seçip &ldquo;Veritabanını tara&rdquo; düğmesine basın. Tablo ve kolonlar burada açılabilir bir ağaç olarak görünecek.</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
