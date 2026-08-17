"use client";

import { Box, Button, Flex, SimpleGrid, Stack, Switch, Text } from "@chakra-ui/react";
import { Layers3, ListFilter } from "lucide-react";
import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";

import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { t } from "@/i18n/tr";
import { parseOpenApiContent } from "@/features/snapshots/openapi/parser";
import { useSnapshotQuery } from "@/features/snapshots/hooks/use-snapshot-query";
import type { ComparisonFormValues } from "../comparison-schema";
import { ScopeItemPicker } from "./scope-item-picker";

export function ComparisonScopeStep({ form }: { form: UseFormReturn<ComparisonFormValues> }) {
  const rules = form.watch("scopeRules");
  const mode = form.watch("scopeMode");
  const targetSnapshotId = form.watch("targetSnapshotId");
  const snapshotQuery = useSnapshotQuery(targetSnapshotId);
  const parsed = useMemo(() => parseOpenApiContent(snapshotQuery.data?.specContent?.content ?? "", t.snapshots.explorer.untagged), [snapshotQuery.data?.specContent?.content]);
  const chooseMode = (value: ComparisonFormValues["scopeMode"]) => {
    form.setValue("scopeMode", value, { shouldDirty: true, shouldValidate: true });
    if (value === "all") form.setValue("scopeRules", [], { shouldDirty: true, shouldValidate: true });
  };
  return (
    <Stack gap="5">
      <Box><Text color="ink.strong" fontSize="lg" fontWeight="800">{t.checks.scopeStep.title}</Text><Text color="ink.muted" fontSize="sm" mt="1">{t.checks.scopeStep.description}</Text></Box>
      <SimpleGrid bg="app.muted" borderRadius="14px" columns={{ base: 1, md: 2 }} gap="1" p="1">
        <Button bg={mode === "all" ? "app.surface" : "transparent"} border="0" borderLeft="3px solid" borderLeftColor={mode === "all" ? "accent.solid" : "transparent"} h="auto" justifyContent="flex-start" onClick={() => chooseMode("all")} p="4" variant="ghost"><Layers3 color="var(--acc-colors-accent-solid)" size={22} /><Box textAlign="left"><Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.scopeStep.allTitle}</Text><Text color="ink.muted" fontSize="xs" mt="1" whiteSpace="normal">{t.checks.scopeStep.allDescription}</Text></Box></Button>
        <Button bg={mode === "custom" ? "app.surface" : "transparent"} border="0" borderLeft="3px solid" borderLeftColor={mode === "custom" ? "accent.solid" : "transparent"} h="auto" justifyContent="flex-start" onClick={() => chooseMode("custom")} p="4" variant="ghost"><ListFilter color="var(--acc-colors-accent-solid)" size={22} /><Box textAlign="left"><Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.scopeStep.customTitle}</Text><Text color="ink.muted" fontSize="xs" mt="1" whiteSpace="normal">{t.checks.scopeStep.customDescription}</Text></Box></Button>
      </SimpleGrid>
      <Flex align="center" bg="accent.soft" borderLeft="3px solid" borderLeftColor="accent.solid" borderRadius="12px" gap="4" justify="space-between" p="4"><Box><Text color="ink.strong" fontSize="sm" fontWeight="700">{t.checks.scopeStep.ignoreInternalTitle}</Text><Text color="ink.muted" fontSize="xs" mt="1">{t.checks.scopeStep.ignoreInternalDescription}</Text></Box><Switch.Root checked={form.watch("ignoreInternal")} colorPalette="accent" onCheckedChange={({ checked }) => form.setValue("ignoreInternal", checked, { shouldDirty: true })}><Switch.HiddenInput /><Switch.Control /></Switch.Root></Flex>
      {mode === "custom" && (snapshotQuery.isPending ? <LoadingState /> : snapshotQuery.isError || !parsed.model ? <ErrorState description={t.checks.scopeStep.loadErrorDescription} onRetry={() => void snapshotQuery.refetch()} title={t.checks.scopeStep.loadErrorTitle} /> : <ScopeItemPicker model={parsed.model} onChange={(value) => form.setValue("scopeRules", value, { shouldDirty: true, shouldValidate: true })} rules={rules} />)}
      {mode === "custom" && rules.length === 0 && <Box bg="state.warningSoft" borderRadius="10px" color="state.warning" fontSize="sm" p="3">{t.checks.scopeStep.emptyCustom}</Box>}
      {form.formState.errors.scopeRules?.message && <Text color="state.danger" fontSize="xs">{form.formState.errors.scopeRules.message}</Text>}
    </Stack>
  );
}
