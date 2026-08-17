"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  emailSenderApi,
  emailTemplatesApi,
  type CreateEmailTemplateDto,
  type UpdateEmailTemplateDto,
  type UpsertTenantEmailSenderDto,
} from "@/api/email.api";
import { queryKeys } from "@/api/query-keys";

export function useEmailSenderQuery(enabled: boolean) {
  return useQuery({ enabled, queryFn: emailSenderApi.get, queryKey: queryKeys.email.sender });
}

function useInvalidateSender() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.email.sender });
}

export function useUpsertEmailSenderMutation() {
  const invalidate = useInvalidateSender();
  return useMutation({
    mutationFn: (input: UpsertTenantEmailSenderDto) => emailSenderApi.upsert(input),
    onSuccess: invalidate,
  });
}

export function useClearEmailSenderMutation() {
  const invalidate = useInvalidateSender();
  return useMutation({ mutationFn: emailSenderApi.clear, onSuccess: invalidate });
}

export function useSendTestEmailMutation() {
  return useMutation({ mutationFn: emailSenderApi.sendTest });
}

export function useEmailTemplatesQuery(enabled: boolean, skipCount: number, maxResultCount: number) {
  return useQuery({
    enabled,
    queryFn: () => emailTemplatesApi.list(skipCount, maxResultCount),
    queryKey: queryKeys.email.templateList(skipCount, maxResultCount),
  });
}

function useInvalidateTemplates() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.email.templates });
}

export function useCreateTemplateMutation() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (input: CreateEmailTemplateDto) => emailTemplatesApi.create(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTemplateMutation() {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateEmailTemplateDto }) => emailTemplatesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useRemoveTemplateMutation() {
  const invalidate = useInvalidateTemplates();
  return useMutation({ mutationFn: emailTemplatesApi.remove, onSuccess: invalidate });
}
