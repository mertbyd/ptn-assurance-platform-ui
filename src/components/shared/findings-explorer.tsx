"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { Input } from "@chakra-ui/react";
import { Braces, ChevronDown, Database, DatabaseZap, GitCommitHorizontal, Rows3, Search } from "lucide-react";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import {
  getConfidenceLabel,
  getDifferenceKindMeta,
  getObjectTypeLabel,
  searchable,
  translateChangeSummary,
  type UiTone,
} from "@/lib/presentation";
import { cn } from "@/lib/utils";
import type {
  ComparisonFindingsDto,
  DataDifferenceDto,
  MigrationDifferenceDto,
  SchemaDifferenceDto,
} from "@/types";

type FindingCategory = "schema" | "migration" | "data";

interface FindingRow {
  key: string;
  category: FindingCategory;
  schemaLabel: string;
  objectName: string;
  childName?: string | null;
  objectTypeCode: string;
  kindCode: string;
  confidenceCode?: string | null;
  summary: string;
  schema?: SchemaDifferenceDto;
  migration?: MigrationDifferenceDto;
  data?: DataDifferenceDto;
}

interface FindingsExplorerProps {
  findings: ComparisonFindingsDto;
  showDirectionGuide?: boolean;
}

const toneAccent: Record<UiTone, string> = {
  warning: "border-l-amber-400/80",
  default: "border-l-sky-400/80",
  danger: "border-l-red-400/80",
  success: "border-l-emerald-400/80",
  neutral: "border-l-slate-600",
};

const toneBadge: Record<UiTone, { background: string; color: string }> = {
  danger: { background: "rgba(248,113,113,0.12)", color: "#fca5a5" },
  default: { background: "rgba(56,189,248,0.12)", color: "#7dd3fc" },
  neutral: { background: "rgba(148,163,184,0.12)", color: "#cbd5e1" },
  success: { background: "rgba(74,222,128,0.12)", color: "#86efac" },
  warning: { background: "rgba(251,191,36,0.12)", color: "#fcd34d" },
};

function ToneBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: UiTone }) {
  const colors = toneBadge[tone];
  return (
    <span style={{ ...colors, borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "3px 8px", whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function getFindingCount(findings: ComparisonFindingsDto) {
  return findings.schemaDifferences.length + findings.migrationDifferences.length + findings.dataDifferences.length;
}

function buildSchemaSummary(item: SchemaDifferenceDto) {
  if (item.kindCode === "OnlyInSource") return "Kaynakta var, hedefte yok — hedefe eklenmesi gerekebilir.";
  if (item.kindCode === "OnlyInTarget") return "Yalnız hedefte var — referansta böyle bir öğe yok.";
  return `İki tarafta farklı. Değişen: ${translateChangeSummary(item.changeSummary)}.`;
}

function buildMigrationSchemaLabel(item: MigrationDifferenceDto) {
  if (item.sourceSchemaName === item.targetSchemaName && item.sourceSchemaName) return item.sourceSchemaName;
  if (item.sourceSchemaName || item.targetSchemaName) return `${item.sourceSchemaName || "—"} → ${item.targetSchemaName || "—"}`;
  return "—";
}

function flattenFindings(findings: ComparisonFindingsDto): FindingRow[] {
  const schemaRows = findings.schemaDifferences.map<FindingRow>((item, index) => ({
    key: `schema-${index}-${item.schemaName}-${item.objectName}-${item.childName ?? ""}`,
    category: "schema",
    schemaLabel: item.schemaName,
    objectName: item.objectName,
    childName: item.childName,
    objectTypeCode: item.objectTypeCode,
    kindCode: item.kindCode,
    confidenceCode: item.confidenceCode,
    summary: buildSchemaSummary(item),
    schema: item,
  }));

  const migrationRows = findings.migrationDifferences.map<FindingRow>((item, index) => ({
    key: `migration-${index}-${item.sourceSchemaName ?? ""}-${item.targetSchemaName ?? ""}-${item.migrationId}`,
    category: "migration",
    schemaLabel: buildMigrationSchemaLabel(item),
    objectName: item.migrationId,
    objectTypeCode: "Migration",
    kindCode: item.kindCode,
    summary: item.sourceProductVersion || item.targetProductVersion ? "Uygulanan migration sürümleri farklı." : "Migration kaydı iki tarafta aynı değil.",
    migration: item,
  }));

  const dataRows = findings.dataDifferences.map<FindingRow>((item, index) => ({
    key: `data-${index}-${item.schemaName}-${item.tableName}`,
    category: "data",
    schemaLabel: item.schemaName,
    objectName: item.tableName,
    objectTypeCode: "Data",
    kindCode: item.kindCode,
    summary: `Satır sayısı kaynakta ${item.sourceRowCount ?? "—"}, hedefte ${item.targetRowCount ?? "—"}.`,
    data: item,
  }));

  return [...schemaRows, ...migrationRows, ...dataRows];
}

interface SchemaObjectTypeGroup {
  type: string;
  rows: FindingRow[];
}

interface SchemaGroup {
  schema: string;
  count: number;
  types: SchemaObjectTypeGroup[];
}

// Bulgulari once SEMAYA, her sema icinde NESNE TURUNE (Trigger, Tablo, Kolon...) gore gruplar.
// Boylece kullanici bir semayi acip yalniz o semadaki (or. trigger) farklari gorebilir.
function groupBySchema(rows: FindingRow[]): SchemaGroup[] {
  const bySchema = new Map<string, Map<string, FindingRow[]>>();
  for (const row of rows) {
    const schema = row.schemaLabel || "—";
    const byType = bySchema.get(schema) ?? new Map<string, FindingRow[]>();
    const typeRows = byType.get(row.objectTypeCode) ?? [];
    typeRows.push(row);
    byType.set(row.objectTypeCode, typeRows);
    bySchema.set(schema, byType);
  }
  return [...bySchema.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "tr"))
    .map(([schema, byType]) => ({
      schema,
      count: [...byType.values()].reduce((total, list) => total + list.length, 0),
      types: [...byType.entries()]
        .sort((a, b) => getObjectTypeLabel(a[0]).localeCompare(getObjectTypeLabel(b[0]), "tr"))
        .map(([type, typeRows]) => ({ type, rows: typeRows })),
    }));
}

export function FindingsExplorer({ findings, showDirectionGuide = true }: FindingsExplorerProps) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const rows = useMemo(() => flattenFindings(findings), [findings]);
  const kindOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.kindCode))).sort(), [rows]);
  const typeOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.objectTypeCode))).sort(), [rows]);
  const normalizedQuery = searchable(query.trim());
  const filteredRows = rows.filter((row) => {
    const matchesQuery =
      !normalizedQuery ||
      searchable(`${row.schemaLabel} ${row.objectName} ${row.childName ?? ""} ${row.summary} ${getObjectTypeLabel(row.objectTypeCode)}`).includes(normalizedQuery);
    return matchesQuery && (kindFilter === "all" || row.kindCode === kindFilter) && (typeFilter === "all" || row.objectTypeCode === typeFilter);
  });
  const schemaGroups = groupBySchema(filteredRows);

  if (!rows.length) {
    return <EmptyState icon={DatabaseZap} title="İki veritabanı uyumlu görünüyor" description="Seçilen kapsamda yapı, migration veya veri farkı bulunamadı." />;
  }

  return (
    <div className="space-y-5">
      {showDirectionGuide ? (
        <p className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-3.5 text-sm leading-6 text-slate-400">
          <span className="font-semibold text-slate-200">Nasıl okunur:</span> Kaynak, doğru kabul edilen referans veritabanıdır; hedef ise incelenen veritabanıdır.
          <span className="text-amber-200"> Eksik</span> = kaynakta var ama hedefte yok. <span className="text-sky-200">Fazladan</span> = yalnız hedefte var.
          <span className="text-red-200"> Değişmiş</span> = iki tarafta da var ama tanımı farklı.
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_190px_190px]" data-print-hidden="true">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-500" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Şema, tablo, kolon veya değişiklik ara" className="pl-10" />
        </div>
        <Select value={kindFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setKindFilter(event.target.value)} aria-label="Fark yönü filtresi">
          <option value="all">Tüm fark yönleri</option>
          {kindOptions.map((code) => <option key={code} value={code}>{getDifferenceKindMeta(code).label}</option>)}
        </Select>
        <Select value={typeFilter} onChange={(event: ChangeEvent<HTMLSelectElement>) => setTypeFilter(event.target.value)} aria-label="Nesne türü filtresi">
          <option value="all">Tüm nesne türleri</option>
          {typeOptions.map((code) => <option key={code} value={code}>{getObjectTypeLabel(code)}</option>)}
        </Select>
      </div>

      <div className="text-sm text-slate-500">{filteredRows.length} / {rows.length} bulgu · {schemaGroups.length} şema · başlığa tıklayarak açıp kapatın</div>

      <div className="space-y-3">
        {schemaGroups.map((group) => (
          <details key={group.schema} open className="group/schema overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:hidden hover:bg-slate-800/30">
              <div className="flex min-w-0 items-center gap-2.5">
                <Database className="size-4 shrink-0 text-sky-300" />
                <span className="truncate font-semibold text-slate-100">{group.schema}</span>
                <span className="shrink-0 text-xs text-slate-500">şema · {group.count} fark · {group.types.length} tür</span>
              </div>
              <ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-open/schema:rotate-180" />
            </summary>
            <div className="space-y-2 border-t border-slate-700/60 px-3 py-3">
              {group.types.map((typeGroup) => (
                <details key={typeGroup.type} open className="group/type overflow-hidden rounded-lg border border-slate-800 bg-slate-950/30">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 marker:hidden hover:bg-slate-800/40">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      {getObjectTypeLabel(typeGroup.type)}
                      <ToneBadge>{typeGroup.rows.length}</ToneBadge>
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 text-slate-500 transition-transform group-open/type:rotate-180" />
                  </summary>
                  <div className="space-y-2 px-2 pb-2.5 pt-1">
                    {typeGroup.rows.map((row) => <FindingRowItem key={row.key} row={row} />)}
                  </div>
                </details>
              ))}
            </div>
          </details>
        ))}
      </div>

      {!filteredRows.length ? <EmptyState icon={Search} title="Bu filtrelerle eşleşen bulgu yok" description="Arama metnini veya fark filtrelerini değiştirin." /> : null}
    </div>
  );
}

