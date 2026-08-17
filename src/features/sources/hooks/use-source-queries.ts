"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/query-keys";
import { sourcesApi, type ConfigureSpecDocumentMonitoringDto, type CreateSpecSourceDto, type UpdateSpecSourceDto } from "@/api/sources.api";

export function useSourcesQuery(skipCount: number, maxResultCount: number) {
  return useQuery({
    queryFn: () => sourcesApi.list(skipCount, maxResultCount),
    queryKey: queryKeys.sources.list(skipCount, maxResultCount),
  });
}

export function useSourceQuery(id: string) {
  return useQuery({ queryFn: () => sourcesApi.get(id), queryKey: queryKeys.sources.detail(id) });
}

export function useSnapshotsQuery(sourceId: string, documentId: string) {
  return useQuery({
    enabled: Boolean(documentId),
    queryFn: () => sourcesApi.snapshots(sourceId, documentId),
    queryKey: queryKeys.sources.snapshots(sourceId, documentId),
  });
}

function useInvalidateSources() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.sources.all });
}

export function useCreateSourceMutation() {
  const invalidate = useInvalidateSources();
  return useMutation({ mutationFn: (input: CreateSpecSourceDto) => sourcesApi.create(input), onSuccess: invalidate });
}

export function useUpdateSourceMutation() {
  const invalidate = useInvalidateSources();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSpecSourceDto }) => sourcesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function usePassivateSourceMutation() {
  const invalidate = useInvalidateSources();
  return useMutation({ mutationFn: sourcesApi.passivate, onSuccess: invalidate });
}

export function useTestSourceMutation() {
  return useMutation({ mutationFn: sourcesApi.test });
}

export function useConfigureMonitoringMutation() {
  return useMutation({
    mutationFn: ({ documentId, id, input }: { documentId: string; id: string; input: ConfigureSpecDocumentMonitoringDto }) =>
      sourcesApi.configureMonitoring(id, documentId, input),
  });
}

export function useTakeSnapshotMutation(sourceId: string, documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sourcesApi.takeSnapshot(sourceId, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.sources.snapshots(sourceId, documentId) }),
  });
}
