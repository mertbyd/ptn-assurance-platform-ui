const dateTimeFormatter = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });
const numberFormatter = new Intl.NumberFormat("tr-TR");

export function formatDateTime(value?: string): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

export function formatBytes(value?: number): string {
  return typeof value === "number" ? `${numberFormatter.format(value)} B` : "—";
}
