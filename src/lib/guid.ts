export const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function normalizeEntityId(value: string | null | undefined): string | null {
  const candidate = value?.trim().toLowerCase() ?? "";

  if (!candidate || candidate === EMPTY_GUID || !GUID_PATTERN.test(candidate)) {
    return null;
  }

  return candidate;
}

export function requireEntityId(value: string | null | undefined, label = "Kayıt"): string {
  const id = normalizeEntityId(value);

  if (!id) {
    throw new Error(`${label} kimliği geçersiz. Lütfen listeyi yenileyip tekrar deneyin.`);
  }

  return id;
}
