"use client";

import { Badge, Box, Flex, Input, NativeSelect, Stack } from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { FindingDto } from "@/api/checks.api";
import { EmptyState } from "@/components/ui/screen-state";
import { t } from "@/i18n/tr";
import { DifferenceCard } from "./difference-card";

export function DifferencesView({ differences }: { differences: FindingDto[] }) {
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => differences.filter((difference) => {
    if (severity !== "all" && difference.severityCode !== severity) return false;
    const haystack = [difference.kindCode, difference.directionCode, difference.address?.httpMethod, difference.address?.path, difference.address?.schemaName, difference.address?.propertyPath].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
    return haystack.includes(search.trim().toLocaleLowerCase("tr-TR"));
  }), [differences, search, severity]);
  // Hic fark yoksa bu bir filtre sonucu degil, kiyaslamanin sonucudur; ikisi ayri anlatilir.
  if (!differences.length) return <EmptyState description={t.checks.report.noDifferencesDescription} title={t.checks.report.noDifferencesTitle} />;
  return (
    <Stack gap="4">
      <Flex align={{ base: "stretch", md: "center" }} bg="app.surface" borderRadius="panel" direction={{ base: "column", md: "row" }} gap="3" p="3"><Box flex="1" position="relative"><Box color="ink.faint" left="3" position="absolute" top="2.5"><Search size={16} /></Box><Input aria-label={t.checks.report.searchLabel} bg="app.muted" border="0" borderRadius="full" onChange={(event) => setSearch(event.target.value)} pl="9" placeholder={t.checks.report.searchPlaceholder} value={search} /></Box><NativeSelect.Root maxW={{ md: "220px" }}><NativeSelect.Field aria-label={t.checks.report.severityFilter} bg="app.muted" border="0" borderRadius="full" onChange={(event) => setSeverity(event.target.value)} value={severity}><option value="all">{t.checks.report.allSeverities}</option><option value="breaking">{t.checks.status.breaking}</option><option value="non-breaking">{t.checks.status.nonBreaking}</option><option value="docs-only">{t.checks.status.docsOnly}</option></NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root><Badge colorPalette="accent" size="lg">{t.checks.report.resultCount(filtered.length)}</Badge></Flex>
      {filtered.length ? <Stack gap="3">{filtered.map((difference, index) => <DifferenceCard difference={difference} key={`${difference.kindCode}-${index}`} />)}</Stack> : <EmptyState description={t.checks.report.noFilterMatchDescription} title={t.checks.report.noFilterMatchTitle} />}
    </Stack>
  );
}
