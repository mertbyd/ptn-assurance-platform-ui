"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Check, Copy, TerminalSquare } from "lucide-react";
import { useMemo, useState } from "react";

import { t } from "@/i18n/tr";
import { isOpenApiObject, readString, resolveLocalReference } from "../openapi/parser";
import type { OpenApiExplorerModel, OpenApiObject, OpenApiOperation } from "../openapi/types";

function exampleValue(document: OpenApiObject, input: unknown, depth = 0): unknown {
  const schema = resolveLocalReference(document, input);
  if (!isOpenApiObject(schema) || depth > 3) return {};
  if (schema.example !== undefined) return schema.example;
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0];
  const type = readString(schema.type);
  if (type === "array") return [exampleValue(document, schema.items, depth + 1)];
  if (type === "boolean") return true;
  if (type === "integer" || type === "number") return 0;
  if (type === "string") return readString(schema.format) === "date-time" ? "2026-01-01T00:00:00Z" : "string";
  const properties = isOpenApiObject(schema.properties) ? schema.properties : {};
  return Object.fromEntries(Object.entries(properties).map(([name, value]) => [name, exampleValue(document, value, depth + 1)]));
}

function buildCurl(model: OpenApiExplorerModel, operation: OpenApiOperation) {
  const parameters = operation.parameters.map((item) => resolveLocalReference(model.document, item)).filter(isOpenApiObject);
  const query = parameters.filter((item) => item.in === "query").map((item) => `${readString(item.name) ?? "param"}=<${readString(item.name) ?? "value"}>`).join("&");
  const headers = parameters.filter((item) => item.in === "header").map((item) => `  --header '${readString(item.name) ?? "Header"}: <value>' \\`);
  const responses = Object.values(operation.responses).map((item) => resolveLocalReference(model.document, item)).filter(isOpenApiObject);
  const responseContent = responses.map((item) => item.content).find(isOpenApiObject);
  const accept = responseContent ? Object.keys(responseContent)[0] : "application/json";
  const requestContent = operation.requestBody && isOpenApiObject(operation.requestBody.content) ? operation.requestBody.content : {};
  const mediaType = Object.keys(requestContent)[0];
  const media = mediaType && isOpenApiObject(requestContent[mediaType]) ? requestContent[mediaType] : undefined;
  const url = `\${BASE_URL}${operation.path}${query ? `?${query}` : ""}`;
  const lines = [`curl --request ${operation.method} '${url}' \\`, `  --header 'Accept: ${accept}'${mediaType || headers.length ? " \\" : ""}`, ...headers];
  if (mediaType) {
    const body = JSON.stringify(exampleValue(model.document, media?.schema), null, 2).replaceAll("'", "'\\''");
    lines.push(`  --header 'Content-Type: ${mediaType}' \\`, `  --data '${body}'`);
  }
  return lines.map((line, index) => index === lines.length - 1 ? line.replace(/ \\$/, "") : line).join("\n");
}

export function CurlExample({ model, operation }: { model: OpenApiExplorerModel; operation: OpenApiOperation }) {
  const [copied, setCopied] = useState(false);
  const command = useMemo(() => buildCurl(model, operation), [model, operation]);
  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <Box bg="app.rail" borderRadius="panel" color="white" overflow="hidden">
      <Flex align="center" borderBottom="1px solid" borderColor="whiteAlpha.200" gap="3" justify="space-between" px="4" py="3">
        <Flex align="center" gap="2"><TerminalSquare color="var(--acc-colors-blue-300)" size={17} /><Box><Text fontSize="xs" fontWeight="800">{t.snapshots.explorer.curlTitle}</Text><Text color="ink.muted" fontSize="10px">{t.snapshots.explorer.curlDescription}</Text></Box></Flex>
        <Button aria-label={copied ? t.snapshots.explorer.copied : t.snapshots.explorer.copyCurl} bg="whiteAlpha.100" color="ink.strong" onClick={() => void copy()} size="xs" variant="ghost" _hover={{ bg: "whiteAlpha.200" }}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? t.snapshots.explorer.copied : t.snapshots.explorer.copy}</Button>
      </Flex>
      <Box as="pre" color="ink.strong" fontFamily="mono" fontSize="11px" lineHeight="1.7" m="0" maxH="360px" overflow="auto" p="4" tabIndex={0} whiteSpace="pre-wrap">{command}</Box>
    </Box>
  );
}
