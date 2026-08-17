"use client";

import { Badge, Box, Button, Flex, Progress, SimpleGrid, Stack, Steps, Text } from "@chakra-ui/react";
import { Activity, ArrowRight, CheckCircle2, Clock3, LoaderCircle } from "lucide-react";
import Link from "next/link";

import type { ContractCheckRunHeaderDto } from "@/api/checks.api";
import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { formatDateTime } from "@/lib/formatters";
import { useCheckStatusQuery } from "../hooks/use-check-queries";

const statusPalette: Record<string, string> = { completed: "green", failed: "red", partial: "orange", pending: "gray", running: "blue" };

export function CheckStatusPanel({ run, showResultAction = true, streamState }: { run?: ContractCheckRunHeaderDto; showResultAction?: boolean; streamState: "connecting" | "live" | "fallback" }) {
  const query = useCheckStatusQuery(run?.id);
  if (!run) return <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" color="ink.muted" p="8" textAlign="center">{t.checks.status.selectRun}</Box>;
  if (query.isPending) return <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" p="5"><LoadingState /></Box>;
  if (query.error instanceof ApiRequestError) return <ErrorState description={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} title={t.checks.status.loadError} />;
  const status = query.data?.statusCode ?? run.statusCode ?? "pending";
  const terminal = ["completed", "failed", "partial"].includes(status);
  const step = status === "pending" ? 0 : status === "running" ? 1 : 3;
  const counts = [
    [t.checks.status.breaking, query.data?.breakingCount ?? 0, "red"],
    [t.checks.status.nonBreaking, query.data?.nonBreakingCount ?? 0, "green"],
    [t.checks.status.docsOnly, query.data?.docsOnlyCount ?? 0, "gray"],
  ] as const;
  return (
    <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" overflow="hidden">
      <Flex align="center" bg="app.rail" color="white" gap="3" justify="space-between" px="5" py="4"><Flex align="center" gap="3"><Flex align="center" bg="whiteAlpha.100" borderRadius="10px" h="9" justify="center" w="9"><Activity size={18} /></Flex><Box><Text fontSize="sm" fontWeight="750">{t.checks.status.title}</Text><Text color="ink.muted" fontSize="11px" mt="0.5">{t.checks.status.runId(run.id ?? "")}</Text></Box></Flex><Stack align="flex-end" gap="1"><Badge colorPalette={statusPalette[status] ?? "gray"}>{t.checks.statusLabels[status as keyof typeof t.checks.statusLabels] ?? status}</Badge><Text color="ink.muted" fontSize="10px">{t.checks.stream[streamState]}</Text></Stack></Flex>
      <Stack gap="5" p="5">
        <Steps.Root colorPalette="accent" count={3} size="sm" step={step}><Steps.List><Steps.Item index={0}><Steps.Indicator><Steps.Status complete={<CheckCircle2 size={14} />} current={<Clock3 size={14} />} incomplete={<Clock3 size={14} />} /></Steps.Indicator><Steps.Title>{t.checks.status.pending}</Steps.Title><Steps.Separator /></Steps.Item><Steps.Item index={1}><Steps.Indicator><Steps.Status complete={<CheckCircle2 size={14} />} current={<LoaderCircle size={14} />} incomplete={<LoaderCircle size={14} />} /></Steps.Indicator><Steps.Title>{t.checks.status.running}</Steps.Title><Steps.Separator /></Steps.Item><Steps.Item index={2}><Steps.Indicator><Steps.Status complete={<CheckCircle2 size={14} />} incomplete={<CheckCircle2 size={14} />} /></Steps.Indicator><Steps.Title>{t.checks.status.finished}</Steps.Title></Steps.Item></Steps.List></Steps.Root>
        {!terminal && <Progress.Root animated colorPalette="accent" striped value={null}><Progress.Track><Progress.Range /></Progress.Track></Progress.Root>}
        <SimpleGrid bg="app.muted" borderRadius="12px" columns={3} gap="1" p="1">{counts.map(([label, value, palette]) => <Box bg="app.surface" borderRadius="10px" key={label} p="3"><Badge colorPalette={palette} size="xs">{label}</Badge><Text color="ink.strong" fontSize="xl" fontWeight="800" mt="2">{value}</Text></Box>)}</SimpleGrid>
        <Flex align="center" color="ink.muted" fontSize="xs" gap="2" justify="space-between"><Text>{t.checks.status.started}: {formatDateTime(query.data?.startedAt ?? undefined)}</Text><Text>{t.checks.status.completed}: {formatDateTime(query.data?.completedAt ?? undefined)}</Text></Flex>
        {terminal && showResultAction && run.id && <Button alignSelf="flex-end" asChild size="sm"><Link href={`/api-contract/checks/${run.id}`}>{t.checks.status.openResult}<ArrowRight size={15} /></Link></Button>}
      </Stack>
    </Box>
  );
}
