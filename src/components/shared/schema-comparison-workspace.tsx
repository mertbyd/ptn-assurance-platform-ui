"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Check,
  CircleSlash2,
  ChevronDown,
  ChevronRight,
  Columns3,
  Database,
  GitCompareArrows,
  Layers3,
  ListFilter,
  Loader2,
  Rows3,
  Save,
  Search,
  Table2,
  EyeOff,
} from "lucide-react";

import { dbApi } from "@/api/db";
import { FindingsExplorer, getFindingCount } from "@/components/shared/findings-explorer";
import { useAsyncResource } from "@/hooks/useAsyncResource";
import { extractUserMessage } from "@/lib/error-messages";
import { getObjectTypeLabel, searchable } from "@/lib/presentation";
import type {
  CompareSchemaResponseDto,
  SchemaSnapshotDto,
  ScopeRuleDto,
} from "@/types";

/* ── connection type aligned to dbApi.connections.list() response ── */
interface DbConnDto {
  id: string;
  name: string;
  engineCode: string;
  host: string;
  port: number;
  databaseName: string;
  isActive: boolean;
}

/* ── design tokens ───────────────────────────────────────────────── */
const ACC    = "#2d90f5";
const BORDER  = "rgba(255,255,255,0.08)";
const SUBTLE  = "rgba(255,255,255,0.04)";
const SURFACE = "#131620";

const GS = `
@keyframes spin   { to { transform:rotate(360deg); } }
@keyframes fadeUp { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
`;

/* ── internal types ──────────────────────────────────────────────── */
interface SchemaOption { name: string; inSource: boolean; inTarget: boolean; }
interface ChildObjectOption {
  key: string; parentKey: string; schema: string; tableName: string;
  name: string; objectTypeCode: string;
  sourceSummary?: string | null; targetSummary?: string | null;
  inSource: boolean; inTarget: boolean;
}
interface ObjectOption {
  key: string; schema: string; name: string; objectTypeCode: string;
  inSource: boolean; inTarget: boolean; children: ChildObjectOption[];
}

type ScopeKindCode = "Include" | "Exclude" | "Ignore" | "DataCompare";
type ScopeMode     = "all" | ScopeKindCode;
type PresenceFilter = "all" | "both" | "source" | "target";

const SCOPE_CHOICES: { value: ScopeMode; title: string; desc: string; Icon: typeof Layers3 }[] = [
  { value: "all",         title: "Şemalardaki her şeyi karşılaştır", desc: "Seçtiğiniz şemalardaki tüm Table, Column, Key, Index, Trigger, View ve diğer yapıları kontrol eder.", Icon: Layers3 },
  { value: "Include",     title: "Nesneleri kendim seçeyim",          desc: "Table ağacını açıp Column, Index, PK, FK veya Trigger seçin; View nesnelerini doğrudan işaretleyin.", Icon: ListFilter },
  { value: "Exclude",     title: "Seçtiklerimi hariç tut",             desc: "Karşılaştırmada yer almaması gereken şema nesnelerini veya yalnız belirli alt nesneleri seçin.", Icon: CircleSlash2 },
  { value: "Ignore",      title: "Teknik nesneleri yok say",           desc: "Geçici, log veya teknik nesneleri bulgu üretmeden kapsamın dışında bırakın.", Icon: EyeOff },
  { value: "DataCompare", title: "Verisi kontrol edilecek tabloları seç", desc: "Satır ve hücre karşılaştırması yapılacak tabloları işaretleyin.", Icon: Rows3 },
];

const SCOPE_LEAD: Record<ScopeKindCode, string> = {
  Include:     "Yalnız şu nesneler karşılaştırılacak",
  Exclude:     "Şu nesneler karşılaştırma dışında bırakılacak",
  Ignore:      "Şu teknik nesneler yok sayılacak",
  DataCompare: "Şu tabloların verisi kontrol edilecek",
};

