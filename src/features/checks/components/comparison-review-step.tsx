import { Badge, Box, Flex, Grid, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { ArrowRight, FileClock, Filter, RadioTower, ShieldCheck } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import type { SnapshotPage, SpecSourcePage } from "@/api/sources.api";
import { t } from "@/i18n/tr";
import { formatDateTime } from "@/lib/formatters";
import type { ComparisonFormValues } from "../comparison-schema";

function SnapshotSummary({ documentId, id, live, sourceId, sources, snapshots, title }: { documentId: string; id: string; live?: boolean; sourceId: string; sources?: SpecSourcePage; snapshots?: SnapshotPage; title: string }) {
  const source = sources?.items?.find((item) => item.id === sourceId);
  const document = source?.documents?.find((item) => item.id === documentId);
  const snapshot = snapshots?.items?.find((item) => item.id === id);
  return <Box bg={live ? "app.rail" : "app.subtle"} border="1px solid" borderColor={live ? "accent.border" : "line.subtle"} borderRadius="12px" color={live ? "white" : "ink.strong"} p="4"><Flex align="center" justify="space-between"><Badge colorPalette="accent">{title}</Badge>{live && <Flex align="center" color="green.200" fontSize="10px" fontWeight="800" gap="1.5"><RadioTower size={13} />{t.checks.review.liveCapture}</Flex>}</Flex><Text fontSize="md" fontWeight="800" mt="3">{source?.name ?? t.common.notAvailable}</Text><Text color={live ? "ink.muted" : "ink.muted"} fontSize="sm" mt="1">{document?.documentName ?? t.common.notAvailable}</Text><Flex align="center" color={live ? "ink.muted" : "ink.muted"} fontSize="xs" gap="2" mt="3"><FileClock size={14} />{formatDateTime(snapshot?.creationTime ?? snapshot?.lastSeenAt)} · {snapshot?.shortCanonicalHash ?? id.slice(0, 8)}</Flex></Box>;
}

export function ComparisonReviewStep({ baseSnapshots, form, sources, targetSnapshots }: { baseSnapshots?: SnapshotPage; form: UseFormReturn<ComparisonFormValues>; sources?: SpecSourcePage; targetSnapshots?: SnapshotPage }) {
  const values = form.getValues();
  return (
    <Stack gap="5">
      <Box><Text color="ink.strong" fontSize="lg" fontWeight="800">{t.checks.review.title}</Text><Text color="ink.muted" fontSize="sm" mt="1">{t.checks.review.description}</Text></Box>
      <Grid alignItems="stretch" gap="3" templateColumns={{ base: "minmax(0,1fr)", lg: "minmax(0,1fr) 56px minmax(0,1fr)" }}><SnapshotSummary documentId={values.baseDocumentId} id={values.baseSnapshotId} snapshots={baseSnapshots} sourceId={values.baseSourceId} sources={sources} title={t.checks.form.baseBadge} /><Flex align="center" color="accent.solid" justify="center"><ArrowRight size={24} /></Flex><SnapshotSummary documentId={values.targetDocumentId} id={values.targetSnapshotId} live={values.targetMode === "live"} snapshots={targetSnapshots} sourceId={values.targetSourceId} sources={sources} title={t.checks.form.targetBadge} /></Grid>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="3"><Box border="1px solid" borderColor="line.subtle" borderRadius="12px" p="4"><Flex align="center" gap="2"><Filter color="var(--acc-colors-accent-solid)" size={17} /><Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.review.scope}</Text></Flex><Text color="ink.muted" fontSize="sm" mt="2">{values.scopeRules.length ? t.checks.review.customScope(values.scopeRules.length) : t.checks.review.fullScope}</Text></Box><Box border="1px solid" borderColor="line.subtle" borderRadius="12px" p="4"><Flex align="center" gap="2"><ShieldCheck color="var(--acc-colors-accent-solid)" size={17} /><Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.review.internal}</Text></Flex><Text color="ink.muted" fontSize="sm" mt="2">{values.ignoreInternal ? t.checks.review.internalIgnored : t.checks.review.internalIncluded}</Text></Box></SimpleGrid>
      <Box bg="accent.soft" border="1px solid" borderColor="accent.border" borderRadius="12px" p="4"><Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.review.directionTitle}</Text><Text color="ink.muted" fontSize="xs" lineHeight="1.7" mt="1">{t.checks.review.directionDescription}</Text></Box>
    </Stack>
  );
}
