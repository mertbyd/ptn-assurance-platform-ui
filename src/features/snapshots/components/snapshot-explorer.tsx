"use client";

import { Badge, Box, Flex, Grid, SimpleGrid, Stack, Tabs, Text } from "@chakra-ui/react";
import { Braces, ListTree, Network } from "lucide-react";
import { useMemo, useState } from "react";

import { t } from "@/i18n/tr";
import type { OpenApiExplorerModel, OpenApiOperation } from "../openapi/types";
import { ApiTopology } from "./api-topology";
import { EndpointDetail } from "./endpoint-detail";
import { EndpointTree } from "./endpoint-tree";
import { SchemaCatalog } from "./schema-catalog";

function InfoMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return <Box bg="app.surface" borderLeft="3px solid" borderLeftColor="accent.solid" borderRadius="10px" p="3"><Text color="ink.muted" fontSize="10px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">{label}</Text><Box color="ink.strong" fontSize="sm" fontWeight="700" mt="1" overflowWrap="anywhere">{value}</Box></Box>;
}

export function SnapshotExplorer({ model }: { model: OpenApiExplorerModel }) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState(model.operations[0]?.key);
  const selected = model.operations.find((operation) => operation.key === selectedKey) ?? model.operations[0];
  const groups = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    if (!needle) return model.tags;
    return model.tags.map((group) => ({ ...group, operations: group.operations.filter((operation) => `${operation.method} ${operation.path} ${operation.operationId} ${operation.summary ?? ""}`.toLocaleLowerCase("tr-TR").includes(needle)) })).filter((group) => group.operations.length);
  }, [model.tags, search]);
  const infoTitle = typeof model.info.title === "string" ? model.info.title : t.snapshots.explorer.unknownTitle;
  const infoVersion = typeof model.info.version === "string" ? model.info.version : t.common.notAvailable;

  return (
    <Stack gap="4">
      <Flex align={{ base: "flex-start", md: "center" }} data-motion="surface" direction={{ base: "column", md: "row" }} gap="3" justify="space-between"><Box><Text color="ink.strong" fontSize="lg" fontWeight="750">{t.snapshots.explorer.title}</Text><Text color="ink.muted" fontSize="sm" mt="1">{t.snapshots.explorer.description}</Text></Box><Badge colorPalette="accent" size="lg">{model.version}</Badge></Flex>
      <SimpleGrid bg="app.muted" borderRadius="14px" columns={{ base: 2, md: 4 }} data-motion="surface-delayed" gap="1" p="1"><InfoMetric label={t.snapshots.explorer.apiTitle} value={infoTitle} /><InfoMetric label={t.snapshots.explorer.apiVersion} value={infoVersion} /><InfoMetric label={t.snapshots.explorer.tagCount} value={model.tags.length} /><InfoMetric label={t.snapshots.explorer.endpointCount} value={model.operations.length} /></SimpleGrid>
      <Tabs.Root defaultValue="tree" lazyMount variant="line">
        <Tabs.List bg="app.muted" borderRadius="control" data-motion="surface" overflowX="auto" p="1"><Tabs.Trigger borderRadius="10px" value="tree"><ListTree size={16} />{t.snapshots.explorer.views.tree}</Tabs.Trigger><Tabs.Trigger borderRadius="10px" value="topology"><Network size={16} />{t.snapshots.explorer.views.topology}</Tabs.Trigger><Tabs.Trigger borderRadius="10px" value="schemas"><Braces size={16} />{t.snapshots.explorer.views.schemas}</Tabs.Trigger></Tabs.List>
        <Tabs.Content value="tree" pt="4">{selected ? <Grid alignItems="start" gap="4" templateColumns={{ base: "minmax(0,1fr)", xl: "350px minmax(0,1fr)" }}><Box bg="app.surface" borderRadius="panel" data-motion="slide" maxH={{ base: "460px", xl: "calc(100dvh - 150px)" }} overflowY="auto" p="3" position={{ xl: "sticky" }} top={{ xl: "84px" }}><EndpointTree groups={groups} onSearch={setSearch} onSelect={(operation: OpenApiOperation) => setSelectedKey(operation.key)} search={search} selectedKey={selected.key} /></Box><EndpointDetail model={model} operation={selected} /></Grid> : <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" color="ink.muted" data-motion="surface" p="8" textAlign="center">{t.snapshots.explorer.noEndpoints}</Box>}</Tabs.Content>
        <Tabs.Content value="topology" pt="4"><ApiTopology model={model} onSelect={(operation) => setSelectedKey(operation.key)} /></Tabs.Content>
        <Tabs.Content value="schemas" pt="4"><SchemaCatalog model={model} /></Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
