"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { lookupsApi, type CreateLookupDto, type LookupKind, type UpdateLookupDto } from "@/api/lookups.api";
import { queryKeys } from "@/api/query-keys";

export function useLookupsQuery(kind: LookupKind) {
  return useQuery({ queryFn: () => lookupsApi.list(kind), queryKey: queryKeys.lookups.list(kind) });
}

function useInvalidateLookups() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.lookups.all });
}

export function useCreateLookupMutation() {
  const invalidate = useInvalidateLookups();
  return useMutation({ mutationFn: ({ kind, input }: { kind: LookupKind; input: CreateLookupDto }) => lookupsApi.create(kind, input), onSuccess: invalidate });
}

export function useUpdateLookupMutation() {
  const invalidate = useInvalidateLookups();
  return useMutation({ mutationFn: ({ id, kind, input }: { id: string; kind: LookupKind; input: UpdateLookupDto }) => lookupsApi.update(kind, id, input), onSuccess: invalidate });
}

export function usePassivateLookupMutation() {
  const invalidate = useInvalidateLookups();
  return useMutation({ mutationFn: ({ id, kind }: { id: string; kind: LookupKind }) => lookupsApi.passivate(kind, id), onSuccess: invalidate });
}
