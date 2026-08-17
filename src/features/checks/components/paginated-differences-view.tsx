"use client";

import { Badge, Box, Button, Flex, Input, NativeSelect, Stack, Text } from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { ErrorState, LoadingState, EmptyState } from "@/components/ui/screen-state";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { useCheckFindingsQuery } from "../hooks/use-check-queries";
import { DifferenceCard } from "./difference-card";

const pageSize = 50;

export function PaginatedDifferencesView({ id }: { id: string }) {
  const [page, setPage] = useState(0);
  const [severityCode, setSeverityCode] = useState("");
  const [changeStateCode, setChangeStateCode] = useState("");
  const [path, setPath] = useState("");
  const [schemaName, setSchemaName] = useState("");
  const [kindCode, setKindCode] = useState("");
  const deferredPath = useDeferredValue(path.trim());
  const deferredSchema = useDeferredValue(schemaName.trim());
  const deferredKind = useDeferredValue(kindCode.trim());
  const params = useMemo(() => ({
    changeStateCode,
    kindCode: deferredKind,
    maxResultCount: pageSize,
    path: deferredPath,
    schemaName: deferredSchema,
    severityCode,
    skipCount: page * pageSize,
  }), [changeStateCode, deferredKind, deferredPath, deferredSchema, page, severityCode]);
  const query = useCheckFindingsQuery(id, params);

  if (query.isPending) return <LoadingState />;
  if (query.error instanceof ApiRequestError) {
    return <ErrorState description={getApiErrorMessage(query.error)} onRetry={() => void query.refetch()} title={t.checks.report.loadError} />;
  }

  const items = query.data?.items ?? [];
  const totalCount = query.data?.totalCount ?? 0;
  const hasFilters = Boolean(severityCode || changeStateCode || deferredPath || deferredSchema || deferredKind);
  const hasNextPage = (page + 1) * pageSize < totalCount;

  return (
    <Stack gap="4">
      <Stack bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" gap="3" p="3">
        <Flex gap="3" wrap="wrap">
          <Box flex="1 1 220px" position="relative">
            <Box color="ink.faint" left="3" position="absolute" top="2.5"><Search size={16} /></Box>
            <Input aria-label={t.checks.report.pathFilter} bg="app.muted" border="0" borderRadius="full" onChange={(event) => { setPage(0); setPath(event.target.value); }} pl="9" placeholder={t.checks.report.pathPlaceholder} value={path} />
          </Box>
          <Input aria-label={t.checks.report.schemaFilter} bg="app.muted" border="0" borderRadius="full" flex="1 1 210px" onChange={(event) => { setPage(0); setSchemaName(event.target.value); }} placeholder={t.checks.report.schemaPlaceholder} value={schemaName} />
          <Input aria-label={t.checks.report.kindFilter} bg="app.muted" border="0" borderRadius="full" flex="1 1 210px" onChange={(event) => { setPage(0); setKindCode(event.target.value); }} placeholder={t.checks.report.kindPlaceholder} value={kindCode} />
        </Flex>
        <Flex align="center" gap="3" wrap="wrap">
          <NativeSelect.Root maxW="230px">
            <NativeSelect.Field aria-label={t.checks.report.severityFilter} bg="app.muted" border="0" borderRadius="full" onChange={(event) => { setPage(0); setSeverityCode(event.target.value); }} value={severityCode}>
              <option value="">{t.checks.report.allSeverities}</option>
              <option value="breaking">{t.checks.status.breaking}</option>
              <option value="non-breaking">{t.checks.status.nonBreaking}</option>
              <option value="docs-only">{t.checks.status.docsOnly}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <NativeSelect.Root maxW="230px">
            <NativeSelect.Field aria-label={t.checks.report.changeStateFilter} bg="app.muted" border="0" borderRadius="full" onChange={(event) => { setPage(0); setChangeStateCode(event.target.value); }} value={changeStateCode}>
              <option value="">{t.checks.report.allChangeStates}</option>
              <option value="Known">{t.checks.report.currentChanges}</option>
              <option value="New">{t.checks.report.newChanges}</option>
              <option value="Resolved">{t.checks.report.resolvedChanges}</option>
              <option value="Unknown">{t.checks.report.unknownChanges}</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <Badge colorPalette="accent" ml={{ md: "auto" }} size="lg">{t.checks.report.resultCount(totalCount)}</Badge>
        </Flex>
      </Stack>

      {query.data?.isTruncated && <Text bg="state.warningSoft" borderRadius="control" color="state.warning" fontSize="sm" p="3">{t.checks.report.truncated}</Text>}
      {items.length ? <Stack gap="3">{items.map((difference, index) => <DifferenceCard difference={difference} key={`${difference.kindCode}-${difference.address?.path ?? difference.address?.schemaName ?? "finding"}-${index}`} />)}</Stack> : (
        <EmptyState
          description={hasFilters ? t.checks.report.noFilterMatchDescription : t.checks.report.noDifferencesDescription}
          title={hasFilters ? t.checks.report.noFilterMatchTitle : t.checks.report.noDifferencesTitle}
        />
      )}
      {totalCount > pageSize && (
        <Flex align="center" justify="space-between">
          <Text color="ink.muted" fontSize="sm">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} / {totalCount}</Text>
          <Flex gap="2">
            <Button disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} size="sm" variant="outline">{t.checks.report.previous}</Button>
            <Button disabled={!hasNextPage} onClick={() => setPage((value) => value + 1)} size="sm" variant="outline">{t.checks.report.next}</Button>
          </Flex>
        </Flex>
      )}
    </Stack>
  );
}
