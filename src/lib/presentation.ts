export type UiTone = "default" | "neutral" | "warning" | "danger" | "success";

const objectTypeLabels: Record<string, string> = {
  Table: "Table",
  Column: "Column",
  Index: "Index",
  PrimaryKey: "Primary Key",
  ForeignKey: "Foreign Key",
  Unique: "Unique Key",
  Check: "Check Constraint",
  View: "View",
  Trigger: "Trigger",
  Procedure: "Procedure",
  Function: "Function",
  Sequence: "Sequence",
  Type: "Type",
  Extension: "Extension",
  Data: "Veri",
  Migration: "Migration",
};

const confidenceLabels: Record<string, string> = {
  Exact: "Kesin eşleşme",
  Canonical: "Normalize edilerek eşleşti",
  Approximate: "Yaklaşık eşleşme",
  Incomparable: "Karşılaştırılamadı",
};

const comparisonTypeLabels: Record<string, string> = {
  SchemaOnly: "Yalnız yapı",
  DataOnly: "Yalnız veri",
  Both: "Yapı ve veri",
};

const scopeLabels: Record<string, string> = {
  Include: "Yalnız bunu karşılaştır",
  Exclude: "Bunu kapsam dışında bırak",
  Ignore: "Bunu yok say",
  DataCompare: "Tablo verisini de kontrol et",
};

const changePartLabels: Record<string, string> = {
  DataType: "veri tipi",
  Nullable: "boş değer izni",
  MaxLength: "maksimum uzunluk",
  NumericPrecision: "sayısal hassasiyet",
  NumericScale: "ondalık basamak",
  Identity: "otomatik artış",
  Default: "varsayılan değer",
  Unique: "benzersizlik",
  PrimaryKey: "birincil anahtar",
  Columns: "kolonlar",
  IncludedColumns: "dahil edilen kolonlar",
  Filter: "filtre",
  Definition: "tanım",
  ReferencedTable: "bağlı tablo",
  ReferencedColumns: "bağlı kolonlar",
  DeleteAction: "silme davranışı",
  UpdateAction: "güncelleme davranışı",
};

export function getObjectTypeLabel(code?: string | null) {
  if (!code) return "Bilinmeyen tür";
  return objectTypeLabels[code] ?? code;
}

export function getConfidenceLabel(code?: string | null) {
  if (!code) return "Belirtilmedi";
  return confidenceLabels[code] ?? code;
}

export function getComparisonTypeLabel(code?: string | null, fallback?: string | null) {
  if (!code) return fallback || "Belirtilmedi";
  return comparisonTypeLabels[code] ?? fallback ?? code;
}

export function getScopeLabel(code?: string | null) {
  if (!code) return "Kural belirtilmedi";
  return scopeLabels[code] ?? code;
}

export function getDifferenceKindMeta(code?: string | null): {
  label: string;
  shortLabel: string;
  description: string;
  tone: UiTone;
} {
  switch (code) {
    case "OnlyInSource":
      return {
        label: "Hedefte eksik",
        shortLabel: "Eksik",
        description: "Referans veritabanında var, incelenen hedefte yok.",
        tone: "warning",
      };
    case "OnlyInTarget":
      return {
        label: "Hedefte fazladan",
        shortLabel: "Fazladan",
        description: "İncelenen hedefte var, referans veritabanında yok.",
        tone: "default",
      };
    case "Modified":
      return {
        label: "İki tarafta farklı",
        shortLabel: "Değişmiş",
        description: "Nesne iki tarafta da var ancak tanımı veya özellikleri farklı.",
        tone: "danger",
      };
    default:
      return {
        label: code || "Fark türü bilinmiyor",
        shortLabel: code || "Bilinmiyor",
        description: "Bu fark türü için açıklama bulunamadı.",
        tone: "neutral",
      };
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDuration(startedAt?: string | null, completedAt?: string | null) {
  if (!startedAt || !completedAt) return "—";
  const duration = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  if (!Number.isFinite(duration) || duration < 0) return "—";
  if (duration < 1_000) return `${duration} ms`;
  if (duration < 60_000) return `${(duration / 1_000).toFixed(duration < 10_000 ? 1 : 0)} sn`;
  return `${Math.floor(duration / 60_000)} dk ${Math.round((duration % 60_000) / 1_000)} sn`;
}

export function translateChangeSummary(value?: string | null) {
  if (!value) return "Tanım değişmiş";
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => changePartLabels[part] ?? part)
    .join(", ");
}

export function getStatusTone(code?: string | null): "outline" | "solid" | "subtle" | "surface" {
  if (!code) return "outline";
  const lower = code.toLowerCase();
  if (lower.includes("success") || lower.includes("pass") || lower.includes("active")) return "solid";
  if (lower.includes("warn") || lower.includes("pending")) return "surface";
  if (lower.includes("fail") || lower.includes("error") || lower.includes("passivate")) return "subtle";
  return "outline";
}

export function searchable(text?: string | null): string {
  return (text || "").toLowerCase().trim();
}
