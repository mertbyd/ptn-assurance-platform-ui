"use client";

import { Badge, Box, Flex, SimpleGrid, Stack, Tabs, Text } from "@chakra-ui/react";
import { Braces, Network } from "lucide-react";

import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { formatBytes, formatDateTime } from "@/lib/formatters";
import { useSnapshotQuery } from "../hooks/use-snapshot-query";
import { parseOpenApiContent } from "../openapi/parser";
import { SnapshotExplorer } from "./snapshot-explorer";

export function SnapshotContentPanel({ id }: { id: string }) {
  const snapshotQuery = useSnapshotQuery(id);
  if (snapshotQuery.isPending) return <LoadingState />;
  if (snapshotQuery.error instanceof ApiRequestError) return <ErrorState description={getApiErrorMessage(snapshotQuery.error)} onRetry={() => void snapshotQuery.refetch()} title={t.snapshots.detailError} />;
  const snapshot = snapshotQuery.data;
  const content = snapshot?.specContent?.content ?? "";
  const parsed = parseOpenApiContent(content, t.snapshots.explorer.untagged);
  const metrics = [
    [t.snapshots.metrics.created, formatDateTime(snapshot?.creationTime)],
    [t.snapshots.metrics.lastSeen, formatDateTime(snapshot?.lastSeenAt)],
    [t.snapshots.metrics.size, formatBytes(snapshot?.specContent?.byteSize)],
    [t.snapshots.metrics.mediaType, snapshot?.specContent?.mediaType ?? "—"],
  ];

  return (
    <Stack gap="5" minW="0">
      <Flex align="center" data-motion="surface" gap="3" justify="space-between" wrap="wrap">
        <Box><Text color="ink.strong" fontSize="lg" fontWeight="800">{t.snapshots.workspace.selectedTitle}</Text><Text color="ink.muted" fontSize="xs" mt="1">{formatDateTime(snapshot?.creationTime)}</Text></Box>
        <Badge colorPalette="accent">{snapshot?.specFormat?.code ?? t.snapshots.unknownFormat}</Badge>
      </Flex>
      <SimpleGrid bg="app.rail" borderRadius="panel" columns={{ base: 1, sm: 2, xl: 4 }} data-motion="surface-delayed" gap="2" p="2">
        {metrics.map(([label, value]) => <Box bg="whiteAlpha.100" borderRadius="12px" key={label} p="4"><Text color="ink.muted" fontSize="xs">{label}</Text><Text color="white" fontSize="sm" fontWeight="700" mt="1" overflowWrap="anywhere">{value}</Text></Box>)}
      </SimpleGrid>
      <Tabs.Root defaultValue={parsed.model ? "explorer" : "raw"} variant="line">
        <Tabs.List bg="app.muted" borderRadius="control" data-motion="surface" overflowX="auto" p="1"><Tabs.Trigger borderRadius="10px" value="explorer" disabled={!parsed.model}><Network size={16} />{t.snapshots.explorer.tab}</Tabs.Trigger><Tabs.Trigger borderRadius="10px" value="raw"><Braces size={16} />{t.snapshots.rawTitle}</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="explorer" pt="4">{parsed.model ? <SnapshotExplorer model={parsed.model} /> : <Box bg="state.warningSoft" border="1px solid" borderColor="orange.200" borderRadius="panel" p="5"><Text color="state.warning" fontWeight="700">{t.snapshots.explorer.parseErrorTitle}</Text><Text color="ink.muted" fontSize="sm" mt="1">{t.snapshots.explorer.parseErrorDescription}</Text></Box>}</Tabs.Content>
        <Tabs.Content data-motion="surface" value="raw" pt="4"><Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" overflow="hidden"><Flex align="center" borderBottom="1px solid" borderColor="line.subtle" gap="2" justify="space-between" px="5" py="4"><Flex align="center" gap="2"><Braces size={17} /><Text fontWeight="700">{t.snapshots.rawTitle}</Text></Flex><Badge colorPalette="accent">{snapshot?.specFormat?.code ?? t.snapshots.unknownFormat}</Badge></Flex><Box as="pre" bg="app.rail" color="ink.strong" fontFamily="mono" fontSize="12px" lineHeight="1.65" m="0" maxH="65dvh" overflow="auto" p="5" tabIndex={0} whiteSpace="pre">{content || t.snapshots.noContent}</Box></Box></Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