/* ── pure helpers ────────────────────────────────────────────────── */
function toggleVal(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}
function nk(...parts: string[]) { return parts.join(".").toLowerCase(); }
function matchPresence(inS: boolean, inT: boolean, f: PresenceFilter) {
  return f === "all" || (f === "both" && inS && inT) || (f === "source" && inS && !inT) || (f === "target" && !inS && inT);
}
function objSearchText(o: ObjectOption) { return searchable(`${o.schema} ${o.name} ${getObjectTypeLabel(o.objectTypeCode)}`); }
function objMatchesDirect(o: ObjectOption, q: string, tf: string, pf: PresenceFilter) {
  return (tf === "all" || o.objectTypeCode === tf) && (!q || objSearchText(o).includes(q)) && matchPresence(o.inSource, o.inTarget, pf);
}
function matchingChildren(o: ObjectOption, q: string, tf: string, pf: PresenceFilter) {
  const parentQ = !q || objSearchText(o).includes(q);
  return o.children.filter((c) =>
    (tf === "all" || c.objectTypeCode === tf) &&
    (parentQ || searchable(`${c.name} ${getObjectTypeLabel(c.objectTypeCode)} ${c.sourceSummary ?? ""} ${c.targetSummary ?? ""}`).includes(q)) &&
    matchPresence(c.inSource, c.inTarget, pf),
  );
}
function mergeSchemas(src: string[], tgt: string[]): SchemaOption[] {
  const m = new Map<string, SchemaOption>();
  src.forEach((n) => m.set(n.toLowerCase(), { name: n, inSource: true, inTarget: false }));
  tgt.forEach((n) => { const k = n.toLowerCase(); const c = m.get(k); if (c) c.inTarget = true; else m.set(k, { name: n, inSource: false, inTarget: true }); });
  return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
}
function initialSchemaSelection(schemas: SchemaOption[]) {
  const common = schemas.filter((s) => s.inSource && s.inTarget);
  return common.length ? common.map((s) => s.name) : schemas.map((s) => s.name);
}
function upsertObj(m: Map<string, ObjectOption>, item: Pick<ObjectOption, "schema"|"name"|"objectTypeCode">, side: "source"|"target") {
  const k = nk(item.schema, item.name, item.objectTypeCode);
  const cur = m.get(k) ?? { ...item, key: k, inSource: false, inTarget: false, children: [] };
  cur.inSource ||= side === "source"; cur.inTarget ||= side === "target";
  m.set(k, cur); return cur;
}
function upsertChild(obj: ObjectOption, item: Pick<ChildObjectOption, "schema"|"tableName"|"name"|"objectTypeCode">, side: "source"|"target", summary: string|null) {
  const k = nk(item.schema, item.tableName, item.objectTypeCode, item.name);
  const bk = new Map(obj.children.map((c) => [c.key, c]));
  const cur = bk.get(k) ?? { ...item, key: k, parentKey: obj.key, inSource: false, inTarget: false };
  cur.inSource ||= side === "source"; cur.inTarget ||= side === "target";
  if (side === "source") cur.sourceSummary = summary; else cur.targetSummary = summary;
  bk.set(k, cur);
  obj.children = Array.from(bk.values()).sort((a, b) => `${a.objectTypeCode}.${a.name}`.localeCompare(`${b.objectTypeCode}.${b.name}`));
}
function addSnapshot(m: Map<string, ObjectOption>, snap: SchemaSnapshotDto, side: "source"|"target") {
  snap.tables.forEach((t) => {
    const obj = upsertObj(m, { schema: t.schema, name: t.name, objectTypeCode: "Table" }, side);
    t.columns.forEach((c) => upsertChild(obj, { schema: t.schema, tableName: t.name, name: c.name, objectTypeCode: "Column" }, side, c.rawDataType));
    t.indexes.forEach((i) => upsertChild(obj, { schema: t.schema, tableName: t.name, name: i.name, objectTypeCode: "Index" }, side, `${i.isPrimaryKey?"PK · ":i.isUnique?"Unique · ":""}${i.columns.join(", ")}`));
    t.constraints.forEach((c) => upsertChild(obj, { schema: t.schema, tableName: t.name, name: c.name, objectTypeCode: c.typeCode }, side, [getObjectTypeLabel(c.typeCode), c.columns.join(", ")].filter(Boolean).join(" · ")));
    t.triggers.forEach((tr) => upsertChild(obj, { schema: t.schema, tableName: t.name, name: tr.name, objectTypeCode: "Trigger" }, side, tr.definition ? "Tanımlı" : null));
  });
  snap.objects.forEach((o) => upsertObj(m, o, side));
}
function buildScopeRules(mode: ScopeMode, schemaNames: string[], objs: ObjectOption[], objKeys: string[], childKeys: string[]): ScopeRuleDto[] {
  if (mode === "all") return [];
  const sel = new Set(objKeys);
  if (mode === "DataCompare") return objs.filter((o) => sel.has(o.key) && o.objectTypeCode === "Table").map((o) => ({ scopeKindCode: mode, schemaName: o.schema, objectName: o.name, childName: null }));
  const rules: ScopeRuleDto[] = objs.filter((o) => sel.has(o.key)).map((o) => ({ scopeKindCode: mode, schemaName: o.schema, objectName: o.name, childName: null }));
  objs.forEach((o) => { if (sel.has(o.key)) return; o.children.filter((c) => childKeys.includes(c.key)).forEach((c) => rules.push({ scopeKindCode: mode, schemaName: c.schema, objectName: c.tableName, childName: c.name })); });
  if (mode === "Include") return rules;
  return rules.length ? rules : schemaNames.map((schemaName) => ({ scopeKindCode: mode, schemaName, objectName: null, childName: null }));
}

