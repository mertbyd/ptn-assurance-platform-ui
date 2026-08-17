import { isOpenApiObject, readArray, readString, resolveLocalReference } from "./parser";
import type { OpenApiObject } from "./types";

export function getReferenceName(value: unknown): string | undefined {
  if (!isOpenApiObject(value) || typeof value.$ref !== "string") return undefined;
  return value.$ref.split("/").at(-1);
}

export function describeSchema(document: OpenApiObject, value: unknown): string {
  const referenceName = getReferenceName(value);
  const resolved = resolveLocalReference(document, value);
  if (!isOpenApiObject(resolved)) return "—";
  const types = readArray(resolved.type).filter((item): item is string => typeof item === "string");
  const type = readString(resolved.type) ?? (types.length ? types.join(" | ") : undefined);
  if (referenceName) return referenceName;
  if (type === "array") return `array<${describeSchema(document, resolved.items)}>`;
  return type ?? (isOpenApiObject(resolved.properties) ? "object" : "schema");
}

export function collectReferencedSchemas(document: OpenApiObject, root: unknown): Array<{ name: string; schema: unknown }> {
  const found = new Map<string, unknown>();
  const visited = new Set<unknown>();
  const visit = (value: unknown) => {
    if (!value || visited.has(value)) return;
    if (typeof value === "object") visited.add(value);
    const name = getReferenceName(value);
    if (name) {
      const resolved = resolveLocalReference(document, value);
      if (!found.has(name)) found.set(name, resolved);
      visit(resolved);
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
    else if (isOpenApiObject(value)) Object.values(value).forEach(visit);
  };
  visit(root);
  return [...found].map(([name, schema]) => ({ name, schema }));
}
