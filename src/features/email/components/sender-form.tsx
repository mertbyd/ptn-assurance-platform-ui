"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Field, Flex, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { TenantEmailSenderDto } from "@/api/email.api";
import { FormTextField } from "@/components/ui/form-text-field";
import { Tooltip } from "@/components/ui/tooltip";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { senderSchema, type SenderFormValues } from "../sender-schema";
import { useUpsertEmailSenderMutation } from "../hooks/use-email-queries";

const defaultSmtpPort = 587;
const securityOptions = [
  { label: t.email.sender.security.startTls, value: 1 },
  { label: t.email.sender.security.sslOnConnect, value: 2 },
  { label: t.email.sender.security.none, value: 3 },
] as const;

function valuesFromSender(sender?: TenantEmailSenderDto): SenderFormValues {
  return {
    fromAddress: sender?.fromAddress ?? "",
    fromDisplayName: sender?.fromDisplayName ?? "",
    smtpHost: sender?.smtpHost ?? "",
    smtpPassword: "",
    smtpPort: sender?.smtpPort || defaultSmtpPort,
    smtpSecurity: sender?.smtpSecurity ?? 1,
    smtpUsername: "",
  };
}

export function SenderForm({ canManage, sender }: { canManage: boolean; sender?: TenantEmailSenderDto }) {
  const upsertMutation = useUpsertEmailSenderMutation();
  const form = useForm<SenderFormValues>({
    defaultValues: valuesFromSender(sender),
    resolver: zodResolver(senderSchema),
  });

  useEffect(() => {
    form.reset(valuesFromSender(sender));
  }, [form, sender]);

  const onSubmit = form.handleSubmit(async (values) => {
    upsertMutation.reset();
    try {
      await upsertMutation.mutateAsync({
        fromAddress: values.fromAddress,
        fromDisplayName: values.fromDisplayName || null,
        smtpHost: values.smtpHost,
        smtpPassword: values.smtpPassword || null,
        smtpPort: values.smtpPort,
        smtpSecurity: values.smtpSecurity,
        smtpUsername: values.smtpUsername || null,
      });
    } catch {
      // Mutation state owns the safe error feedback below.
    }
  });
  const requestError = upsertMutation.error instanceof ApiRequestError ? upsertMutation.error : null;

  return (
    <form noValidate onSubmit={onSubmit}>
      <Stack gap="5">
        {requestError && (
          <Text bg="state.dangerSoft" borderRadius="control" color="state.danger" fontSize="sm" p="3">
            {getApiErrorMessage(requestError)}
          </Text>
        )}
        {upsertMutation.isSuccess && !requestError && (
          <Text bg="state.successSoft" borderRadius="control" color="state.success" fontSize="sm" p="3" role="status">
            {t.email.sender.saved}
          </Text>
        )}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
          <FormTextField
            error={form.formState.errors.fromAddress?.message}
            label={t.email.sender.fields.fromAddress}
            placeholder={t.email.sender.placeholders.fromAddress}
            registration={form.register("fromAddress")}
            type="email"
          />
          <FormTextField
            error={form.formState.errors.fromDisplayName?.message}
            label={t.email.sender.fields.fromDisplayName}
            placeholder={t.email.sender.placeholders.fromDisplayName}
            registration={form.register("fromDisplayName")}
          />
          <FormTextField
            error={form.formState.errors.smtpHost?.message}
            label={t.email.sender.fields.smtpHost}
            placeholder={t.email.sender.placeholders.smtpHost}
            registration={form.register("smtpHost")}
          />
          <FormTextField
            error={form.formState.errors.smtpPort?.message}
            label={t.email.sender.fields.smtpPort}
            placeholder={t.email.sender.placeholders.smtpPort}
            registration={form.register("smtpPort")}
            type="number"
          />
        </SimpleGrid>
        <Field.Root invalid={Boolean(form.formState.errors.smtpSecurity)} maxW={{ md: "50%" }}>
          <Field.Label color="ink.body" fontSize="sm" fontWeight="650">{t.email.sender.fields.smtpSecurity}</Field.Label>
          <NativeSelect.Root>
            <NativeSelect.Field bg="app.muted" borderColor="transparent" borderRadius="control" _focusVisible={{ bg: "app.surface", borderColor: "accent.focus" }} {...form.register("smtpSecurity", { valueAsNumber: true })}>
              {securityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>
        <Box bg="app.subtle" borderRadius="control" p="4">
          <Text color="ink.strong" fontSize="sm" fontWeight="700">{t.email.sender.credentialsTitle}</Text>
          <Text color="ink.muted" fontSize="xs" lineHeight="1.6" mb="4" mt="1">
            {sender?.isConfigured ? t.email.sender.credentialsEditHint : t.email.sender.credentialsHint}
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            <FormTextField
              autoComplete="off"
              error={form.formState.errors.smtpUsername?.message}
              label={t.email.sender.fields.smtpUsername}
              placeholder={t.email.sender.placeholders.smtpUsername}
              registration={form.register("smtpUsername")}
            />
            <FormTextField
              autoComplete="new-password"
              error={form.formState.errors.smtpPassword?.message}
              label={t.email.sender.fields.smtpPassword}
              placeholder={t.email.sender.placeholders.smtpPassword}
              registration={form.register("smtpPassword")}
              type="password"
            />
          </SimpleGrid>
        </Box>
        <Flex justify="flex-end">
          <Tooltip content={t.permissions.actionDenied} disabled={canManage}>
            <Box as="span" display="inline-flex">
              <Button bg="accent.solid" color="ink.onAccent" disabled={!canManage} loading={upsertMutation.isPending} type="submit">
                <Save size={16} />{t.email.sender.save}
              </Button>
            </Box>
          </Tooltip>
        </Flex>
      </Stack>
    </form>
  );
}
