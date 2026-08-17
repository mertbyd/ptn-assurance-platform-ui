"use client";

import { Box, Button, Flex, Grid, SimpleGrid, Stack, Steps, Text } from "@chakra-ui/react";
import { ArrowLeft, ArrowRight, Check, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PageHeading } from "@/components/ui/page-heading";
import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { useComparisonForm } from "../hooks/use-comparison-form";
import { ComparisonReviewStep } from "./comparison-review-step";
import { ComparisonScopeStep } from "./comparison-scope-step";
import { SnapshotSelectionCard } from "./snapshot-selection-card";

const selectionFields = ["baseSourceId", "baseDocumentId", "baseSnapshotId", "targetSourceId", "targetDocumentId", "targetMode"] as const;

function WizardRail({ step }: { step: number }) {
  return (
    <Flex bg="app.rail" color="white" direction="column" display={{ base: "none", lg: "flex" }} minH="620px" p="6">
      <Flex align="center" bg="whiteAlpha.100" borderRadius="14px" h="11" justify="center" w="11"><GitCompareArrows size={21} /></Flex>
      <Text color="ink.muted" fontSize="11px" fontWeight="800" letterSpacing="0.12em" mt="6" textTransform="uppercase">{t.checks.wizard.eyebrow}</Text>
      <Text fontSize="lg" fontWeight="800" lineHeight="1.35" mt="2">{t.checks.wizard.stepTitles[step]}</Text>
      <Text color="ink.muted" fontSize="xs" lineHeight="1.65" mt="2">{t.checks.wizard.stepDescriptions[step]}</Text>
      <Stack gap="2" mt="8">
        {t.checks.wizard.steps.map((label, index) => {
          const active = index === step;
          const complete = index < step;
          return (
            <Flex align="center" bg={active ? "whiteAlpha.200" : "transparent"} borderRadius="12px" color={active || complete ? "white" : "ink.faint"} gap="3" key={label} px="3" py="3">
              <Flex align="center" bg={complete ? "accent.solid" : active ? "white" : "whiteAlpha.100"} borderRadius="full" color={active ? "app.rail" : "white"} fontSize="11px" fontWeight="800" h="7" justify="center" w="7">
                {complete ? <Check size={14} /> : index + 1}
              </Flex>
              <Text fontSize="sm" fontWeight={active ? "750" : "560"}>{label}</Text>
            </Flex>
          );
        })}
      </Stack>
    </Flex>
  );
}

