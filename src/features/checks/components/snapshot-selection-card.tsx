"use client";

import { Badge, Box, Button, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Check, History, RadioTower, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { SnapshotPage, SpecSourcePage } from "@/api/sources.api";
import { t } from "@/i18n/tr";
import type { ComparisonFormValues } from "../comparison-schema";
import { ContractDocumentPicker } from "./contract-document-picker";
import { SnapshotTimelinePicker } from "./snapshot-timeline-picker";

export function SnapshotSelectionCard({ form, kind, snapshots, sources }: {
  form: UseFormReturn<ComparisonFormValues>;
  kind: "base" | "target";
  snapshots?: SnapshotPage;
  sources?: SpecSourcePage;
}) {
  const sourceName = `${kind}SourceId` as const;
  const documentName = `${kind}DocumentId` as const;
  const snapshotName = `${kind}SnapshotId` as const;
  const sourceId = form.watch(sourceName);
  const documentId = form.watch(documentName);
  const baseSourceId = form.watch("baseSourceId");
  const baseDocumentId = form.watch("baseDocumentId");
  const targetMode = form.watch("targetMode");
  const isBase = kind === "base";
  const [useReferenceContract, setUseReferenceContract] = useState(!isBase);
  const inheritedSource = sources?.items?.find((item) => item.id === baseSourceId);
  const inheritedDocument = inheritedSource?.documents?.find((item) => item.id === baseDocumentId);

  useEffect(() => {
    if (isBase || !useReferenceContract) return;
    const sourceChanged = form.getValues("targetSourceId") !== baseSourceId;
    const documentChanged = form.getValues("targetDocumentId") !== baseDocumentId;
    form.setValue("targetSourceId", baseSourceId, { shouldDirty: true, shouldValidate: true });
    form.setValue("targetDocumentId", baseDocumentId, { shouldDirty: true, shouldValidate: true });
    if (sourceChanged || documentChanged) form.setValue("targetSnapshotId", "", { shouldDirty: true, shouldValidate: true });
  }, [baseDocumentId, baseSourceId, form, isBase, useReferenceContract]);

  const chooseSource = (id: string) => {
    form.setValue(sourceName, id, { shouldDirty: true, shouldValidate: true });
    form.setValue(documentName, "");
    form.setValue(snapshotName, "");
  };
  const chooseDocument = (id: string) => {
    form.setValue(documentName, id, { shouldDirty: true, shouldValidate: true });
    form.setValue(snapshotName, "");
  };
  const chooseMode = (mode: ComparisonFormValues["targetMode"]) => {
    form.setValue("targetMode", mode, { shouldDirty: true, shouldValidate: true });
    form.setValue("targetSnapshotId", "", { shouldDirty: true, shouldValidate: true });
    form.clearErrors("targetSnapshotId");
  };
  const chooseDifferentTarget = () => {
    setUseReferenceContract(false);
    form.setValue("targetSourceId", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("targetDocumentId", "", { shouldDirty: true, shouldValidate: true });
    form.setValue("targetSnapshotId", "", { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Box bg="app.subtle" border="1px solid" borderColor={isBase ? "line.subtle" : "accent.solid"} borderRadius="16px" overflow="hidden">
      <Box bg="app.surface" borderTop="3px solid" borderTopColor={isBase ? "line.strong" : "accent.strong"} color="ink.strong" px="5" py="4">
        <Flex align="center" gap="3"><Flex align="center" bg={isBase ? "app.muted" : "accent.strong"} borderRadius="full" color={isBase ? "ink.body" : "white"} fontSize="11px" fontWeight="850" h="8" justify="center" w="8">{isBase ? 1 : 2}</Flex><Box><Flex align="center" gap="2"><Text fontSize="sm" fontWeight="850">{isBase ? t.checks.form.baseTitle : t.checks.form.targetTitle}</Text><Badge colorPalette={isBase ? "gray" : "blue"} size="xs">{isBase ? t.checks.form.baseBadge : t.checks.form.targetBadge}</Badge></Flex><Text color="ink.muted" fontSize="xs" mt="0.5">{isBase ? t.checks.selection.baseHint : t.checks.selection.targetHint}</Text></Box></Flex>
      </Box>
      <Stack gap="5" p={{ base: "4", md: "5" }}>
        {!isBase && <SimpleGrid bg="app.muted" borderRadius="control" columns={2} gap="1" p="1">
          <Button aria-pressed={targetMode === "live"} bg={targetMode === "live" ? "app.surface" : "transparent"} border="0" borderRadius="10px" h="auto" justifyContent="flex-start" minW="0" onClick={() => chooseMode("live")} overflow="hidden" p="3" variant="ghost"><RadioTower color="var(--acc-colors-accent-solid)" size={18} /><Box minW="0" textAlign="left"><Text color="ink.strong" fontSize="sm" fontWeight="800" whiteSpace="normal">{t.checks.selection.liveMode}</Text><Text color="ink.muted" fontSize="10px" mt="0.5" whiteSpace="normal">{t.checks.selection.liveModeHint}</Text></Box></Button>
          <Button aria-pressed={targetMode === "snapshot"} bg={targetMode === "snapshot" ? "app.surface" : "transparent"} border="0" borderRadius="10px" h="auto" justifyContent="flex-start" minW="0" onClick={() => chooseMode("snapshot")} overflow="hidden" p="3" variant="ghost"><History color="var(--acc-colors-accent-solid)" size={18} /><Box minW="0" textAlign="left"><Text color="ink.strong" fontSize="sm" fontWeight="800" whiteSpace="normal">{t.checks.selection.snapshotMode}</Text><Text color="ink.muted" fontSize="10px" mt="0.5" whiteSpace="normal">{t.checks.selection.snapshotModeHint}</Text></Box></Button>
        </SimpleGrid>}

        {isBase || !useReferenceContract ? (
          <Stack gap="3">
            {!isBase && <Button alignSelf="flex-start" onClick={() => setUseReferenceContract(true)} size="xs" variant="ghost"><RefreshCcw size={14} />{t.checks.selection.useReferenceTarget}</Button>}
            <ContractDocumentPicker documentError={form.formState.errors[documentName]?.message} documentId={documentId} onDocumentChange={chooseDocument} onSourceChange={chooseSource} sourceError={form.formState.errors[sourceName]?.message} sourceId={sourceId} sources={sources} />
          </Stack>
        ) : (
          <Box bg="app.surface" border="1px solid" borderColor="accent.line" borderRadius="12px" p="4">
            <Stack align="flex-start" gap="3">
              <Flex align="flex-start" gap="3" minW="0"><Flex align="center" bg="accent.soft" borderRadius="full" color="accent.strong" flexShrink="0" h="8" justify="center" w="8"><Check size={16} /></Flex><Box minW="0"><Text color="ink.strong" fontSize="sm" fontWeight="800" whiteSpace="normal">{t.checks.selection.sameContractTitle}</Text><Text color="ink.muted" fontSize="xs" mt="1" overflowWrap="anywhere">{baseDocumentId ? `${inheritedSource?.name ?? t.common.notAvailable} · ${inheritedDocument?.documentName ?? t.common.notAvailable}` : t.checks.selection.targetMissing}</Text><Text color="ink.muted" fontSize="10px" mt="1" whiteSpace="normal">{t.checks.selection.sameContractDescription}</Text></Box></Flex>
              <Button onClick={chooseDifferentTarget} size="xs" variant="outline">{t.checks.selection.changeTarget}</Button>
            </Stack>
          </Box>
        )}

        {(isBase || targetMode === "snapshot") ? (
          <SnapshotTimelinePicker disabled={!documentId} error={form.formState.errors[snapshotName]?.message} onChange={(id) => form.setValue(snapshotName, id, { shouldDirty: true, shouldValidate: true })} selectedId={form.watch(snapshotName)} snapshots={snapshots} />
        ) : documentId ? (
          <Box bg="app.rail" borderRadius="12px" color="white" p="4"><Flex align="center" gap="3"><Box bg="whiteAlpha.100" borderRadius="10px" p="2.5"><RadioTower size={20} /></Box><Box><Flex align="center" gap="2"><Box bg="green.300" borderRadius="full" h="7px" w="7px" /><Text fontSize="sm" fontWeight="850">{t.checks.selection.liveReadyTitle}</Text></Flex><Text color="ink.strong" fontSize="xs" lineHeight="1.6" mt="1">{t.checks.selection.liveReadyDescription}</Text></Box></Flex></Box>
        ) : (
          <Box bg="state.warningSoft" borderRadius="12px" color="state.warning" fontSize="sm" p="4">{t.checks.selection.targetMissing}</Box>
        )}
      </Stack>
    </Box>
  );
}
