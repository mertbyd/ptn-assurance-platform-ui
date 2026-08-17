"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Braces, Eye, KeyRound, Link2, Maximize2, MousePointerClick, Table2, Zap } from "lucide-react";
import { getObjectTypeLabel } from "@/lib/presentation";
import { cn } from "@/lib/utils";
import type { ComparisonFindingsDto, SchemaObjectDefinitionDto, SchemaSnapshotDto, SchemaTableDto } from "@/types";

export type SchemaDiffKind = "OnlyInSource" | "OnlyInTarget" | "Modified";

/**
 * Fark bilgisi tablo ve kolon seviyesinde ayri gelir. Anahtarlar kucuk harfe
 * cevrilmis `sema.tablo` ve `sema.tablo.kolon` bicimindedir; backend'den gelen
 * isimlerin buyuk/kucuk harf tutarsizligina karsi normalize edilir.
 */
export interface SchemaDiagramDiff {
  tables: Record<string, SchemaDiffKind>;
  columns: Record<string, SchemaDiffKind>;
  tableChildren: Record<string, DiagramObjectDifference[]>;
  objects: Record<string, SchemaDiffKind>;
}

interface DiagramObjectDifference {
  name: string;
  objectTypeCode: string;
  diffKind: SchemaDiffKind;
}

const NODE_WIDTH = 320;
const HEADER_HEIGHT = 68;
const ROW_HEIGHT = 32;
const FOOTER_HEIGHT = 30;
const MAX_VISIBLE_COLUMNS = 10;
const COLUMN_GAP = 150;
const SUB_COLUMN_GAP = 48;
const ROW_GAP = 44;
/**
 * FK'si olmayan tablolarin hepsi ayni derinlige duser; tek sutuna dizilirlerse
 * grafik binlerce piksel uzayip fitView'i okunamaz olcege zorluyor. Bir sutun
 * bu yuksekligi asinca ayni derinlik icinde yan sutuna sariyoruz.
 */
const MAX_COLUMN_HEIGHT = 1500;

const diffTone: Record<SchemaDiffKind, { border: string; header: string; row: string; dot: string; badge: string; label: string; shortLabel: string }> = {
  OnlyInSource: {
    border: "border-rose-500/70",
    header: "bg-rose-500/15 text-rose-100",
    row: "bg-rose-500/10 text-rose-100",
    dot: "bg-rose-400",
    badge: "border-rose-400/40 bg-rose-400/15 text-rose-100",
    label: "Hedefte eksik",
    shortLabel: "Eksik",
  },
  OnlyInTarget: {
    border: "border-sky-500/70",
    header: "bg-sky-500/15 text-sky-100",
    row: "bg-sky-500/10 text-sky-100",
    dot: "bg-sky-400",
    badge: "border-sky-400/40 bg-sky-400/15 text-sky-100",
    label: "Hedefte fazladan",
    shortLabel: "Fazladan",
  },
  Modified: {
    border: "border-amber-500/70",
    header: "bg-amber-500/15 text-amber-100",
    row: "bg-amber-500/10 text-amber-100",
    dot: "bg-amber-400",
    badge: "border-amber-400/40 bg-amber-400/15 text-amber-100",
    label: "İki tarafta farklı",
    shortLabel: "Değişmiş",
  },
};

export function diagramTableKey(table: Pick<SchemaTableDto, "schema" | "name">) {
  return `table:${table.schema}.${table.name}`;
}

export function diagramObjectKey(object: Pick<SchemaObjectDefinitionDto, "schema" | "name" | "objectTypeCode">) {
  return `object:${object.schema}.${object.name}.${object.objectTypeCode}`;
}

function objectDiffKey(object: Pick<SchemaObjectDefinitionDto, "schema" | "name" | "objectTypeCode">) {
  return `${object.schema}.${object.name}.${object.objectTypeCode}`.toLowerCase();
}

function mergeByKey<T>(left: T[], right: T[], keyOf: (item: T) => string) {
  const merged = new Map<string, T>();
  left.forEach((item) => merged.set(keyOf(item), item));
  right.forEach((item) => {
    if (!merged.has(keyOf(item))) merged.set(keyOf(item), item);
  });
  return Array.from(merged.values());
}

/**
 * Iki snapshot'i tek bir sema haline getirir: birlesim alinir, boylece yalnizca
 * bir tarafta olan tablo/kolonlar da diyagramda cizilip renklenebilir.
 * Kaynak taraf onceliklidir; hedefte fazladan olanlar sona eklenir.
 */
