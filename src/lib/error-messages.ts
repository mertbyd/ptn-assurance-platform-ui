export function extractUserMessage(error: unknown, fallback = "Beklenmeyen bir sistem hatası gerçekleşti."): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "error" in error) {
    const nested = (error as { error?: { message?: unknown } }).error?.message;
    if (typeof nested === "string") return nested;
  }
  return fallback;
}
