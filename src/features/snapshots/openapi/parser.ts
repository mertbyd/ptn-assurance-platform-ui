import { parse } from "yaml";

import type { OpenApiExplorerModel, OpenApiObject, OpenApiOperation, OpenApiParseResult } from "./types";

const httpMethods = ["get", "post", "put", "patch", "delete", "head", "options", "trace"] as const;

export function isOpenApiObject(value: unknown): value is OpenApiObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function resolveLocalReference(document: OpenApiObject, value: unknown): unknown {
  if (!isOpenApiObject(value) || typeof value.$ref !== "string" || !value.$ref.startsWith("#/")) return value;
  return value.$ref
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce<unknown>((current, part) => (isOpenApiObject(current) ? current[part] : undefined), document) ?? value;
}

function readOperation(document: OpenApiObject, path: string, method: string, pathItem: OpenApiObject): OpenApiOperation | null {
  const raw = resolveLocalReference(document, pathItem[method]);
  if (!isOpenApiObject(raw)) return null;
  const tags = readArray(raw.tags).filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()));
  const requestBody = resolveLocalReference(document, raw.requestBody);
  const responses = resolveLocalReference(document, raw.responses);
  return {
    deprecated: raw.deprecated === true,
    description: readString(raw.description),
    key: `${method}:${path}`,
    method: method.toUpperCase(),
    operationId: readString(raw.operationId) ?? `${method.toUpperCase()} ${path}`,
    parameters: [...readArray(pathItem.parameters), ...readArray(raw.parameters)],
    path,
    raw,
    requestBody: isOpenApiObject(requestBody) ? requestBody : undefined,
    responses: isOpenApiObject(responses) ? responses : {},
    security: readArray(raw.security),
    servers: readArray(raw.servers),
    summary: readString(raw.summary),
    tags,
  };
}

function buildExplorer(document: OpenApiObject, untaggedLabel: string): OpenApiExplorerModel {
  const paths = isOpenApiObject(document.paths) ? document.paths : {};
  const operations = Object.entries(paths).flatMap(([path, value]) => {
    const pathItem = resolveLocalReference(document, value);
    if (!isOpenApiObject(pathItem)) return [];
    return httpMethods.flatMap((method) => {
      const operation = readOperation(document, path, method, pathItem);
      return operation ? [operation] : [];
    });
  });
  const declaredTags = readArray(document.tags).filter(isOpenApiObject);
  const tagNames = [
    ...declaredTags.map((tag) => readString(tag.name)).filter((name): name is string => Boolean(name)),
    ...operations.flatMap((operation) => operation.tags.length ? operation.tags : [untaggedLabel]),
  ].filter((name, index, all) => all.indexOf(name) === index);
  return {
    document,
    info: isOpenApiObject(document.info) ? document.info : {},
    operations,
    servers: readArray(document.servers),
    tags: tagNames.map((name) => ({
      description: readString(declaredTags.find((tag) => tag.name === name)?.description),
      name,
      operations: operations.filter((operation) => (operation.tags.length ? operation.tags : [untaggedLabel]).includes(name)),
    })),
    version: readString(document.openapi) ?? readString(document.swagger) ?? "—",
  };
}

export function parseOpenApiContent(content: string, untaggedLabel: string): OpenApiParseResult {
  try {
    const parsed: unknown = parse(content);
    if (!isOpenApiObject(parsed) || !isOpenApiObject(parsed.paths)) return { error: "invalid-document" };
    return { model: buildExplorer(parsed, untaggedLabel) };
  } catch {
    return { error: "parse-failed" };
  }
}
