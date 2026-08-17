"use client";

import { Badge, Box, Button, Flex, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { FileBarChart, History } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { ContractCheckRunHeaderDto } from "@/api/checks.api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/screen-state";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { formatDateTime } from "@/lib/formatters";
import { isTerminalCheckStatus, useChecksQuery } from "../hooks/use-check-queries";

const statusPalette: Record<string, string> = {
  completed: "green",
  failed: "red",
  partial: "orange",
  pending: "gray",
  running: "blue",
};

type HistoryFilter = "all" | "finished" | "running";

// Tek liste hem canli hem sonuclanmis calismalari tasir; ayri bir rapor arsivi rotasi yoktur.
function matchesFilter(run: ContractCheckRunHeaderDto, filter: HistoryFilter) {
  if (filter === "finished") return isTerminalCheckStatus(run.statusCode);
  if (filter === "running") return !isTerminalCheckStatus(run.statusCode);
  return true;
}

function RunRow({ run }: { run: ContractCheckRunHeaderDto }) {
  const status = run.statusCode ?? "pending";
  const finished = isTerminalCheckStatus(status);
  return (
    <Box borderBottom="1px solid" borderColor="line.subtle" p="4" _last={{ borderBottomWidth: 0 }}>
      <Flex align={{ base: "flex-start", xl: "center" }} gap="4" justify="space-between" wrap="wrap">
        <Box flex="1" minW={{ base: "full", lg: "300px" }}>
          <Flex align="center" gap="2">
            <Badge colorPalette={statusPalette[status] ?? "gray"}>{t.checks.statusLabels[status as keyof typeof t.checks.statusLabels] ?? status}</Badge>
            <Text color="ink.strong" fontSize="xs" fontWeight="700">{formatDateTime(run.creationTime)}</Text>
          </Flex>
          <Text color="ink.muted" fontFamily="mono" fontSize="10px" mt="2" truncate>{run.baseSnapshotId} → {run.targetSnapshotId}</Text>
          <Flex gap="3" mt="2">
            <Text color="state.danger" fontSize="11px">{t.checks.history.breaking(run.breakingCount ?? 0)}</Text>
            <Text color="state.success" fontSize="11px">{t.checks.history.safe(run.nonBreakingCount ?? 0)}</Text>
            <Text color="ink.muted" fontSize="11px">{t.checks.history.docs(run.docsOnlyCount ?? 0)}</Text>
          </Flex>
        </Box>
        <Button asChild bg="accent.soft" color="accent.strong" size="sm" variant="subtle">
          <Link href={`/api-contract/checks/${run.id}`}><FileBarChart aria-hidden="true" size={16} />{finished ? t.checks.history.openReport : t.checks.history.openStatus}</Link>
        </Button>
      </Flex>
    </Box>
  );
}

export function CheckHistoryPanel() {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const query = useChecksQuery();
  const runs = useMemo(() => (query.data?.items ?? []).filter((run) => matchesFilter(run, filter)), [filter, query.data]);
  if (query.isPending) return <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" p="5"><LoadingState /></Box>;
  if (query.error instanceof ApiRequestError) return <ErrorState description={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} title={t.checks.history.loadError} />;
  const hasRuns = Boolean(query.data?.items?.length);
  return (
    <Box id="check-history" bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" overflow="hidden" scrollMarginTop="96px">
      <Flex align={{ base: "stretch", md: "center" }} borderBottom="1px solid" borderColor="line.subtle" direction={{ base: "column", md: "row" }} gap="3" justify="space-between" px="5" py="4">
        <Flex align="center" gap="2">
          <History size={17} />
          <Box>
            <Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.history.title}</Text>
            <Text color="ink.muted" fontSize="11px" mt="0.5">{t.checks.history.total(query.data?.totalCount ?? 0)}</Text>
          </Box>
        </Flex>
        <NativeSelect.Root maxW={{ md: "220px" }} size="sm">
          <NativeSelect.Field aria-label={t.checks.history.filterLabel} bg="app.muted" border="0" borderRadius="full" onChange={(event) => setFilter(event.target.value as HistoryFilter)} value={filter}>
            <option value="all">{t.checks.history.filterAll}</option>
            <option value="finished">{t.checks.history.filterFinished}</option>
            <option value="running">{t.checks.history.filterRunning}</option>
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Flex>
      {runs.length === 0
        ? <EmptyState description={hasRuns ? t.checks.history.noFilterMatch : t.checks.history.emptyDescription} title={hasRuns ? t.checks.history.noFilterMatch : t.checks.history.emptyTitle} />
        : <Stack gap="0">{runs.map((run) => <RunRow key={run.id} run={run} />)}</Stack>}
    </Box>
  );
}
