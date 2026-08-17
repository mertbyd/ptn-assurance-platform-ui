import { Badge, Box, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import { t } from "@/i18n/tr";
import type { OpenApiExplorerModel, OpenApiOperation } from "../openapi/types";
import { JsonCodeBlock } from "./json-code-block";

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return <Box bg="app.subtle" border="1px solid" borderColor="line.subtle" borderRadius="10px" data-motion="surface" p="3"><Text color="ink.muted" fontSize="10px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">{label}</Text><Box color="ink.strong" fontSize="sm" mt="1.5" overflowWrap="anywhere">{value}</Box></Box>;
}

export function OperationOverview({ model, operation }: { model: OpenApiExplorerModel; operation: OpenApiOperation }) {
  const servers = operation.servers.length ? operation.servers : model.servers;
  return (
    <Stack gap="4">
      {operation.description && <Text color="ink.body" fontSize="sm" lineHeight="1.75">{operation.description}</Text>}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
        <Detail label={t.snapshots.explorer.operationId} value={operation.operationId} />
        <Detail label={t.snapshots.explorer.lifecycle} value={<Badge colorPalette={operation.deprecated ? "orange" : "green"}>{operation.deprecated ? t.snapshots.explorer.deprecated : t.snapshots.explorer.active}</Badge>} />
        <Detail label={t.snapshots.explorer.tags} value={operation.tags.length ? operation.tags.join(", ") : t.common.notAvailable} />
        <Detail label={t.snapshots.explorer.security} value={operation.security.length ? <JsonCodeBlock value={operation.security} /> : t.snapshots.explorer.publicEndpoint} />
      </SimpleGrid>
      <Box><Text color="ink.strong" fontSize="sm" fontWeight="700" mb="2">{t.snapshots.explorer.servers}</Text>{servers.length ? <JsonCodeBlock value={servers} /> : <Text color="ink.muted" fontSize="sm">{t.common.notAvailable}</Text>}</Box>
    </Stack>
  );
}
