"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { useForm, useWatch } from "react-hook-form";

import type { ContractCheckRunStatusDto } from "@/api/checks.api";
import { queryKeys } from "@/api/query-keys";
import { sourcesApi } from "@/api/sources.api";
import { comparisonSchema, type ComparisonFormValues } from "../comparison-schema";
import { useExecuteCheckMutation } from "./use-check-queries";

const defaultValues: ComparisonFormValues = {
  baseDocumentId: "",
  baseSnapshotId: "",
  baseSourceId: "",
  ignoreInternal: false,
  scopeMode: "all",
  scopeRules: [],
  targetDocumentId: "",
  targetMode: "live",
  targetSnapshotId: "",
  targetSourceId: "",
};

export function useComparisonForm(onExecuted: (run: ContractCheckRunStatusDto) => void) {
  const queryClient = useQueryClient();
  const liveCapture = useRef<{ documentId: string; snapshotId: string; sourceId: string } | null>(null);
  const form = useForm<ComparisonFormValues>({ defaultValues, resolver: zodResolver(comparisonSchema) });
  const values = useWatch({ control: form.control });
  const sourcesQuery = useQuery({ queryFn: () => sourcesApi.list(0, 1_000), queryKey: queryKeys.sources.list(0, 1_000) });
  const baseSnapshotsQuery = useQuery({
    enabled: Boolean(values.baseSourceId && values.baseDocumentId),
    queryFn: () => sourcesApi.snapshots(values.baseSourceId ?? "", values.baseDocumentId ?? "", 0, 1_000),
    queryKey: queryKeys.sources.snapshots(values.baseSourceId ?? "", values.baseDocumentId ?? ""),
  });
  const targetSnapshotsQuery = useQuery({
    enabled: Boolean(values.targetSourceId && values.targetDocumentId),
    queryFn: () => sourcesApi.snapshots(values.targetSourceId ?? "", values.targetDocumentId ?? "", 0, 1_000),
    queryKey: queryKeys.sources.snapshots(values.targetSourceId ?? "", values.targetDocumentId ?? ""),
  });
  const executeMutation = useExecuteCheckMutation();
  const liveTargetMutation = useMutation({
    mutationFn: ({ documentId, sourceId }: { documentId: string; sourceId: string }) => sourcesApi.takeSnapshot(sourceId, documentId),
  });
  const prepareLiveTarget = async () => {
    const { targetDocumentId, targetSnapshotId, targetSourceId } = form.getValues();
    if (liveCapture.current?.sourceId === targetSourceId && liveCapture.current.documentId === targetDocumentId && liveCapture.current.snapshotId === targetSnapshotId) return true;
    liveTargetMutation.reset();
    try {
      const snapshot = await liveTargetMutation.mutateAsync({ documentId: targetDocumentId, sourceId: targetSourceId });
      if (!snapshot.id) return false;
      liveCapture.current = { documentId: targetDocumentId, snapshotId: snapshot.id, sourceId: targetSourceId };
      form.setValue("targetSnapshotId", snapshot.id, { shouldDirty: true, shouldValidate: true });
      await queryClient.invalidateQueries({ queryKey: queryKeys.sources.snapshots(targetSourceId, targetDocumentId) });
      return true;
    } catch {
      return false;
    }
  };
  const submit = form.handleSubmit(async (formValues) => {
    executeMutation.reset();
    try {
      const run = await executeMutation.mutateAsync({
        baseSnapshotId: formValues.baseSnapshotId,
        ignoreInternal: formValues.ignoreInternal,
        scopeRules: formValues.scopeRules,
        targetSnapshotId: formValues.targetSnapshotId,
      });
      onExecuted(run);
    } catch {
      // Mutation state owns the safe feedback rendered by the form.
    }
  });
  return { baseSnapshotsQuery, executeMutation, form, liveTargetMutation, prepareLiveTarget, sourcesQuery, submit, targetSnapshotsQuery, values };
}
