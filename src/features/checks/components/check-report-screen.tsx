"use client";

import { Badge, Box, Button, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { queryKeys } from "@/api/query-keys";
import { snapshotsApi } from "@/api/snapshots.api";
import { sourcesApi } from "@/api/sources.api";
import { PageHeading } from "@/components/ui/page-heading";
import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { formatDateTime } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { isTerminalCheckStatus, useCheckDetailQuery, useCheckReportQuery, useCheckStatusQuery } from "../hooks/use-check-queries";
import { useCheckNotificationStream } from "../hooks/use-check-notification-stream";
import { CheckStatusPanel } from "./check-status-panel";
import { PaginatedDifferencesView } from "./paginated-differences-view";
import { ReportBreakdown } from "./report-breakdown";

function SnapshotContext({ snapshotId, title }: { snapshotId?: string | null; title: string }) {
  const snapshotQuery = useQuery({ enabled: Boolean(snapshotId), queryFn: () => snapshotsApi.get(snapshotId!), queryKey: queryKeys.snapshots.detail(snapshotId ?? "") });
  const sourcesQuery = useQuery({ queryFn: () => sourcesApi.list(0, 1_000), queryKey: queryKeys.sources.list(0, 1_000) });
  if (!snapshotId) return null;
  const snapshot = snapshotQuery.data;
  const owner = (sourcesQuery.data?.items ?? [])
    .flatMap((source) => (source.documents ?? []).map((document) => ({ document, source })))
    .find((candidate) => candidate.document.id === snapshot?.specDocumentId);
  return (
    <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" overflow="hidden">
      <Flex align="center" bg="app.muted" borderBottom="1px solid" borderColor="line.subtle" gap="2" px="4" py="3">
        <Text color="ink.strong" fontSize="sm" fontWeight="800">{title}</Text>
      </Flex>
      <Stack gap="2" p="4">
        <Text color="ink.strong" fontSize="sm" fontWeight="750">{owner?.source.name ?? t.common.notAvailable}</Text>
        <Flex align="center" gap="2" wrap="wrap">
          <Badge colorPalette="accent" size="sm">{owner?.document.documentName ?? t.common.notAvailable}</Badge>
          <Text color="ink.muted" fontSize="xs">{formatDateTime(snapshot?.creationTime)}</Text>
        </Flex>
        <Text color="ink.faint" fontFamily="mono" fontSize="10px" truncate>{snapshotId}</Text>
      </Stack>
    </Box>
  );
}

function Metric({ label, tone = "blue", value }: { label: string; tone?: string; value: React.ReactNode }) {
  return <Box bg="whiteAlpha.100" borderRadius="control" minW="0" p="4"><Badge colorPalette={tone}>{label}</Badge><Text color="white" fontSize="xl" fontWeight="800" mt="2" overflowWrap="anywhere">{value}</Text></Box>;
}

// Rapor = ozet + dagilim + farklarin kendisi. Ucu ayri yuzeye bolunmez; tek sonuc sayfasidir.
function ReportBody({ id }: { id: string }) {
  const detailQuery = useCheckDetailQuery(id);
  const reportQuery = useCheckReportQuery(id);
  if (detailQuery.isPending) return <LoadingState />;
  if (detailQuery.error instanceof ApiRequestError) return <ErrorState description={getApiErrorMessage(detailQuery.error)} onRetry={() => void detailQuery.refetch()} title={t.checks.report.loadError} />;
  const detail = detailQuery.data;
  const total = reportQuery.data?.summary?.totalFindingCount ?? detail?.findings?.items?.length ?? 0;
  return (
    <Stack gap="5">
      <SimpleGrid bg="app.rail" borderRadius="panel" columns={{ base: 2, lg: 5 }} gap="2" p="2">
        <Metric label={t.checks.report.total} value={total} />
        <Metric label={t.checks.status.breaking} tone="red" value={detail?.breakingCount ?? 0} />
        <Metric label={t.checks.status.nonBreaking} tone="green" value={detail?.nonBreakingCount ?? 0} />
        <Metric label={t.checks.status.docsOnly} tone="gray" value={detail?.docsOnlyCount ?? 0} />
        <Metric label={t.checks.report.completedAt} value={formatDateTime(detail?.completedAt ?? undefined)} />
      </SimpleGrid>
      <Stack gap="3">
        <Text color="ink.strong" fontSize="sm" fontWeight="800">{t.checks.report.comparedTitle}</Text>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <SnapshotContext snapshotId={detail?.baseSnapshotId} title={t.checks.report.baseSnapshot} />
          <SnapshotContext snapshotId={detail?.targetSnapshotId} title={t.checks.report.targetSnapshot} />
        </SimpleGrid>
      </Stack>
      <ReportBreakdown report={reportQuery.data} />
      <Stack gap="3">
        <Text color="ink.strong" fontSize="sm" fontWeight="800">{t.checks.report.differencesTitle}</Text>
        <PaginatedDifferencesView id={id} />
      </Stack>
    </Stack>
  );
}

export function CheckReportScreen({ id }: { id: string }) {
  const statusQuery = useCheckStatusQuery(id);
  const streamState = useCheckNotificationStream();
  if (statusQuery.isPending) return <LoadingState />;
  if (statusQuery.error instanceof ApiRequestError) return <ErrorState description={getApiErrorMessage(statusQuery.error)} onRetry={() => void statusQuery.refetch()} title={t.checks.report.loadError} />;
  const status = statusQuery.data;
  const isTerminal = isTerminalCheckStatus(status?.statusCode);
  const hasResult = status?.statusCode === "completed" || status?.statusCode === "partial";
  return (
    <Stack gap="6">
      <PageHeading
        actions={<Button asChild variant="outline"><Link href="/api-contract/checks"><ArrowLeft size={16} />{t.checks.report.back}</Link></Button>}
        description={isTerminal ? t.checks.report.description : t.checks.report.liveDescription}
        eyebrow={isTerminal ? t.checks.report.eyebrow : t.checks.report.liveEyebrow}
        title={isTerminal ? t.checks.report.title : t.checks.report.liveTitle}
      />
      <CheckStatusPanel run={status} showResultAction={false} streamState={streamState} />
      {status?.statusCode === "failed" && (
        <Box bg="state.dangerSoft" border="1px solid" borderColor="red.200" borderRadius="panel" color="state.danger" p="5">
          <TriangleAlert size={20} />
          <Text fontWeight="800" mt="3">{t.checks.report.failedTitle}</Text>
          <Text fontSize="sm" mt="1">{t.checks.report.failedDescription}</Text>
        </Box>
      )}
      {hasResult && <ReportBody id={id} />}
    </Stack>
  );
}
