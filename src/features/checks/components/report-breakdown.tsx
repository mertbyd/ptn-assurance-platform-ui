import { Badge, Box, Grid, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import type { ContractCheckReportDto } from "@/api/checks.api";
import { t } from "@/i18n/tr";
import { directionLabel, kindLabel, severityLabel } from "../difference-labels";

type CountItem = { code?: string | null; count?: number };

function CountGrid({ items, label, title }: { items?: Array<CountItem | null> | null; label: (code?: string | null) => string; title: string }) {
  const values = (items ?? []).filter(Boolean) as CountItem[];
  if (!values.length) return null;
  const maximum = Math.max(1, ...values.map((item) => item.count ?? 0));
  return (
    <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" p="5">
      <Text color="ink.strong" fontSize="sm" fontWeight="750" mb="4">{title}</Text>
      <Stack gap="3">
        {values.map((item) => (
          <Box key={item.code}>
            <Grid alignItems="center" gap="3" templateColumns="minmax(0,1fr) auto">
              <Badge justifySelf="start">{label(item.code)}</Badge>
              <Text color="ink.strong" fontSize="sm" fontWeight="800">{item.count ?? 0}</Text>
            </Grid>
            <Box bg="app.muted" borderRadius="full" h="5px" mt="2" overflow="hidden"><Box bg="accent.solid" borderRadius="full" h="full" w={`${Math.max(8, ((item.count ?? 0) / maximum) * 100)}%`} /></Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export function ReportBreakdown({ report }: { report?: ContractCheckReportDto }) {
  const summary = report?.summary;
  if (!summary) return null;
  return (
    <Stack gap="3">
      <Text color="ink.strong" fontSize="sm" fontWeight="800">{t.checks.report.breakdownTitle}</Text>
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap="4">
        <CountGrid items={summary.severityCounts} label={severityLabel} title={t.checks.report.bySeverity} />
        <CountGrid items={summary.directionCounts} label={directionLabel} title={t.checks.report.byDirection} />
        <CountGrid items={summary.kindCounts} label={kindLabel} title={t.checks.report.byKind} />
      </SimpleGrid>
    </Stack>
  );
}