function FindingRowItem({ row }: { row: FindingRow }) {
  const kindMeta = getDifferenceKindMeta(row.kindCode);
  const CategoryIcon = row.category === "schema" ? Braces : row.category === "migration" ? GitCommitHorizontal : Rows3;
  const displayName = row.childName ? `${row.objectName}.${row.childName}` : row.objectName;
  return (
    <details className={cn("group overflow-hidden rounded-xl border border-slate-700/60 border-l-2 bg-slate-900", toneAccent[kindMeta.tone])}>
      <summary className="grid cursor-pointer list-none items-center gap-x-4 gap-y-1 px-4 py-3.5 marker:hidden md:grid-cols-[minmax(220px,1fr)_minmax(200px,1.2fr)_auto]">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon className="size-4 shrink-0 text-slate-500" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-slate-100">{displayName}</span>
            <span className="mt-0.5 block truncate text-xs text-slate-500">{getObjectTypeLabel(row.objectTypeCode)}{row.childName ? ` · ${row.objectName} tablosunda` : ""} · Şema: {row.schemaLabel}</span>
          </span>
        </div>
        <div className="min-w-0 text-sm text-slate-400"><span className="line-clamp-2">{row.summary}</span></div>
        <div className="flex items-center gap-3 md:justify-end">
          <ToneBadge tone={kindMeta.tone}>{kindMeta.shortLabel}</ToneBadge>
          <ChevronDown className="size-4 text-slate-500 transition-transform group-open:rotate-180" />
        </div>
      </summary>
      <FindingDetails row={row} />
    </details>
  );
}