export function ComparisonWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { baseSnapshotsQuery, executeMutation, form, liveTargetMutation, prepareLiveTarget, sourcesQuery, submit, targetSnapshotsQuery, values } = useComparisonForm((run) => { if (run.id) router.push(`/api-contract/checks/${run.id}`); });
  const mutationError = executeMutation.error ?? liveTargetMutation.error;
  const requestError = mutationError instanceof ApiRequestError ? mutationError : null;
  // Canli cekim degismemis icerikte ayni snapshot'i geri verir; bu bir secim hatasi degil, "fark yok" sonucudur.
  const sameSnapshotSelected = Boolean(values.targetSnapshotId && values.targetSnapshotId === values.baseSnapshotId);
  const liveTargetMatchesBase = Boolean(sameSnapshotSelected && values.targetMode === "live");
  const selectionReady = Boolean(values.baseSourceId && values.baseDocumentId && values.baseSnapshotId && values.targetSourceId && values.targetDocumentId && (values.targetMode === "live" || (values.targetSnapshotId && !sameSnapshotSelected)));
  const scopeReady = values.scopeMode === "all" || Boolean(values.scopeRules?.length);
  const next = async () => {
    if (step === 0) {
      if (!(await form.trigger(selectionFields))) return;
      if (form.getValues("targetMode") === "live") {
        if (!(await prepareLiveTarget())) return;
      } else if (!form.getValues("targetSnapshotId")) {
        form.setError("targetSnapshotId", { message: t.checks.validation.snapshotRequired, type: "manual" });
        return;
      }
      if (!(await form.trigger("targetSnapshotId"))) return;
    }
    if (step === 1 && !scopeReady) {
      form.setError("scopeRules", { message: t.checks.validation.scopeSelectionRequired, type: "manual" });
      return;
    }
    setStep((current) => Math.min(2, current + 1));
  };
  if (sourcesQuery.isPending) return <LoadingState />;
  if (sourcesQuery.error instanceof ApiRequestError) return <ErrorState description={getApiErrorMessage(sourcesQuery.error)} onRetry={() => void sourcesQuery.refetch()} title={t.checks.wizard.loadError} />;
  return (
    <Stack gap="6">
      <PageHeading actions={<Button asChild variant="outline"><Link href="/api-contract/checks"><ArrowLeft size={16} />{t.checks.wizard.back}</Link></Button>} description={t.checks.wizard.description} eyebrow={t.checks.wizard.eyebrow} title={t.checks.wizard.title} />
      <Steps.Root colorPalette="accent" count={3} display={{ base: "block", lg: "none" }} step={step} w="full"><Steps.List w="full">{t.checks.wizard.steps.map((label, index) => <Steps.Item index={index} key={label} minW="0"><Steps.Indicator><Steps.Status complete={<Check size={15} />} incomplete={index + 1} /></Steps.Indicator><Steps.Title fontSize={{ base: "11px", sm: "sm" }} whiteSpace="nowrap">{label}</Steps.Title>{index < 2 && <Steps.Separator />}</Steps.Item>)}</Steps.List></Steps.Root>
      <Grid bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" overflow="hidden" templateColumns={{ base: "minmax(0,1fr)", lg: "250px minmax(0,1fr)" }}>
        <WizardRail step={step} />
        <Flex direction="column" minW="0">
          <Flex align="center" borderBottom="1px solid" borderColor="line.subtle" display={{ base: "flex", lg: "none" }} gap="3" px="4" py="4"><Flex align="center" bg="accent.soft" borderRadius="control" color="accent.solid" h="10" justify="center" w="10"><GitCompareArrows size={19} /></Flex><Box><Text color="ink.strong" fontSize="sm" fontWeight="800">{t.checks.wizard.stepTitles[step]}</Text><Text color="ink.muted" fontSize="xs" mt="0.5">{t.checks.wizard.stepDescriptions[step]}</Text></Box></Flex>
          <Box flex="1" p={{ base: "4", md: "7" }}>
            {requestError && <Box bg="state.dangerSoft" borderLeft="3px solid" borderColor="state.danger" borderRadius="control" color="state.danger" fontSize="sm" mb="5" p="3">{getApiErrorMessage(requestError)}</Box>}
            {step === 0 && <><SimpleGrid columns={{ base: 1, xl: 2 }} gap="5"><SnapshotSelectionCard form={form} kind="base" snapshots={baseSnapshotsQuery.data} sources={sourcesQuery.data} /><SnapshotSelectionCard form={form} kind="target" snapshots={targetSnapshotsQuery.data} sources={sourcesQuery.data} /></SimpleGrid>{sameSnapshotSelected && <Box bg="state.warningSoft" borderLeft="3px solid" borderColor="state.warning" borderRadius="control" color="state.warning" fontSize="sm" mt="4" p="3">{liveTargetMatchesBase ? t.checks.validation.liveMatchesBase : t.checks.validation.snapshotsDifferent}</Box>}</>}
            {step === 1 && <ComparisonScopeStep form={form} />}
            {step === 2 && <ComparisonReviewStep baseSnapshots={baseSnapshotsQuery.data} form={form} sources={sourcesQuery.data} targetSnapshots={targetSnapshotsQuery.data} />}
          </Box>
          <Flex align="center" borderTop="1px solid" borderColor="line.subtle" gap="3" justify="space-between" px={{ base: "4", md: "7" }} py="4"><Button disabled={step === 0 || liveTargetMutation.isPending} onClick={() => setStep((current) => Math.max(0, current - 1))} variant="ghost"><ArrowLeft size={16} />{t.checks.wizard.previous}</Button>{step < 2 ? <Button bg="accent.strong" borderRadius="control" color="white" disabled={(step === 0 && !selectionReady) || (step === 1 && !scopeReady)} loading={liveTargetMutation.isPending} loadingText={t.checks.selection.capturingLive} onClick={() => void next()} px="5" _hover={{ bg: "accent.hover" }}>{t.checks.wizard.next}<ArrowRight size={16} /></Button> : <Button bg="accent.strong" borderRadius="control" color="white" loading={executeMutation.isPending} onClick={() => void submit()} px="5" _hover={{ bg: "accent.hover" }}><GitCompareArrows size={17} />{t.checks.form.submit}</Button>}</Flex>
        </Flex>
      </Grid>
    </Stack>
  );
}