export function mergeSnapshotTables(source: SchemaSnapshotDto, target: SchemaSnapshotDto): SchemaTableDto[] {
  const qualify = (table: SchemaTableDto) => `${table.schema}.${table.name}`.toLowerCase();

  return mergeByKey(source.tables, target.tables, qualify).map((table) => {
    const key = qualify(table);
    const sourceTable = source.tables.find((candidate) => qualify(candidate) === key);
    const targetTable = target.tables.find((candidate) => qualify(candidate) === key);
    if (!sourceTable || !targetTable) return table;

    return {
      ...sourceTable,
      columns: mergeByKey(sourceTable.columns, targetTable.columns, (column) => column.name.toLowerCase()),
      constraints: mergeByKey(sourceTable.constraints, targetTable.constraints, (constraint) => `${constraint.typeCode}:${constraint.name}`.toLowerCase()),
    };
  });
}

/** Iki snapshot'taki view/function/procedure gibi tablo disi nesnelerin birlesimi. */
export function mergeSnapshotObjects(source: SchemaSnapshotDto, target: SchemaSnapshotDto): SchemaObjectDefinitionDto[] {
  return mergeByKey(source.objects, target.objects, objectDiffKey);
}

function asDiffKind(kindCode: string): SchemaDiffKind | undefined {
  return kindCode === "OnlyInSource" || kindCode === "OnlyInTarget" || kindCode === "Modified" ? kindCode : undefined;
}

/**
 * Bulgulari diyagramin anlayacagi renk haritasina cevirir. Kolon farki olup
 * tablo seviyesinde bulgusu olmayan tablolar "Modified" sayilir; aksi halde
 * uzaklasip bakildiginda icinde fark olan tablo notr gorunurdu.
 */
export function buildDiagramDiff(findings: ComparisonFindingsDto): SchemaDiagramDiff {
  const tables: Record<string, SchemaDiffKind> = {};
  const columns: Record<string, SchemaDiffKind> = {};
  const tableChildren: Record<string, DiagramObjectDifference[]> = {};
  const objects: Record<string, SchemaDiffKind> = {};
  const touchedTables = new Set<string>();

  findings.schemaDifferences.forEach((difference) => {
    const kind = asDiffKind(difference.kindCode);
    if (!kind) return;
    const tableKey = `${difference.schemaName}.${difference.objectName}`.toLowerCase();

    if (difference.objectTypeCode === "Table" && !difference.childName) {
      tables[tableKey] = kind;
      return;
    }

    if (difference.objectTypeCode === "Column" && difference.childName) {
      touchedTables.add(tableKey);
      columns[`${tableKey}.${difference.childName.toLowerCase()}`] = kind;
      return;
    }

    if (difference.childName) {
      touchedTables.add(tableKey);
      const children = tableChildren[tableKey] ?? [];
      children.push({
        name: difference.childName,
        objectTypeCode: difference.objectTypeCode,
        diffKind: kind,
      });
      tableChildren[tableKey] = children;
      return;
    }

    objects[`${difference.schemaName}.${difference.objectName}.${difference.objectTypeCode}`.toLowerCase()] = kind;
  });

  touchedTables.forEach((tableKey) => {
    if (!tables[tableKey]) tables[tableKey] = "Modified";
  });

  return { tables, columns, tableChildren, objects };
}

interface DiagramRow {
  name: string;
  rawDataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  diffKind?: SchemaDiffKind;
}

type TableNodeData = {
  schema: string;
  name: string;
  columnCount: number;
  rows: DiagramRow[];
  relatedDifferences: DiagramObjectDifference[];
  hiddenCount: number;
  diffKind?: SchemaDiffKind;
  differenceCount: number;
};

type TableNode = Node<TableNodeData, "table">;

type ObjectNodeData = {
  schema: string;
  name: string;
  objectTypeCode: string;
  diffKind?: SchemaDiffKind;
};

type ObjectNode = Node<ObjectNodeData, "object">;
type DiagramNode = TableNode | ObjectNode;

function nodeHeight(data: TableNodeData) {
  return HEADER_HEIGHT
    + data.rows.length * ROW_HEIGHT
    + data.relatedDifferences.length * ROW_HEIGHT
    + (data.hiddenCount ? FOOTER_HEIGHT : 0)
    + 8;
}

