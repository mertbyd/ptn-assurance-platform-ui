import { t } from "@/i18n/tr";

export const severityPalette: Record<string, string> = { breaking: "red", "docs-only": "gray", "non-breaking": "green" };

// Backend kararli kodu doner; ekranda okunabilir karsiligi sozlukten gelir, karsiligi yoksa kod bozulmadan gosterilir.
function resolve(labels: Record<string, string>, code?: string | null) {
  if (!code) return t.common.notAvailable;
  return labels[code] ?? code;
}

export function severityLabel(code?: string | null) {
  return resolve(t.checks.severityLabels, code);
}

export function directionLabel(code?: string | null) {
  return resolve(t.checks.directionLabels, code);
}

export function kindLabel(code?: string | null) {
  return resolve(t.checks.kindLabels, code);
}
