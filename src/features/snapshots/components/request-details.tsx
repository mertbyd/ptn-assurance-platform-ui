import { Badge, Box, Table, Text, Stack } from "@chakra-ui/react";

import { t } from "@/i18n/tr";
import { describeSchema } from "../openapi/schema-utils";
import { isOpenApiObject, readString, resolveLocalReference } from "../openapi/parser";
import type { OpenApiExplorerModel, OpenApiOperation } from "../openapi/types";
import { CurlExample } from "./curl-example";
import { JsonCodeBlock } from "./json-code-block";

export function RequestDetails({ model, operation }: { model: OpenApiExplorerModel; operation: OpenApiOperation }) {
  const parameters = operation.parameters.map((item) => resolveLocalReference(model.document, item)).filter(isOpenApiObject);
  const content = operation.requestBody && isOpenApiObject(operation.requestBody.content) ? operation.requestBody.content : {};
  return (
    <Stack gap="6">
      <CurlExample model={model} operation={operation} />
      <Box><Text color="ink.strong" fontSize="sm" fontWeight="700" mb="3">{t.snapshots.explorer.parameters}</Text>{parameters.length ? (
        <Box overflowX="auto"><Table.Root size="sm" variant="line"><Table.Header><Table.Row><Table.ColumnHeader>{t.snapshots.explorer.name}</Table.ColumnHeader><Table.ColumnHeader>{t.snapshots.explorer.location}</Table.ColumnHeader><Table.ColumnHeader>{t.snapshots.explorer.required}</Table.ColumnHeader><Table.ColumnHeader>{t.snapshots.explorer.type}</Table.ColumnHeader><Table.ColumnHeader>{t.snapshots.explorer.descriptionLabel}</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{parameters.map((parameter, index) => <Table.Row key={`${String(parameter.name)}-${index}`}><Table.Cell fontWeight="650">{readString(parameter.name) ?? t.common.notAvailable}</Table.Cell><Table.Cell><Badge>{readString(parameter.in) ?? t.common.notAvailable}</Badge></Table.Cell><Table.Cell>{parameter.required === true ? t.common.yes : t.common.no}</Table.Cell><Table.Cell>{describeSchema(model.document, parameter.schema)}</Table.Cell><Table.Cell color="ink.muted" minW="220px">{readString(parameter.description) ?? t.common.notAvailable}</Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box>
      ) : <Text color="ink.muted" fontSize="sm">{t.snapshots.explorer.noParameters}</Text>}</Box>
      <Box><Text color="ink.strong" fontSize="sm" fontWeight="700" mb="3">{t.snapshots.explorer.requestBody}</Text>{operation.requestBody ? <Stack gap="3"><Badge alignSelf="flex-start" colorPalette={operation.requestBody.required === true ? "orange" : "gray"}>{operation.requestBody.required === true ? t.snapshots.explorer.bodyRequired : t.snapshots.explorer.bodyOptional}</Badge>{Object.entries(content).map(([mediaType, media]) => { const mediaObject = isOpenApiObject(media) ? media : {}; return <Box border="1px solid" borderColor="line.subtle" borderRadius="10px" key={mediaType} p="4"><Text color="accent.solid" fontFamily="mono" fontSize="xs" fontWeight="700" mb="2">{mediaType} · {describeSchema(model.document, mediaObject.schema)}</Text><JsonCodeBlock value={resolveLocalReference(model.document, mediaObject.schema)} /></Box>; })}</Stack> : <Text color="ink.muted" fontSize="sm">{t.snapshots.explorer.noRequestBody}</Text>}</Box>
    </Stack>
  );
}