/* ── shared inline primitives ────────────────────────────────────── */
function Spin({ size = 18 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" style={{ animation: "spin .85s linear infinite", flexShrink: 0 }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
function LoadingCenter() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}><Spin size={22} /></div>;
}
function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 650, background: bg, color, whiteSpace: "nowrap" as const }}>{label}</span>;
}
function Btn({ label, Icon, onClick, disabled, loading, variant = "ghost", small }: { label: string; Icon?: React.ElementType; onClick?: () => void; disabled?: boolean; loading?: boolean; variant?: "primary"|"ghost"|"accent"; small?: boolean; }) {
  const h = small ? 28 : 32; const px = small ? 10 : 14; const fs = small ? 11.5 : 12.5;
  const s: Record<string, React.CSSProperties> = {
    primary: { background: ACC, color: "#fff", boxShadow: `0 2px 12px ${ACC}44`, fontWeight: 700 },
    ghost:   { background: SUBTLE, color: "rgba(255,255,255,0.55)", border: `1px solid ${BORDER}` },
    accent:  { background: `${ACC}18`, color: ACC, border: `1px solid ${ACC}33` },
  };
  return <button onClick={onClick} disabled={disabled||loading} style={{ all: "unset", cursor: disabled||loading?"not-allowed":"pointer", display: "inline-flex", alignItems: "center", gap: 6, height: h, padding: `0 ${px}px`, borderRadius: 8, fontSize: fs, fontWeight: 580, opacity: disabled?0.4:1, transition: "opacity 130ms", ...s[variant] }}>
    {loading ? <Loader2 size={12} style={{ animation: "spin .8s linear infinite" }} /> : Icon ? <Icon size={12} strokeWidth={1.9} /> : null}
    {label}
  </button>;
}
function ErrBanner({ msg }: { msg: string }) {
  return <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", fontSize: 12.5, color: "#f87171" }}>{msg}</div>;
}
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", ...style }}>{children}</div>;
}
function CardHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${BORDER}` }}><span style={{ fontSize: 13.5, fontWeight: 700, color: "#eaedf4" }}>{title}</span>{right}</div>;
}
function CardBody({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "16px 18px" }}>{children}</div>;
}

/* ── StepRail ────────────────────────────────────────────────────── */
function StepRail({ step }: { step: number }) {
  const steps = ["Bağlantılar", "Kapsam", "Sonuçlar"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>
      {steps.map((label, i) => {
        const n = i + 1; const active = step === n; const done = step > n;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRight: i < 2 ? `1px solid ${BORDER}` : "none", background: active ? `${ACC}0d` : "transparent" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, background: done ? "rgba(74,222,128,0.15)" : active ? `${ACC}22` : "rgba(255,255,255,0.05)", border: `1px solid ${done ? "rgba(74,222,128,0.35)" : active ? `${ACC}55` : "rgba(255,255,255,0.1)"}`, color: done ? "#4ade80" : active ? ACC : "rgba(255,255,255,0.3)" }}>
              {done ? <Check size={11} /> : n}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: active ? "#eaedf4" : done ? "#4ade80" : "rgba(255,255,255,0.3)" }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── ConnectionSelect ────────────────────────────────────────────── */
function ConnectionSelect({ label, help, value, connections, onChange }: { label: string; help: string; value: string; connections: DbConnDto[]; onChange: (v: string) => void }) {
  const sel = connections.find((c) => c.id === value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12.5, fontWeight: 650, color: "rgba(255,255,255,0.65)" }}>{label}</span>
      <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>{help}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ height: 36, padding: "0 10px", background: "#1a1e2a", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
        <option value="">Bir bağlantı seçin</option>
        {connections.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.engineCode}</option>)}
      </select>
      {sel && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>{sel.host}{sel.port?`:${sel.port}`:""} / {sel.databaseName}</span>}
    </div>
  );
}

/* ── PresenceBadge ───────────────────────────────────────────────── */
function PresenceBadge({ inSource, inTarget }: { inSource: boolean; inTarget: boolean }) {
  if (inSource && inTarget) return <Pill label="İki tarafta"    color="#4ade80"              bg="rgba(74,222,128,0.1)" />;
  if (inSource)             return <Pill label="Hedefte eksik"  color="#fbbf24"              bg="rgba(251,191,36,0.1)" />;
  return                           <Pill label="Hedefte fazla"  color="rgba(255,255,255,0.5)" bg="rgba(255,255,255,0.06)" />;
}

/* ── ScopeSummary ────────────────────────────────────────────────── */
function ScopeSummary({ mode, rules, schemas }: { mode: ScopeMode; rules: ScopeRuleDto[]; schemas: string[] }) {
  if (mode === "all") return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
      <span style={{ fontWeight: 650, color: "#e0e4f0" }}>Kapsam:</span> {schemas.join(", ")} şemasındaki tüm Table, Column, Index, PK, FK, Trigger, View ve diğer nesneler karşılaştırılacak.
    </div>
  );
  if (!rules.length) return (
    <div style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "#fbbf24" }}>
      {mode === "DataCompare" ? "Henüz tablo seçmediniz." : "Henüz nesne seçmediniz."}
    </div>
  );
  const visible = rules.slice(0, 12);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ fontSize: 12.5, fontWeight: 650, color: "#e0e4f0", marginBottom: 8 }}>{SCOPE_LEAD[mode as ScopeKindCode]}:</div>
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5 }}>
        {visible.map((r, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, fontSize: 11.5 }}>
            <span style={{ color: "#e0e4f0", fontWeight: 600 }}>{[r.schemaName, r.objectName, r.childName].filter(Boolean).join(".")}</span>
          </span>
        ))}
        {rules.length > 12 && <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>+{rules.length - 12} kural daha</span>}
      </div>
    </div>
  );
}

/* ── ObjectPicker ────────────────────────────────────────────────── */
interface ObjPickerProps {
  objects: ObjectOption[]; allCount: number;
  query: string; onQuery: (v: string) => void;
  presence: PresenceFilter; onPresence: (v: PresenceFilter) => void;
  schemaFilter: string; onSchemaFilter: (v: string) => void;
  schemaNames: string[];
  typeFilter: string; onTypeFilter: (v: string) => void;
  objectTypes: string[];
  selObjs: Set<string>; selChildren: Set<string>;
  mode: ScopeMode;
  onToggleObj: (k: string) => void;
  onToggleChild: (k: string) => void;
  onSelectVisible: (ok: string[], ck: string[]) => void;
  onClear: () => void;
}

function ObjectPicker(p: ObjPickerProps) {
  const [expandAll, setExpandAll] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const q = searchable(p.query.trim());
  const bySchema = Array.from(p.objects.reduce((m, o) => { m.set(o.schema, [...(m.get(o.schema) ?? []), o]); return m; }, new Map<string, ObjectOption[]>()).entries());

  function selectVisible() {
    const ok: string[] = []; const ck: string[] = [];
    p.objects.forEach((o) => {
      if (p.mode === "DataCompare" || objMatchesDirect(o, q, p.typeFilter, p.presence)) { ok.push(o.key); return; }
      ck.push(...matchingChildren(o, q, p.typeFilter, p.presence).map((c) => c.key));
    });
    p.onSelectVisible(ok, ck);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Guide */}
      {p.mode !== "DataCompare" && (
        <div style={{ background: `${ACC}08`, border: `1px solid ${ACC}22`, borderRadius: 8, padding: "10px 14px", fontSize: 12.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: ACC }}>Nasıl seçilir?</span> Bir <b style={{ color: "#eaedf4" }}>Table</b> seçerseniz tüm alt nesneleri dahil edilir. Yalnız belirli alt nesne için oku açıp o nesneyi işaretleyin.
        </div>
      )}
      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
        <div style={{ position: "relative" as const, flex: "1 1 220px" }}>
          <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)", pointerEvents: "none" }} />
          <input value={p.query} onChange={(e) => p.onQuery(e.target.value)} placeholder="Table, Column, Trigger ara…"
            style={{ width: "100%", height: 32, paddingLeft: 30, paddingRight: 12, background: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 12.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }} />
        </div>
        {(["schemaFilter","typeFilter","presence"] as const).map((key) => {
          if (key === "schemaFilter") return (
            <select key={key} value={p.schemaFilter} onChange={(e) => p.onSchemaFilter(e.target.value)} style={{ height: 32, padding: "0 8px", background: "#1a1e2a", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}>
              <option value="all">Tüm şemalar</option>
              {p.schemaNames.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          );
          if (key === "typeFilter") return (
            <select key={key} value={p.typeFilter} onChange={(e) => p.onTypeFilter(e.target.value)} style={{ height: 32, padding: "0 8px", background: "#1a1e2a", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}>
              <option value="all">Tüm türler</option>
              {p.objectTypes.map((t) => <option key={t} value={t}>{getObjectTypeLabel(t)}</option>)}
            </select>
          );
          return (
            <select key={key} value={p.presence} onChange={(e) => p.onPresence(e.target.value as PresenceFilter)} style={{ height: 32, padding: "0 8px", background: "#1a1e2a", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 12.5, fontFamily: "inherit", outline: "none" }}>
              <option value="all">Tüm durumlar</option>
              <option value="both">İki tarafta</option>
              <option value="source">Hedefte eksik</option>
              <option value="target">Hedefte fazla</option>
            </select>
          );
        })}
        <Btn label="Görünenleri seç" onClick={selectVisible} small />
        <Btn label="Temizle" onClick={p.onClear} small />
        {p.mode !== "DataCompare" && <>
          <Btn label="Tümünü aç"    onClick={() => { setExpandAll(true);  setOverrides({}); }} small />
          <Btn label="Tümünü kapat" onClick={() => { setExpandAll(false); setOverrides({}); }} small />
        </>}
      </div>
      {/* Counts */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, fontSize: 11.5, color: "rgba(255,255,255,0.35)" }}>
        <span>{p.objects.length} nesne</span>
        <span>· {p.selObjs.size} seçili</span>
        {p.mode !== "DataCompare" && <span>· {p.selChildren.size} alt nesne seçili</span>}
        {p.objects.length < p.allCount && <span>· Toplam {p.allCount}</span>}
      </div>
      {/* Object tree */}
      <div style={{ maxHeight: 520, overflowY: "auto" as const, display: "flex", flexDirection: "column", gap: 12 }}>
        {bySchema.map(([schema, objs]) => (
          <section key={schema}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 7, marginBottom: 6, position: "sticky" as const, top: 0, zIndex: 2 }}>
              <Database size={12} color={ACC} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{schema}</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{objs.length} nesne</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {objs.map((obj) => {
                const visChld = p.mode === "DataCompare" ? [] : matchingChildren(obj, q, p.typeFilter, p.presence);
                const directMatch = objMatchesDirect(obj, q, p.typeFilter, p.presence);
                const autoExp = visChld.length > 0 && !directMatch;
                const exp = overrides[obj.key] ?? (expandAll || autoExp);
                const hasChld = visChld.length > 0;
                const sel = p.selObjs.has(obj.key);
                return (
                  <div key={obj.key} style={{ border: `1px solid ${sel ? `${ACC}44` : BORDER}`, borderRadius: 10, background: sel ? `${ACC}0a` : "rgba(255,255,255,0.02)", overflow: "hidden", transition: "border-color 130ms" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                      {/* checkbox */}
                      <div onClick={() => p.onToggleObj(obj.key)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${sel ? ACC : "rgba(255,255,255,0.2)"}`, background: sel ? ACC : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {sel && <Check size={10} color="#fff" />}
                      </div>
                      {/* expand arrow */}
                      {hasChld ? (
                        <button type="button" onClick={() => setOverrides((ov) => ({ ...ov, [obj.key]: !exp }))}
                          style={{ all: "unset", cursor: "pointer", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                          {exp ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                      ) : <span style={{ width: 20 }} />}
                      {/* icon */}
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "rgba(255,255,255,0.35)" }}>
                        {obj.objectTypeCode === "Table" ? <Table2 size={13} /> : <Layers3 size={13} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#eaedf4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{obj.name}</span>
                          <Pill label={getObjectTypeLabel(obj.objectTypeCode)} color="rgba(255,255,255,0.4)" bg="rgba(255,255,255,0.05)" />
                        </div>
                        {hasChld && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{visChld.length} alt nesne</span>}
                      </div>
                      <PresenceBadge inSource={obj.inSource} inTarget={obj.inTarget} />
                    </div>
                    {hasChld && exp && (
                      <div style={{ borderTop: `1px solid ${BORDER}`, background: "rgba(0,0,0,0.15)", padding: "8px 12px 10px 44px" }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>
                          {sel ? "Table'ın tamamı seçili" : `${visChld.filter((c) => p.selChildren.has(c.key)).length} seçili`}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 6 }}>
                          {visChld.map((child) => {
                            const cs = p.selChildren.has(child.key);
                            return (
                              <div key={child.key} onClick={() => !sel && p.onToggleChild(child.key)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: `1px solid ${cs ? `${ACC}33` : "rgba(255,255,255,0.06)"}`, borderRadius: 8, background: cs ? `${ACC}08` : "rgba(255,255,255,0.02)", cursor: sel ? "not-allowed" : "pointer", opacity: sel ? 0.5 : 1, transition: "border-color 120ms" }}>
                                <div style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${cs ? ACC : "rgba(255,255,255,0.15)"}`, background: cs ? ACC : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  {cs && <Check size={9} color="#fff" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "#e0e4f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "block" }}>{child.name}</span>
                                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{child.sourceSummary ?? "yok"} → {child.targetSummary ?? "yok"}</span>
                                </div>
                                <PresenceBadge inSource={child.inSource} inTarget={child.inTarget} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {!p.objects.length && <div style={{ padding: "32px 0", textAlign: "center" as const, fontSize: 13, color: "rgba(255,255,255,0.25)", border: `1px dashed ${BORDER}`, borderRadius: 10 }}>Bu filtrelerle eşleşen nesne yok.</div>}
      </div>
    </div>
  );
}

/* ── ResultStats ─────────────────────────────────────────────────── */
function ResultStat({ label, value }: { label: string; value: number }) {
  return <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}><div style={{ fontSize: 22, fontWeight: 650, color: "#eaedf4", letterSpacing: "-0.03em" }}>{value.toLocaleString("tr-TR")}</div><div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>{label}</div></div>;
}

/* ═══════════════════════════════════════════════════════════════════
   SchemaComparisonWorkspace — MAIN EXPORT
═══════════════════════════════════════════════════════════════════ */
export function SchemaComparisonWorkspace() {
  const router = useRouter();
  const loader = useCallback(async () => {
    const [connections, comparisonTypes] = await Promise.all([
      dbApi.connections.list({ maxResultCount: 1000 }),
      dbApi.lookups.list("comparison-types", { maxResultCount: 100 }),
    ]);
    return { connections, comparisonTypes };
  }, []);
  const { data, isLoading, error } = useAsyncResource(loader);

  const [srcId,  setSrcId]  = useState("");
  const [tgtId,  setTgtId]  = useState("");
  const [compType, setCompType] = useState("SchemaOnly");

  const [schemaOpts, setSchemaOpts] = useState<SchemaOption[]>([]);
  const [selSchemas, setSelSchemas]  = useState<string[]>([]);
  const [scopeMode,  setScopeMode]   = useState<ScopeMode>("all");

  const [objOpts,    setObjOpts]    = useState<ObjectOption[]>([]);
  const [selObjKeys, setSelObjKeys] = useState<string[]>([]);
  const [selChildKeys, setSelChildKeys] = useState<string[]>([]);
  const [objQuery,   setObjQuery]   = useState("");
  const [presFilter, setPresFilter] = useState<PresenceFilter>("all");
  const [schFilter,  setSchFilter]  = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [findings, setFindings] = useState<CompareSchemaResponseDto | null>(null);
  const [reqErr,   setReqErr]   = useState<string | null>(null);
  const [isSchLoading,  setIsSchLoading]  = useState(false);
  const [isObjLoading,  setIsObjLoading]  = useState(false);
  const [isComparing,   setIsComparing]   = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [defName,       setDefName]       = useState("");

  const connections = useMemo(() => (data?.connections.items.filter((c) => c.isActive) ?? []) as DbConnDto[], [data]);
  const comparisonTypes = useMemo(() => data?.comparisonTypes.items.filter((item) => item.isActive) ?? [], [data]);
  const src = connections.find((c) => c.id === srcId);
  const tgt = connections.find((c) => c.id === tgtId);

  const selSchSet  = useMemo(() => new Set(selSchemas), [selSchemas]);
  const selObjSet  = useMemo(() => new Set(selObjKeys), [selObjKeys]);
  const selChldSet = useMemo(() => new Set(selChildKeys), [selChildKeys]);

  const scopeRules = useMemo<ScopeRuleDto[]>(() => buildScopeRules(scopeMode, selSchemas, objOpts, selObjKeys, selChildKeys), [scopeMode, selSchemas, objOpts, selObjKeys, selChildKeys]);
  const runScopeRules = useMemo<ScopeRuleDto[]>(
    () => scopeMode === "all" && selSchemas.length < schemaOpts.length
      ? selSchemas.map((schemaName) => ({ scopeKindCode: "Include", schemaName, objectName: null, childName: null }))
      : scopeRules,
    [scopeMode, scopeRules, schemaOpts.length, selSchemas],
  );

  const currentStep = findings ? 3 : schemaOpts.length ? 2 : 1;
  const normType = compType.toLowerCase();

  const visibleScopes = useMemo(() => {
    if (normType === "dataonly" || normType === "both") return SCOPE_CHOICES.filter((c) => c.value === "DataCompare");
    return SCOPE_CHOICES.filter((c) => c.value !== "DataCompare");
  }, [normType]);

  const availTypes = useMemo(() => Array.from(new Set(objOpts.flatMap((o) => [o.objectTypeCode, ...o.children.map((c) => c.objectTypeCode)]))).sort(), [objOpts]);

  const filteredObjs = useMemo(() => {
    const q = searchable(objQuery.trim());
    return objOpts.filter((o) => {
      if (scopeMode === "DataCompare" && o.objectTypeCode !== "Table") return false;
      if (schFilter !== "all" && o.schema !== schFilter) return false;
      if (scopeMode === "DataCompare") return objMatchesDirect(o, q, "Table", presFilter);
      return objMatchesDirect(o, q, typeFilter, presFilter) || matchingChildren(o, q, typeFilter, presFilter).length > 0;
    });
  }, [objOpts, objQuery, typeFilter, presFilter, schFilter, scopeMode]);

  const requiresObjSel = scopeMode === "Include" || scopeMode === "DataCompare";
  const hasReqObjSel = !requiresObjSel || scopeRules.length > 0;

  function resetAfter() {
    setSchemaOpts([]); setSelSchemas([]); setObjOpts([]); setSelObjKeys([]); setSelChildKeys([]);
    setSchFilter("all"); setTypeFilter("all"); setFindings(null); setReqErr(null); setDefName("");
  }

  function swap() { setSrcId(tgtId); setTgtId(srcId); resetAfter(); }

  async function loadSchemas() {
    if (!srcId || !tgtId) return;
    if (srcId === tgtId) { setReqErr("Kaynak ve hedef için iki farklı bağlantı seçin."); return; }
    setIsSchLoading(true); setReqErr(null); setFindings(null); setObjOpts([]); setSelObjKeys([]); setSelChildKeys([]);
    try {
      const [ss, ts] = await Promise.all([dbApi.schema.getSchemas(srcId), dbApi.schema.getSchemas(tgtId)]);
      const merged = mergeSchemas(ss.map((s) => s.name), ts.map((s) => s.name));
      setSchemaOpts(merged); setSelSchemas(initialSchemaSelection(merged));
    } catch (e) { setReqErr(extractUserMessage(e)); }
    finally { setIsSchLoading(false); }
  }

  async function loadObjects() {
    if (!srcId || !tgtId || !selSchemas.length) return;
    setIsObjLoading(true); setReqErr(null);
    try {
      const [ss, ts] = await Promise.all([
        dbApi.schema.getSnapshot(srcId, selSchemas),
        dbApi.schema.getSnapshot(tgtId, selSchemas),
      ]);
      const byKey = new Map<string, ObjectOption>();
      addSnapshot(byKey, ss as unknown as SchemaSnapshotDto, "source");
      addSnapshot(byKey, ts as unknown as SchemaSnapshotDto, "target");
      const reqSch = new Set(selSchemas.map((s) => s.toLowerCase()));
      setObjOpts(Array.from(byKey.values()).filter((o) => reqSch.has(o.schema.toLowerCase())).sort((a, b) => `${a.schema}.${a.name}.${a.objectTypeCode}`.localeCompare(`${b.schema}.${b.name}.${b.objectTypeCode}`)));
      setSelObjKeys([]); setSelChildKeys([]);
    } catch (e) { setReqErr(extractUserMessage(e)); }
    finally { setIsObjLoading(false); }
  }

  async function handleCompare() {
    if (!srcId || !tgtId || !selSchemas.length) return;
    if (requiresObjSel && !scopeRules.length) { setReqErr(scopeMode === "DataCompare" ? "Veri kontrolü için en az bir tablo seçin." : "En az bir nesne seçin."); return; }
    setIsComparing(true); setReqErr(null);
    try {
      const result = await dbApi.schema.compare({
        sourceConnectionId: srcId,
        targetConnectionId: tgtId,
        comparisonTypeCode: compType,
        schemaNames: selSchemas,
        scopeRules,
      });
      setFindings(result);
      setTimeout(() => document.getElementById("cmp-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setReqErr(extractUserMessage(e)); }
    finally { setIsComparing(false); }
  }

  async function saveReport() {
    if (!srcId || !tgtId || !selSchemas.length) return;
    setIsSaving(true); setReqErr(null);
    try {
      const comparisonType = comparisonTypes.find((item) => item.code.toLowerCase() === compType.toLowerCase());
      if (!comparisonType) throw new Error("Karşılaştırma modu lookup kaydı bulunamadı.");
      const name = defName.trim() || `${src?.name ?? "Kaynak"} → ${tgt?.name ?? "Hedef"} · ${new Date().toLocaleString("tr-TR")}`;
      const def = await dbApi.definitions.create({
        name,
        sourceConnectionId: srcId,
        targetConnectionId: tgtId,
        sourceRoleCode: "Reference",
        comparisonTypeId: comparisonType.id,
        description: `${selSchemas.join(", ")} şemaları için UI karşılaştırması`,
        isActive: true,
      });
      const run = await dbApi.runs.execute({ comparisonDefinitionId: def.id, scopeRules: runScopeRules });
      /* Uygulama içi gezinme `router.push` iledir: `window.location.assign` tam sayfa yeniden
       * yükleme yapar, React Query önbelleğini ve oturum durumunu boşuna atardı. */
      router.push(`/database/runs?runId=${run.id}`);
    } catch (e) { setReqErr(extractUserMessage(e)); }
    finally { setIsSaving(false); }
  }

  function changeCompType(code: string) {
    const n = code.toLowerCase();
    setCompType(code);
    setScopeMode((cur) => { if (n === "dataonly" || n === "both") return "DataCompare"; if (n === "schemaonly" && cur === "DataCompare") return "all"; return cur; });
    setSelObjKeys([]); setSelChildKeys([]); setTypeFilter("all"); setPresFilter("all"); setFindings(null); setReqErr(null);
  }

  return (
    <>
      <style>{GS}</style>
      <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Header */}
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Yeni Karşılaştırma</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>Referans veritabanını ve incelenecek hedefi seçin. Tüm şemayı veya yalnız istediğiniz alanları karşılaştırın.</p>
        </div>

        {isLoading ? <LoadingCenter /> : error ? <ErrBanner msg={error} /> : (
          <>
            <StepRail step={currentStep} />

            {/* Step 1 — Connections */}
            <Card>
              <CardHead title="1. Veritabanlarını seçin" />
              <CardBody>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "flex-end" }}>
                  <ConnectionSelect label="Kaynak (referans)" help="Doğru kabul edilen veritabanı" value={srcId} connections={connections} onChange={(v) => { setSrcId(v); resetAfter(); }} />
                  <button type="button" onClick={swap} disabled={!srcId && !tgtId}
                    style={{ all: "unset", cursor: "pointer", width: 34, height: 34, borderRadius: 8, background: SUBTLE, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", opacity: (!srcId && !tgtId) ? 0.4 : 1, marginBottom: 2 }}
                    aria-label="Kaynak ve hedefi değiştir">
                    <ArrowLeftRight size={14} />
                  </button>
                  <ConnectionSelect label="Hedef (incelenecek)" help="Eksik veya farklı öğelerin aranacağı veritabanı" value={tgtId} connections={connections} onChange={(v) => { setTgtId(v); resetAfter(); }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Yön önemlidir: &ldquo;hedefte eksik&rdquo; = kaynakta var ama hedefte yok.</p>
                  <Btn label={isSchLoading ? "Yükleniyor…" : "Şemaları yükle"} Icon={Layers3} variant="accent" disabled={!srcId || !tgtId} loading={isSchLoading} onClick={() => void loadSchemas()} />
                </div>
              </CardBody>
            </Card>

            {reqErr && <ErrBanner msg={reqErr} />}

            {/* Steps 2+ */}
            {schemaOpts.length > 0 && (
              <>
                {/* Schema selection */}
                <Card>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${BORDER}` }}>
                    <div>
                      <span style={{ fontSize: 13.5, fontWeight: 700, color: "#eaedf4" }}>2. Karşılaştırılacak şemaları seçin</span>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>En sık kullanılan ortak şema otomatik seçildi.</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn label="Tümünü seç"   small onClick={() => setSelSchemas(schemaOpts.map((s) => s.name))} />
                      <Btn label="Yalnız ortaklar" small onClick={() => setSelSchemas(schemaOpts.filter((s) => s.inSource && s.inTarget).map((s) => s.name))} />
                    </div>
                  </div>
                  <CardBody>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                      {schemaOpts.map((s) => {
                        const checked = selSchSet.has(s.name);
                        return (
                          <label key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1px solid ${checked ? `${ACC}44` : BORDER}`, borderRadius: 10, background: checked ? `${ACC}0a` : "rgba(255,255,255,0.02)", cursor: "pointer", transition: "border-color 130ms" }}>
                            <div onClick={() => { setSelSchemas((cur) => toggleVal(cur, s.name)); setObjOpts([]); setSelObjKeys([]); setSelChildKeys([]); setFindings(null); }}
                              style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${checked ? ACC : "rgba(255,255,255,0.2)"}`, background: checked ? ACC : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {checked && <Check size={10} color="#fff" />}
                            </div>
                            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#eaedf4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{s.name}</span>
                            <PresenceBadge inSource={s.inSource} inTarget={s.inTarget} />
                          </label>
                        );
                      })}
                    </div>
                  </CardBody>
                </Card>

                {/* Scope selection */}
                <Card>
                  <CardHead title={normType === "schemaonly" ? "3. Ne kadarını karşılaştıralım?" : "3. Verisi karşılaştırılacak tabloları seçin"} />
                  <CardBody>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: 280 }}>
                        <span style={{ fontSize: 12.5, fontWeight: 650, color: "rgba(255,255,255,0.65)" }}>Karşılaştırma modu</span>
                        <select value={compType} onChange={(e) => changeCompType(e.target.value)} style={{ height: 36, padding: "0 10px", background: "#1a1e2a", border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                          <option value="SchemaOnly">Yalnız yapı</option>
                          <option value="DataOnly">Yalnız veri</option>
                          <option value="Both">Yapı ve veri</option>
                        </select>
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${visibleScopes.length}, 1fr)`, gap: 10 }}>
                        {visibleScopes.map(({ value, title, desc, Icon }) => {
                          const active = scopeMode === value;
                          return (
                            <button key={value} type="button" onClick={() => { setScopeMode(value); setSelObjKeys([]); setSelChildKeys([]); setTypeFilter("all"); setPresFilter("all"); setFindings(null); }}
                              style={{ all: "unset", cursor: "pointer", border: `1px solid ${active ? `${ACC}44` : BORDER}`, borderRadius: 12, padding: "14px 16px", background: active ? `${ACC}0d` : "rgba(255,255,255,0.02)", textAlign: "left" as const, transition: "border-color 130ms" }}>
                              <div style={{ width: 34, height: 34, borderRadius: 9, background: active ? `${ACC}22` : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                                <Icon size={16} color={active ? ACC : "rgba(255,255,255,0.35)"} />
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#eaedf4", marginBottom: 4 }}>{title}</div>
                              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>{desc}</div>
                            </button>
                          );
                        })}
                      </div>
                      {scopeMode !== "all" && (
                        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
                          {!objOpts.length ? (
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Seçilebilir nesneleri yükleyin</div>
                                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{scopeMode === "DataCompare" ? "Verisi kontrol edilecek tabloları göstereceğiz." : "Table ağacını açıp Column, Index, PK, FK ve Trigger seçebilirsiniz."}</p>
                              </div>
                              <Btn label={isObjLoading ? "Yükleniyor…" : scopeMode === "DataCompare" ? "Tabloları göster" : "Nesne ağacını göster"} Icon={Columns3} loading={isObjLoading} disabled={!selSchemas.length} onClick={() => void loadObjects()} />
                            </div>
                          ) : (
                            <ObjectPicker objects={filteredObjs} allCount={objOpts.length} query={objQuery} onQuery={setObjQuery} presence={presFilter} onPresence={setPresFilter} schemaFilter={schFilter} onSchemaFilter={setSchFilter} schemaNames={selSchemas} typeFilter={typeFilter} onTypeFilter={setTypeFilter} objectTypes={scopeMode === "DataCompare" ? ["Table"] : availTypes} selObjs={selObjSet} selChildren={selChldSet} mode={scopeMode} onToggleObj={(k) => setSelObjKeys((c) => toggleVal(c, k))} onToggleChild={(k) => setSelChildKeys((c) => toggleVal(c, k))} onSelectVisible={(ok, ck) => { setSelObjKeys(ok); setSelChildKeys(ck); }} onClear={() => { setSelObjKeys([]); setSelChildKeys([]); }} />
                          )}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>

                {/* Compare CTA */}
                <Card style={{ border: `1px solid ${ACC}25`, background: `${ACC}05` }}>
                  <CardBody>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#eaedf4" }}>{src?.name ?? "—"} → {tgt?.name ?? "—"}</div>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{selSchemas.length} şema seçili</p>
                      </div>
                      <Btn label={isComparing ? "Karşılaştırılıyor…" : "Karşılaştırmayı başlat"} Icon={GitCompareArrows} variant="primary" disabled={isComparing || !selSchemas.length || !hasReqObjSel} loading={isComparing} onClick={() => void handleCompare()} />
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <ScopeSummary mode={scopeMode} rules={scopeRules} schemas={selSchemas} />
                    </div>
                  </CardBody>
                </Card>
              </>
            )}

            {/* Results */}
            {findings && (
              <section id="cmp-results" style={{ display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 80 }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: ACC }}>Karşılaştırma tamamlandı</div>
                    <h3 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Sonuçlar</h3>
                    <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>{src?.name} → {tgt?.name}</p>
                  </div>
                  <Pill label={getFindingCount(findings) > 0 ? `${getFindingCount(findings)} fark bulundu` : "Fark bulunamadı"} color={getFindingCount(findings) > 0 ? "#fbbf24" : "#4ade80"} bg={getFindingCount(findings) > 0 ? "rgba(251,191,36,0.1)" : "rgba(74,222,128,0.1)"} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                  <ResultStat label="Toplam bulgu"  value={getFindingCount(findings)} />
                  <ResultStat label="Yapı farkı"    value={findings.schemaDifferences.length} />
                  <ResultStat label="Migration farkı" value={findings.migrationDifferences.length} />
                  <ResultStat label="Veri farkı"    value={findings.dataDifferences.length} />
                </div>
                {/* Save report */}
                <Card>
                  <CardHead title="Raporu oluştur" />
                  <CardBody>
                    <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>Bu karşılaştırmayı geçmişe kaydedin. İsterseniz rapora bir ad verin.</p>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                      <input value={defName} onChange={(e) => setDefName(e.target.value)} placeholder={`${src?.name ?? "Kaynak"} → ${tgt?.name ?? "Hedef"}`}
                        style={{ flex: "1 1 240px", height: 34, padding: "0 12px", background: SUBTLE, border: `1px solid ${BORDER}`, borderRadius: 8, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                      <Btn label={isSaving ? "Kaydediliyor…" : "Raporu oluştur ve kaydet"} Icon={Save} variant="primary" disabled={isSaving} loading={isSaving} onClick={() => void saveReport()} />
                    </div>
                  </CardBody>
                </Card>
                {/* Findings explorer */}
                <Card>
                  <CardBody>
                    <FindingsExplorer findings={findings} />
                  </CardBody>
                </Card>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