function FindingDetails({ row }: { row: FindingRow }) {
  const kindMeta = getDifferenceKindMeta(row.kindCode);
  return (
    <div className="border-t border-slate-700/60 bg-slate-950/40 px-4 py-5 md:px-5">
      <p className="mb-4 text-sm leading-6 text-slate-300"><span className="font-semibold text-slate-100">{kindMeta.label}:</span> {kindMeta.description}</p>
      {row.schema ? <SchemaFindingDetails finding={row.schema} /> : null}
      {row.migration ? <MigrationFindingDetails finding={row.migration} /> : null}
      {row.data ? <DataFindingDetails finding={row.data} /> : null}
    </div>
  );
}

function SchemaFindingDetails({ finding }: { finding: SchemaDifferenceDto }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm sm:grid-cols-4">
        <DetailItem label="Nesne türü" value={getObjectTypeLabel(finding.objectTypeCode)} />
        <DetailItem label="Eşleşme güveni" value={getConfidenceLabel(finding.confidenceCode)} />
        <DetailItem label="Değişen alanlar" value={finding.kindCode === "Modified" ? translateChangeSummary(finding.changeSummary) : "—"} />
        <DetailItem label="Şema" value={finding.schemaName || "—"} />
      </div>
      {(finding.sourceDefinition || finding.targetDefinition) ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <DefinitionBlock title="Kaynaktaki tanım" content={finding.sourceDefinition} />
          <DefinitionBlock title="Hedefteki tanım" content={finding.targetDefinition} />
        </div>
      ) : null}
    </div>
  );
}

function MigrationFindingDetails({ finding }: { finding: MigrationDifferenceDto }) {
  return (
    <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-5">
      <DetailItem label="Migration" value={finding.migrationId} />
      <DetailItem label="Kaynak şema" value={finding.sourceSchemaName || "—"} />
      <DetailItem label="Hedef şema" value={finding.targetSchemaName || "—"} />
      <DetailItem label="Kaynak ürün sürümü" value={finding.sourceProductVersion || "Kaynakta kayıt yok"} />
      <DetailItem label="Hedef ürün sürümü" value={finding.targetProductVersion || "Hedefte kayıt yok"} />
    </div>
  );
}

function DataFindingDetails({ finding }: { finding: DataDifferenceDto }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-sm sm:grid-cols-4">
        <DetailItem label="Kaynak satır sayısı" value={String(finding.sourceRowCount ?? "—")} />
        <DetailItem label="Hedef satır sayısı" value={String(finding.targetRowCount ?? "—")} />
        <DetailItem label="Fark" value={String(finding.rowCountDifference ?? "—")} />
        <DetailItem label="Şema" value={finding.schemaName || "—"} />
      </div>
      {finding.rowDifferences.length ? (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">Satır düzeyi farklar</div>
          <div className="space-y-2">
            {finding.rowDifferences.slice(0, 20).map((row, index) => (
              <div key={`${row.primaryKeyValue}-${index}`} className="rounded-xl border border-slate-700/60 bg-slate-900 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code className="text-xs text-sky-200">{row.primaryKeyValue}</code>
                  <ToneBadge tone={getDifferenceKindMeta(row.kindCode).tone}>{getDifferenceKindMeta(row.kindCode).shortLabel}</ToneBadge>
                </div>
                {row.valueDifferences.length ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {row.valueDifferences.map((value) => (
                      <div key={value.columnName} className="rounded-lg bg-slate-950/60 p-2.5">
                        <div className="font-medium text-slate-200">{value.columnName}</div>
                        <div className="mt-1 text-xs text-slate-400">{value.sourceValue ?? "∅"} → {value.targetValue ?? "∅"}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {finding.rowDifferences.length > 20 ? <p className="mt-2 text-xs text-slate-500">İlk 20 satır gösteriliyor.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-700/60 bg-slate-900 p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 break-words font-medium text-slate-200">{value}</div></div>;
}

function DefinitionBlock({ title, content }: { title: string; content?: string | null }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-700/60 bg-slate-950/60">
      <div className="border-b border-slate-700/60 px-3 py-2 text-xs font-semibold text-slate-400">{title}</div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words p-3 font-mono text-xs leading-5 text-slate-300">{content || "Bu tarafta tanım bulunamadı."}</pre>
    </div>
  );
}
