import { Badge, Box, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";

import type { FindingDto } from "@/api/checks.api";
import { t } from "@/i18n/tr";
import { directionLabel, kindLabel, severityLabel, severityPalette } from "../difference-labels";

const directionPalette: Record<string, string> = { documentation: "gray", endpoint: "purple", request: "orange", response: "blue" };
const severityAccent: Record<string, string> = { breaking: "state.danger", "non-breaking": "state.success" };

function ValueBlock({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return <Box bg="app.rail" borderRadius="8px" color="ink.strong" minW="0" p="3"><Text color="ink.faint" fontSize="9px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">{label}</Text><Text fontFamily="mono" fontSize="11px" mt="1" overflowWrap="anywhere" whiteSpace="pre-wrap">{value}</Text></Box>;
}

export function DifferenceCard({ difference }: { difference: FindingDto }) {
  const address = difference.address;
  return (
    <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderLeft="4px solid" borderLeftColor={severityAccent[difference.severityCode ?? ""] ?? "line.strong"} borderRadius="control" overflow="hidden">
      <Flex align="center" gap="2" px="4" py="3" wrap="wrap">
        <Badge colorPalette={severityPalette[difference.severityCode ?? ""] ?? "gray"}>{severityLabel(difference.severityCode)}</Badge>
        <Badge colorPalette={directionPalette[difference.directionCode ?? ""] ?? "gray"} variant="outline">{directionLabel(difference.directionCode)}</Badge>
        <Text color="ink.strong" flex="1" fontSize="sm" fontWeight="800" minW="180px">{kindLabel(difference.kindCode)}</Text>
      </Flex>
      <Stack gap="3" p="4">
        <Box>
          <Text color="ink.muted" fontSize="10px" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">{t.checks.report.address}</Text>
          <Flex align="center" gap="2" mt="2" wrap="wrap">
            {address?.httpMethod && <Badge colorPalette="accent" size="sm">{address.httpMethod}</Badge>}
            {address?.path && <Text color="ink.strong" fontFamily="mono" fontSize="sm">{address.path}</Text>}
            {address?.schemaName && <Badge colorPalette="purple" size="sm" variant="surface">Schema: {address.schemaName}</Badge>}
            {address?.propertyPath && <Badge colorPalette="orange" size="sm" variant="surface">Property: {address.propertyPath}</Badge>}
            {address?.parameterName && <Badge colorPalette="pink" size="sm" variant="surface">Param: {address.parameterName}</Badge>}
            {address?.responseStatus && <Badge colorPalette="cyan" size="sm" variant="surface">Status: {address.responseStatus}</Badge>}
            {address?.mediaType && <Badge colorPalette="gray" size="sm" variant="surface">{address.mediaType}</Badge>}
          </Flex>
          {address?.operationId && <Text color="ink.muted" fontFamily="mono" fontSize="10px" mt="2">{address.operationId}</Text>}
        </Box>
        {(difference.oldValue || difference.newValue) && <SimpleGrid columns={{ base: 1, md: 2 }} gap="3"><ValueBlock label={t.checks.report.oldValue} value={difference.oldValue} /><ValueBlock label={t.checks.report.newValue} value={difference.newValue} /></SimpleGrid>}
      </Stack>
    </Box>
  );
}
