"use client";

import { Badge, Box, Button, Flex, Grid, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { FileJson2, ServerCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/screen-state";
import { usePermissionsQuery } from "@/features/permissions";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";
import { useSourcesQuery } from "../hooks/use-source-queries";
import { DocumentContractWorkspace } from "./document-contract-workspace";

export function ContractExplorerView({ initialDocumentId = "", initialSnapshotId = "", initialSourceId = "" }: {
  initialDocumentId?: string;
  initialSnapshotId?: string;
  initialSourceId?: string;
}) {
  const router = useRouter();
  const sourcesQuery = useSourcesQuery(0, 1000);
  const { data: granted = emptyGrantedPermissions } = usePermissionsQuery();
  const [sourceId, setSourceId] = useState(initialSourceId);
  const [documentId, setDocumentId] = useState(initialDocumentId);
  const [snapshotId, setSnapshotId] = useState(initialSnapshotId);
  const sources = (sourcesQuery.data?.items ?? []).filter((source) => source.id && source.isActive);
  const selectedSourceId = sources.some((source) => source.id === sourceId) ? sourceId : sources[0]?.id ?? "";
  const selectedSource = sources.find((source) => source.id === selectedSourceId);
  const documents = (selectedSource?.documents ?? []).filter((document) => document.id && document.isActive);
  const selectedDocumentId = documents.some((document) => document.id === documentId) ? documentId : documents[0]?.id ?? "";
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId);
  const canManage = hasPermission(granted, Permissions.sources.manage);

  const updateUrl = (nextSourceId: string, nextDocumentId = "", nextSnapshotId = "") => {
    setSourceId(nextSourceId); setDocumentId(nextDocumentId); setSnapshotId(nextSnapshotId);
    const params = new URLSearchParams({ source: nextSourceId });
    if (nextDocumentId) params.set("document", nextDocumentId);
    if (nextSnapshotId) params.set("snapshot", nextSnapshotId);
    router.replace(`/api-contract/contracts?${params.toString()}`, { scroll: false });
  };

  if (sourcesQuery.isPending) return <LoadingState />;
  if (sourcesQuery.error instanceof ApiRequestError) return <ErrorState description={getApiErrorMessage(sourcesQuery.error)} onRetry={() => void sourcesQuery.refetch()} title={t.sources.loadErrorTitle} />;

  return (
    <Stack gap="6">
      <PageHeading description={t.contracts.description} eyebrow={t.contracts.eyebrow} title={t.contracts.title} />
      {sources.length === 0 ? <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel"><EmptyState description={t.contracts.emptyDescription} title={t.contracts.emptyTitle} /></Box> : (
        <>
          <Grid bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" data-motion="surface" gap="0" overflow="hidden" templateColumns={{ base: "minmax(0,1fr)", lg: "minmax(0,1fr) minmax(0,1fr)" }}>
            <Box borderBottom={{ base: "1px solid", lg: "0" }} borderColor="line.subtle" borderRight={{ lg: "1px solid" }} p={{ base: "4", md: "5" }}>
              <Flex align="center" gap="2" mb="4"><Badge colorPalette="accent">1</Badge><Text color="ink.strong" fontWeight="800">{t.contracts.chooseSource}</Text></Flex>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 1, xl: 2 }} gap="2">
                {sources.map((source) => <Button aria-pressed={source.id === selectedSourceId} bg={source.id === selectedSourceId ? "accent.soft" : "app.subtle"} border="1px solid" borderColor={source.id === selectedSourceId ? "accent.border" : "transparent"} h="auto" justifyContent="flex-start" key={source.id} onClick={() => updateUrl(source.id ?? "")} p="3" textAlign="left" transition="background-color 180ms ease-out, border-color 180ms ease-out, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)" variant="ghost" _hover={{ borderColor: "accent.border", transform: "translateY(-3px)" }}><ServerCog color="var(--acc-colors-accent-solid)" size={17} /><Box minW="0"><Text color="ink.strong" fontSize="sm" fontWeight="800" truncate>{source.name}</Text><Text color="ink.muted" fontSize="10px">{t.contracts.documentCount(source.documents?.filter((document) => document.isActive).length ?? 0)}</Text></Box></Button>)}
              </SimpleGrid>
            </Box>
            <Box p={{ base: "4", md: "5" }}>
              <Flex align="center" gap="2" mb="4"><Badge colorPalette="accent">2</Badge><Text color="ink.strong" fontWeight="800">{t.contracts.chooseDocument}</Text></Flex>
              {documents.length ? <Stack gap="2">{documents.map((document) => <Button aria-pressed={document.id === selectedDocumentId} bg={document.id === selectedDocumentId ? "accent.soft" : "app.subtle"} border="1px solid" borderColor={document.id === selectedDocumentId ? "accent.border" : "transparent"} h="auto" justifyContent="flex-start" key={document.id} onClick={() => updateUrl(selectedSourceId, document.id ?? "")} p="3" textAlign="left" transition="background-color 180ms ease-out, border-color 180ms ease-out, transform 220ms cubic-bezier(0.16, 1, 0.3, 1)" variant="ghost" _hover={{ borderColor: "accent.border", transform: "translateY(-3px)" }}><FileJson2 color="var(--acc-colors-accent-solid)" size={17} /><Box minW="0"><Text color="ink.strong" fontSize="sm" fontWeight="800">{document.documentName}</Text><Text color="ink.muted" fontFamily="mono" fontSize="10px" truncate>{document.path}</Text></Box></Button>)}</Stack> : <Text color="ink.muted" fontSize="sm">{t.contracts.noDocuments}</Text>}
            </Box>
          </Grid>
          {selectedSource && selectedDocument && <DocumentContractWorkspace canManage={canManage} document={selectedDocument} key={`${selectedSourceId}-${selectedDocumentId}`} onSnapshotChange={(nextSnapshotId) => updateUrl(selectedSourceId, selectedDocumentId, nextSnapshotId)} selectedSnapshotId={snapshotId} sourceId={selectedSourceId} />}
        </>
      )}
    </Stack>
  );
}
