import { Accordion, Badge, Box, Stack, Text } from "@chakra-ui/react";

import { t } from "@/i18n/tr";
import { describeSchema } from "../openapi/schema-utils";
import { isOpenApiObject, readString, resolveLocalReference } from "../openapi/parser";
import type { OpenApiExplorerModel, OpenApiOperation } from "../openapi/types";
import { JsonCodeBlock } from "./json-code-block";

export function ResponseDetails({ model, operation }: { model: OpenApiExplorerModel; operation: OpenApiOperation }) {
  const responses = Object.entries(operation.responses);
  if (!responses.length) return <Text color="ink.muted" fontSize="sm">{t.snapshots.explorer.noResponses}</Text>;
  return (
    <Accordion.Root collapsible defaultValue={[responses[0][0]]} multiple variant="outline">
      {responses.map(([status, value]) => {
        const response = resolveLocalReference(model.document, value);
        const responseObject = isOpenApiObject(response) ? response : {};
        const content = isOpenApiObject(responseObject.content) ? responseObject.content : {};
        const headers = isOpenApiObject(responseObject.headers) ? responseObject.headers : {};
        return <Accordion.Item key={status} value={status}><Accordion.ItemTrigger px="4"><Badge colorPalette={status.startsWith("2") ? "green" : status.startsWith("4") || status.startsWith("5") ? "red" : "blue"}>{status}</Badge><Text flex="1" fontSize="sm" fontWeight="650" textAlign="left">{readString(responseObject.description) ?? t.snapshots.explorer.response}</Text><Accordion.ItemIndicator /></Accordion.ItemTrigger><Accordion.ItemContent><Accordion.ItemBody><Stack gap="4" pb="4"><Box><Text fontSize="xs" fontWeight="700" mb="2">{t.snapshots.explorer.headers}</Text>{Object.keys(headers).length ? <JsonCodeBlock value={headers} /> : <Text color="ink.muted" fontSize="sm">{t.common.notAvailable}</Text>}</Box>{Object.entries(content).map(([mediaType, media]) => { const mediaObject = isOpenApiObject(media) ? media : {}; return <Box key={mediaType}><Text color="accent.solid" fontFamily="mono" fontSize="xs" fontWeight="700" mb="2">{mediaType} · {describeSchema(model.document, mediaObject.schema)}</Text><JsonCodeBlock value={resolveLocalReference(model.document, mediaObject.schema)} /></Box>; })}</Stack></Accordion.ItemBody></Accordion.ItemContent></Accordion.Item>;
      })}
    </Accordion.Root>
  );
}
