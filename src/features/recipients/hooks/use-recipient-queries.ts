"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/api/query-keys";
import {
  recipientsApi,
  type CreateCheckRecipientDto,
  type UpdateCheckRecipientDto,
} from "@/api/recipients.api";

export function useRecipientsQuery(skipCount: number, maxResultCount: number) {
  return useQuery({
    queryFn: () => recipientsApi.list(skipCount, maxResultCount),
    queryKey: queryKeys.recipients.list(skipCount, maxResultCount),
  });
}

function useInvalidateRecipients() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.recipients.all });
}

export function useCreateRecipientMutation() {
  const invalidate = useInvalidateRecipients();
  return useMutation({
    mutationFn: (input: CreateCheckRecipientDto) => recipientsApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateRecipientMutation() {
  const invalidate = useInvalidateRecipients();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCheckRecipientDto }) => recipientsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function usePassivateRecipientMutation() {
  const invalidate = useInvalidateRecipients();
  return useMutation({ mutationFn: recipientsApi.passivate, onSuccess: invalidate });
}
