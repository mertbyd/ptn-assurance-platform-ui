import { Box, Stack, Text } from "@chakra-ui/react";

import { t } from "@/i18n/tr";
import { collectReferencedSchemas } from "../openapi/schema-utils";
import type { OpenApiExplorerModel, OpenApiOperation } from "../openapi/types";
import { JsonCodeBlock } from "./json-code-block";

export function SchemaDetails({ model, operation }: { model: OpenApiExplorerModel; operation: OpenApiOperation }) {
  const schemas = collectReferencedSchemas(model.document, operation.raw);
  if (!schemas.length) return <Text color="ink.muted" fontSize="sm">{t.snapshots.explorer.noSchemas}</Text>;
  return <Stack gap="4">{schemas.map(({ name, schema }) => <Box border="1px solid" borderColor="line.subtle" borderRadius="10px" key={name} overflow="hidden"><Text bg="app.subtle" borderBottom="1px solid" borderColor="line.subtle" color="ink.strong" fontFamily="mono" fontSize="sm" fontWeight="700" px="4" py="3">{name}</Text><Box p="3"><JsonCodeBlock value={schema} /></Box></Box>)}</Stack>;
}