/** SQL Server `[dbo].[Users]` gibi tirnakli isimleri sade metne indirger. */
function unquote(value: string) {
  return value.trim().replace(/[[\]"`]/g, "");
}

function buildLookup(tables: SchemaTableDto[]) {
  const byQualified = new Map<string, string>();
  const byName = new Map<string, string[]>();
  tables.forEach((table) => {
    const key = diagramTableKey(table);
    byQualified.set(`${table.schema}.${table.name}`.toLowerCase(), key);
    const sameName = byName.get(table.name.toLowerCase()) ?? [];
    sameName.push(key);
    byName.set(table.name.toLowerCase(), sameName);
  });
  return { byQualified, byName };
}

/**
 * `referencedTable` bazen `sema.tablo`, bazen yalin tablo adi olarak gelir.
 * Yalin geldiginde once FK'yi tanimlayan tablonun semasina bakariz; oradaki
 * ad benzersiz degilse baglanti cizilmez (yanlis tabloyu baglamaktansa hic
 * baglamamak dogru).
 */
function resolveReferenced(
  referencedTable: string,
  sourceSchema: string,
  lookup: ReturnType<typeof buildLookup>,
) {
  const lower = unquote(referencedTable).toLowerCase();
  if (!lower) return undefined;

  if (lower.includes(".")) {
    const direct = lookup.byQualified.get(lower);
    if (direct) return direct;
    const bareName = lower.slice(lower.lastIndexOf(".") + 1);
    const candidates = lookup.byName.get(bareName);
    return candidates?.length === 1 ? candidates[0] : undefined;
  }

  const sameSchema = lookup.byQualified.get(`${sourceSchema.toLowerCase()}.${lower}`);
  if (sameSchema) return sameSchema;
  const candidates = lookup.byName.get(lower);
  return candidates?.length === 1 ? candidates[0] : undefined;
}

function pickRows(table: SchemaTableDto, columnDiffs: Map<string, SchemaDiffKind>) {
  const primaryKeyColumns = new Set<string>();
  const foreignKeyColumns = new Set<string>();
  table.constraints.forEach((constraint) => {
    const target = constraint.typeCode === "PrimaryKey" ? primaryKeyColumns : constraint.typeCode === "ForeignKey" ? foreignKeyColumns : null;
    if (target) constraint.columns.forEach((column) => target.add(column.toLowerCase()));
  });

  const toRow = (column: SchemaTableDto["columns"][number]): DiagramRow => ({
    name: column.name,
    rawDataType: column.rawDataType,
    isNullable: column.isNullable,
    isPrimaryKey: primaryKeyColumns.has(column.name.toLowerCase()),
    isForeignKey: foreignKeyColumns.has(column.name.toLowerCase()),
    diffKind: columnDiffs.get(column.name.toLowerCase()),
  });

  if (table.columns.length <= MAX_VISIBLE_COLUMNS) {
    return { rows: table.columns.map(toRow), hiddenCount: 0 };
  }

  // Kutuya sigmayan tablolarda farkli kolonlar oncelikli gosterilir, ama
  // sutun sirasi bozulmaz: once hangi kolonlarin gorunecegine karar verip
  // sonra tabloyu kendi ordinal sirasinda suzuyoruz.
  const keep = new Set<string>();
  table.columns.forEach((column) => {
    if (keep.size < MAX_VISIBLE_COLUMNS && columnDiffs.has(column.name.toLowerCase())) keep.add(column.name);
  });
  table.columns.forEach((column) => {
    if (keep.size < MAX_VISIBLE_COLUMNS) keep.add(column.name);
  });

  const rows = table.columns.filter((column) => keep.has(column.name)).map(toRow);
  return { rows, hiddenCount: table.columns.length - rows.length };
}

/** Referans verilen tablo, referans veren tablonun soluna dusecek sekilde derinlik atar. */
function computeDepths(keys: string[], parentsOf: Map<string, Set<string>>) {
  const depth = new Map<string, number>();
  const visiting = new Set<string>();

  function walk(key: string): number {
    const cached = depth.get(key);
    if (cached !== undefined) return cached;
    if (visiting.has(key)) return 0; // dairesel FK zincirini kir
    visiting.add(key);
    let value = 0;
    (parentsOf.get(key) ?? new Set()).forEach((parent) => {
      if (parent !== key) value = Math.max(value, walk(parent) + 1);
    });
    visiting.delete(key);
    depth.set(key, value);
    return value;
  }

  keys.forEach(walk);
  return depth;
}

function buildGraph(tables: SchemaTableDto[], objects: SchemaObjectDefinitionDto[], diff?: SchemaDiagramDiff) {
  const lookup = buildLookup(tables);
  const parentsOf = new Map<string, Set<string>>();
  const edges: Edge[] = [];

  tables.forEach((table) => {
    const childKey = diagramTableKey(table);
    table.constraints.forEach((constraint) => {
      if (constraint.typeCode !== "ForeignKey" || !constraint.referencedTable) return;
      const parentKey = resolveReferenced(constraint.referencedTable, table.schema, lookup);
      if (!parentKey || parentKey === childKey) return;

      if (!parentsOf.has(childKey)) parentsOf.set(childKey, new Set());
      parentsOf.get(childKey)!.add(parentKey);

      edges.push({
        id: `fk:${childKey}:${constraint.name}`,
        source: parentKey,
        target: childKey,
        label: constraint.columns.join(", "),
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "#64748b" },
        style: { stroke: "#64748b", strokeWidth: 1.5 },
        labelStyle: { fill: "#94a3b8", fontSize: 10 },
        labelBgStyle: { fill: "#0f172a", fillOpacity: 0.85 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
      });
    });
  });

  const keys = tables.map(diagramTableKey);
  const depths = computeDepths(keys, parentsOf);

  const prepared = tables
    .slice()
    .sort((left, right) => `${left.schema}.${left.name}`.localeCompare(`${right.schema}.${right.name}`, "tr"))
    .map((table) => {
      const key = diagramTableKey(table);
      const qualified = `${table.schema}.${table.name}`.toLowerCase();

      const columnDiffs = new Map<string, SchemaDiffKind>();
      if (diff) {
        const prefix = `${qualified}.`;
        Object.entries(diff.columns).forEach(([columnKey, kind]) => {
          if (columnKey.startsWith(prefix)) columnDiffs.set(columnKey.slice(prefix.length), kind);
        });
      }

      const { rows, hiddenCount } = pickRows(table, columnDiffs);
      const relatedDifferences = diff?.tableChildren[qualified] ?? [];
      const data: TableNodeData = {
        schema: table.schema,
        name: table.name,
        columnCount: table.columns.length,
        rows,
        relatedDifferences,
        hiddenCount,
        diffKind: diff?.tables[qualified],
        differenceCount: columnDiffs.size + relatedDifferences.length || (diff?.tables[qualified] ? 1 : 0),
      };

      return { key, data, depth: depths.get(key) ?? 0 };
    });

  const byDepth = new Map<number, typeof prepared>();
  prepared.forEach((item) => {
    const bucket = byDepth.get(item.depth) ?? [];
    bucket.push(item);
    byDepth.set(item.depth, bucket);
  });

  // Derinlikler soldan saga sirayla yerlesir; bir derinlik birden fazla alt
  // sutuna tasarsa sonraki derinlik onlarin tamamindan sonra baslar, boylece
  // "referans verilen tablo solda" kurali bozulmaz.
  // Tablo disi nesneleri semanin en sagina atmak buyuk veritabanlarinda
  // gorunmez hale getiriyordu. Onlari diyagramin basindaki iki sutunlu seritte
  // tutup tablolar icin bunun altinda guvenli bir alan birakiyoruz.
  const objectRowCount = Math.ceil(objects.length / 2);
  const objectLaneHeight = objectRowCount > 0
    ? objectRowCount * HEADER_HEIGHT + objectRowCount * ROW_GAP
    : 0;
  const positions = new Map<string, { x: number; y: number }>();
  let xCursor = 0;
  Array.from(byDepth.keys())
    .sort((left, right) => left - right)
    .forEach((depth) => {
      let columnX = xCursor;
      let y = 0;
      let lastColumnX = xCursor;

      byDepth.get(depth)!.forEach((item) => {
        const height = nodeHeight(item.data);
        if (y > 0 && y + height > MAX_COLUMN_HEIGHT) {
          columnX += NODE_WIDTH + SUB_COLUMN_GAP;
          y = 0;
        }
        positions.set(item.key, { x: columnX, y: objectLaneHeight + y });
        y += height + ROW_GAP;
        lastColumnX = columnX;
      });

      xCursor = lastColumnX + NODE_WIDTH + COLUMN_GAP;
    });

  const tableNodes: TableNode[] = prepared.map((item) => ({
    id: item.key,
    type: "table" as const,
    position: positions.get(item.key) ?? { x: 0, y: 0 },
    data: item.data,
  }));

  // View/function/procedure gibi tablo disi nesnelerin FK kenari yoktur; yine de
  // diyagramin ilk gorunen bolumunde kalir ve ayrinti panelini acabilirler.
  const objectNodes: ObjectNode[] = objects
    .slice()
    .sort((left, right) => `${left.schema}.${left.name}`.localeCompare(`${right.schema}.${right.name}`, "tr"))
    .map((object, index) => ({
      id: diagramObjectKey(object),
      type: "object" as const,
      position: {
        x: (index % 2) * (NODE_WIDTH + SUB_COLUMN_GAP),
        y: Math.floor(index / 2) * (HEADER_HEIGHT + ROW_GAP),
      },
      data: {
        schema: object.schema,
        name: object.name,
        objectTypeCode: object.objectTypeCode,
        diffKind: diff?.objects[objectDiffKey(object)],
      },
    }));

  const drawnKeys = new Set(keys);
  return { nodes: [...tableNodes, ...objectNodes] as DiagramNode[], edges: edges.filter((edge) => drawnKeys.has(edge.source) && drawnKeys.has(edge.target)) };
}

function TableNodeView({ data, selected }: NodeProps<TableNode>) {
  const tone = data.diffKind ? diffTone[data.diffKind] : null;
  return (
    <div
      data-diagram-table={`${data.schema}.${data.name}`}
      className={cn(
        "overflow-hidden rounded-xl border-2 bg-slate-900 shadow-[0_10px_36px_rgba(0,0,0,0.35)]",
        tone?.border ?? "border-slate-700",
        selected && "ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950",
      )}
      style={{ width: NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Left} className="!size-2 !border-slate-600 !bg-slate-500" />
      <Handle type="source" position={Position.Right} className="!size-2 !border-slate-600 !bg-slate-500" />

      <div className={cn("flex min-h-[68px] items-center gap-2 px-3.5 py-3", tone?.header ?? "bg-slate-800/80 text-slate-100")}>
        <Table2 className="size-4 shrink-0 opacity-80" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold leading-tight">{data.name}</div>
          <div className="mt-1 truncate text-[11px] opacity-70">{data.schema} · {data.columnCount} kolon</div>
        </div>
        {tone ? (
          <span className={cn("shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide", tone.badge)}>
            {tone.shortLabel}
          </span>
        ) : null}
      </div>

      <div>
        {data.rows.map((row) => {
          const rowTone = row.diffKind ? diffTone[row.diffKind] : null;
          return (
            <div
              key={row.name}
              className={cn(
                "flex items-center gap-2 border-t border-slate-800 px-3.5 text-xs",
                rowTone?.row ?? "text-slate-300",
              )}
              style={{ height: ROW_HEIGHT }}
            >
              {row.isPrimaryKey ? <KeyRound className="size-3 shrink-0 text-amber-400" /> : row.isForeignKey ? <Link2 className="size-3 shrink-0 text-sky-400" /> : <span className="size-3 shrink-0" />}
              <span className={cn("min-w-0 flex-1 truncate", row.isPrimaryKey && "font-semibold")}>{row.name}</span>
              {rowTone ? <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", rowTone.badge)}>{rowTone.shortLabel}</span> : null}
              <span className="shrink-0 truncate text-[10px] opacity-60" style={{ maxWidth: 92 }}>{row.rawDataType}{row.isNullable ? "" : " ·"}</span>
            </div>
          );
        })}
        {data.relatedDifferences.map((difference) => {
          const relatedTone = diffTone[difference.diffKind];
          return (
            <div key={`${difference.objectTypeCode}:${difference.name}`} className={cn("flex items-center gap-2 border-t border-slate-800 px-3.5 text-xs", relatedTone.row)} style={{ height: ROW_HEIGHT }}>
              <Zap className="size-3 shrink-0 opacity-80" />
              <span className="shrink-0 text-[10px] font-semibold uppercase text-slate-400">{getObjectTypeLabel(difference.objectTypeCode)}</span>
              <span className="min-w-0 flex-1 truncate font-medium">{difference.name}</span>
              <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase", relatedTone.badge)}>{relatedTone.shortLabel}</span>
            </div>
          );
        })}
        {data.hiddenCount ? (
          <div className="border-t border-slate-800 px-3.5 text-[11px] font-medium text-slate-400" style={{ height: FOOTER_HEIGHT, lineHeight: `${FOOTER_HEIGHT}px` }}>
            +{data.hiddenCount} kolon daha — kutuya tıklayın
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ObjectNodeView({ data, selected }: NodeProps<ObjectNode>) {
  const tone = data.diffKind ? diffTone[data.diffKind] : null;
  return (
    <div data-diagram-object={`${data.schema}.${data.name}.${data.objectTypeCode}`} className={cn("overflow-hidden rounded-xl border-2 bg-slate-900 shadow-[0_10px_36px_rgba(0,0,0,0.35)]", tone?.border ?? "border-violet-500/45", selected && "ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-950")} style={{ width: NODE_WIDTH }}>
      <div className={cn("flex min-h-[68px] items-center gap-3 px-3.5 py-3", tone?.header ?? "bg-violet-500/10 text-slate-100")}>
        <Braces className="size-4 shrink-0 text-violet-300" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold leading-tight">{data.name}</div>
          <div className="mt-1 truncate text-[11px] opacity-70">{data.schema} · {getObjectTypeLabel(data.objectTypeCode)}</div>
        </div>
        {tone ? <span className={cn("shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wide", tone.badge)}>{tone.shortLabel}</span> : null}
      </div>
    </div>
  );
}

const nodeTypes: NodeTypes = { table: TableNodeView, object: ObjectNodeView };

interface SchemaDiagramProps {
  tables: SchemaTableDto[];
  objects?: SchemaObjectDefinitionDto[];
  selectedKey?: string;
  onSelectNode?: (key: string) => void;
  diff?: SchemaDiagramDiff;
  className?: string;
  defaultShowOnlyDifferences?: boolean;
}

export function SchemaDiagram({ tables, objects = [], selectedKey, onSelectNode, diff, className, defaultShowOnlyDifferences = false }: SchemaDiagramProps) {
  const differentTableKeys = useMemo(() => new Set(
    diff
      ? tables
          .filter((table) => diff.tables[`${table.schema}.${table.name}`.toLowerCase()])
          .map(diagramTableKey)
      : [],
  ), [diff, tables]);
  const differentObjectKeys = useMemo(() => new Set(
    diff
      ? objects.filter((object) => diff.objects[objectDiffKey(object)]).map(diagramObjectKey)
      : [],
  ), [diff, objects]);
  const differenceNodeCount = differentTableKeys.size + differentObjectKeys.size;
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(defaultShowOnlyDifferences && differenceNodeCount > 0);
  const flowRef = useRef<ReactFlowInstance<DiagramNode, Edge> | null>(null);
  const visibleTables = useMemo(() => {
    if (!showOnlyDifferences || !diff || !differenceNodeCount) return tables;
    return tables.filter((table) => differentTableKeys.has(diagramTableKey(table)));
  }, [diff, differenceNodeCount, differentTableKeys, showOnlyDifferences, tables]);
  const visibleObjects = useMemo(() => {
    if (!showOnlyDifferences || !diff || !differenceNodeCount) return objects;
    return objects.filter((object) => differentObjectKeys.has(diagramObjectKey(object)));
  }, [diff, differenceNodeCount, differentObjectKeys, objects, showOnlyDifferences]);
  const graph = useMemo(() => buildGraph(visibleTables, visibleObjects, diff), [visibleTables, visibleObjects, diff]);
  const [nodes, setNodes, onNodesChange] = useNodesState<DiagramNode>(graph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges);

  useEffect(() => {
    setNodes(graph.nodes);
    setEdges(graph.edges);
    requestAnimationFrame(() => void flowRef.current?.fitView({ padding: 0.18, minZoom: 0.38, maxZoom: 1 }));
  }, [graph, setNodes, setEdges]);

  useEffect(() => {
    setNodes((current) => current.map((node) => (node.selected === (node.id === selectedKey) ? node : { ...node, selected: node.id === selectedKey })));
  }, [selectedKey, setNodes]);

  const handleNodeClick = useCallback((_event: unknown, node: DiagramNode) => onSelectNode?.(node.id), [onSelectNode]);
  const handleFindNode = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const key = event.target.value;
    if (!key) return;

    const node = nodes.find((candidate) => candidate.id === key);
    if (!node) return;

    onSelectNode?.(key);
    requestAnimationFrame(() => void flowRef.current?.fitView({
      nodes: [node],
      padding: 0.9,
      minZoom: 0.78,
      maxZoom: 1,
      duration: 350,
    }));
  }, [nodes, onSelectNode]);

  const selectedVisibleKey = selectedKey && nodes.some((node) => node.id === selectedKey) ? selectedKey : "";

  return (
    <div className={cn("flex h-full w-full flex-col bg-slate-950/25", className)}>
      <div className="relative z-20 flex shrink-0 flex-col gap-3 border-b border-slate-700/70 bg-slate-900/95 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-100"><MousePointerClick className="size-4 text-sky-300" />Nesneye tıklayın, ayrıntısını görün</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">Boş alanda sürükleyerek gezin; farenizin tekerleğiyle yakınlaştırın.</div>
          <div className="mt-2"><SchemaDiagramLegend showDiffKinds={Boolean(diff)} /></div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2">
          <select
            aria-label="Diyagramda nesne bul"
            value={selectedVisibleKey}
            onChange={handleFindNode}
            className="min-h-10 min-w-56 flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-slate-100 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/25"
          >
            <option value="">Nesne bul…</option>
            {visibleObjects.length ? (
              <optgroup label="View ve diğer nesneler">
                {visibleObjects.map((object) => (
                  <option key={diagramObjectKey(object)} value={diagramObjectKey(object)}>
                    {getObjectTypeLabel(object.objectTypeCode)} · {object.schema}.{object.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {visibleTables.length ? (
              <optgroup label="Tablolar">
                {visibleTables.map((table) => (
                  <option key={diagramTableKey(table)} value={diagramTableKey(table)}>
                    Tablo · {table.schema}.{table.name}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
          {diff && differenceNodeCount ? (
            <button type="button" onClick={() => setShowOnlyDifferences((current) => !current)} aria-pressed={showOnlyDifferences} className={cn("inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition-colors", showOnlyDifferences ? "border-amber-400/50 bg-amber-400/15 text-amber-100" : "border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700")}>
              <Eye className="size-4" />{showOnlyDifferences ? `${differenceNodeCount} farklı nesne gösteriliyor` : "Yalnızca farkları göster"}
            </button>
          ) : null}
          <button type="button" onClick={() => void flowRef.current?.fitView({ padding: 0.18, minZoom: 0.38, maxZoom: 1 })} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700">
            <Maximize2 className="size-4" />Diyagramı ekrana sığdır
          </button>
        </div>
      </div>
      <div className="relative z-0 min-h-0 flex-1 overflow-hidden">
        <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onInit={(instance) => { flowRef.current = instance; }}
        colorMode="dark"
        fitView
        // Genis semalarda fitView her seyi sigdirmak icin okunamaz bir olcege
        // kadar kucultuyor; alt sinir koyup gezinmeyi kullaniciya birakiyoruz.
        fitViewOptions={{ padding: 0.18, minZoom: 0.38, maxZoom: 1 }}
        minZoom={0.12}
        proOptions={{ hideAttribution: false }}
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#1e293b" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={(node) => {
          const kind = (node.data as TableNodeData | ObjectNodeData).diffKind;
          if (kind === "OnlyInSource") return "#f43f5e";
          if (kind === "OnlyInTarget") return "#0ea5e9";
          if (kind === "Modified") return "#f59e0b";
          return "#475569";
        }} maskColor="rgba(2,6,23,0.7)" className="!bg-slate-900" />
        </ReactFlow>
      </div>
    </div>
  );
}

export function SchemaDiagramLegend({ showDiffKinds = false }: { showDiffKinds?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-400">
      {showDiffKinds
        ? (Object.keys(diffTone) as SchemaDiffKind[]).map((kind) => (
            <span key={kind} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", diffTone[kind].dot)} />
              {diffTone[kind].label}
            </span>
          ))
        : null}
      {showDiffKinds ? <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-600" />Fark yok</span> : null}
      <span className="flex items-center gap-1.5"><KeyRound className="size-3 text-amber-400" />Birincil anahtar</span>
      <span className="flex items-center gap-1.5"><Link2 className="size-3 text-sky-400" />Yabancı anahtar</span>
    </div>
  );
}
