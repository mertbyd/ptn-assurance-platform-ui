"use client";

import { Badge, Box, Button, Flex, Grid, Stack, Text } from "@chakra-ui/react";
import { Camera, History, RadioTower } from "lucide-react";
import { useState } from "react";

import type { SpecSourceDto } from "@/api/sources.api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/screen-state";
import { SnapshotContentPanel } from "@/features/snapshots";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { formatBytes, formatDateTime } from "@/lib/formatters";
import { useSnapshotsQuery, useTakeSnapshotMutation } from "../hooks/use-source-queries";

type Mode = "history" | "live";

export function DocumentContractWorkspace({ canManage, document, onSnapshotChange, selectedSnapshotId, sourceId }: {
  canManage: boolean;
  document: NonNullable<SpecSourceDto["documents"]>[number];
  onSnapshotChange: (snapshotId: string) => void;
  selectedSnapshotId: string;
  sourceId: string;
}) {
  const documentId = document.id ?? "";
  const snapshotsQuery = useSnapshotsQuery(sourceId, documentId);
  const snapshotMutation = useTakeSnapshotMutation(sourceId, documentId);
  const [mode, setMode] = useState<Mode>(selectedSnapshotId ? "history" : "live");
  const [liveSnapshotId, setLiveSnapshotId] = useState("");
  const [historySnapshotId, setHistorySnapshotId] = useState(selectedSnapshotId);
  const historyError = snapshotsQuery.error instanceof ApiRequestError ? snapshotsQuery.error : null;
  const captureError = snapshotMutation.error instanceof ApiRequestError ? snapshotMutation.error : null;
  const snapshots = snapshotsQuery.data?.items ?? [];

  const selectMode = (nextMode: Mode) => {
    setMode(nextMode);
    onSnapshotChange(nextMode === "live" ? liveSnapshotId : historySnapshotId);
  };
  const captureLive = async () => {
    try {
      const snapshot = await snapshotMutation.mutateAsync();
      if (!snapshot.id) return;
      setLiveSnapshotId(snapshot.id);
      setMode("live");
      onSnapshotChange(snapshot.id);
    } catch { /* Mutation state renders the safe error. */ }
  };
  const selectHistory = (snapshotId: string) => {
    setHistorySnapshotId(snapshotId);
    setMode("history");
    onSnapshotChange(snapshotId);
  };

  return (
    <Stack gap="4">
      <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap="3" justify="space-between">
        <Box><Flex align="center" gap="2"><Text color="ink.strong" fontSize="lg" fontWeight="800">{document.documentName}</Text><Badge colorPalette="accent">{document.path}</Badge></Flex><Text color="ink.muted" fontSize="sm" mt="1">{t.snapshots.workspace.documentDescription}</Text></Box>
        <Flex bg="app.muted" borderRadius="control" gap="1" p="1">
          <Button aria-pressed={mode === "live"} bg={mode === "live" ? "app.surface" : "transparent"} color={mode === "live" ? "accent.strong" : "ink.body"} onClick={() => selectMode("live")} size="sm" variant="ghost"><RadioTower size={16} />{t.snapshots.workspace.liveMode}</Button>
          <Button aria-pressed={mode === "history"} bg={mode === "history" ? "app.surface" : "transparent"} color={mode === "history" ? "accent.strong" : "ink.body"} onClick={() => selectMode("history")} size="sm" variant="ghost"><History size={16} />{t.snapshots.workspace.historyMode}</Button>
        </Flex>
      </Flex>

      {historyError && <ErrorState description={getApiErrorMessage(historyError)} onRetry={() => void snapshotsQuery.refetch()} title={t.snapshots.loadError} />}
      {captureError && <ErrorState description={getApiErrorMessage(captureError)} onRetry={() => void captureLive()} title={t.snapshots.captureError} />}
      <Grid alignItems="start" data-motion="surface-delayed" gap="4" templateColumns={{ base: "minmax(0,1fr)", xl: "300px minmax(0,1fr)" }}>
        <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" overflow="hidden">
          {mode === "live" ? (
            <Stack gap="4" p="5"><Flex align="center" bg="accent.soft" borderRadius="12px" color="accent.strong" h="12" justify="center" w="12"><RadioTower size={22} /></Flex><Box><Text color="ink.strong" fontWeight="800">{t.snapshots.workspace.liveTitle}</Text><Text color="ink.muted" fontSize="sm" lineHeight="1.65" mt="1">{t.snapshots.workspace.liveDescription}</Text></Box><Button bg="accent.strong" color="white" disabled={!canManage || !document.isActive} loading={snapshotMutation.isPending} onClick={() => void captureLive()} _hover={{ bg: "accent.hover" }}><Camera size={16} />{t.snapshots.workspace.captureAndOpen}</Button></Stack>
          ) : snapshotsQuery.isPending ? <LoadingState /> : snapshots.length === 0 ? <EmptyState description={t.snapshots.empty.description} title={t.snapshots.empty.title} /> : (
            <Stack gap="0">{snapshots.map((snapshot) => <Button aria-pressed={selectedSnapshotId === snapshot.id} bg={selectedSnapshotId === snapshot.id ? "accent.soft" : "transparent"} borderBottom="1px solid" borderColor="line.subtle" borderRadius="0" h="auto" justifyContent="stretch" key={snapshot.id} onClick={() => snapshot.id && selectHistory(snapshot.id)} p="4" textAlign="left" variant="ghost"><Box minW="0"><Text color="ink.strong" fontSize="sm" fontWeight="750">{formatDateTime(snapshot.creationTime)}</Text><Text color="ink.muted" fontSize="10px" mt="1" overflowWrap="anywhere">{snapshot.apiVersion ?? t.snapshots.unknownVersion} · {formatBytes(snapshot.byteSize)} · {snapshot.shortCanonicalHash ?? "—"}</Text></Box></Button>)}</Stack>
          )}
        </Box>

        <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" minW="0" p={{ base: "4", md: "5" }}>
          {selectedSnapshotId ? <SnapshotContentPanel id={selectedSnapshotId} key={selectedSnapshotId} /> : <EmptyState description={mode === "live" ? t.snapshots.workspace.liveEmptyDescription : t.snapshots.workspace.historyEmptyDescription} title={mode === "live" ? t.snapshots.workspace.liveEmptyTitle : t.snapshots.workspace.historyEmptyTitle} />}
        </Box>
      </Grid>
    </Stack>
  );
}
