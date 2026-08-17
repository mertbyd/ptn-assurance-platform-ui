"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CloseButton, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { CheckRecipientDto } from "@/api/recipients.api";
import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { recipientSchema, type RecipientFormValues } from "../recipient-schema";
import { useCreateRecipientMutation, useUpdateRecipientMutation } from "../hooks/use-recipient-queries";

const emptyValues: RecipientFormValues = { displayName: "", email: "" };

function valuesFromRecipient(recipient?: CheckRecipientDto): RecipientFormValues {
  if (!recipient) return emptyValues;
  return { displayName: recipient.displayName ?? "", email: recipient.email ?? "" };
}

export function RecipientFormDialog({
  onClose,
  open,
  recipient,
}: {
  onClose: () => void;
  open: boolean;
  recipient?: CheckRecipientDto;
}) {
  const createMutation = useCreateRecipientMutation();
  const updateMutation = useUpdateRecipientMutation();
  const form = useForm<RecipientFormValues>({ defaultValues: emptyValues, resolver: zodResolver(recipientSchema) });
  const activeMutation = recipient ? updateMutation : createMutation;

  useEffect(() => {
    if (open) form.reset(valuesFromRecipient(recipient));
  }, [form, open, recipient]);

  const onSubmit = form.handleSubmit(async (values) => {
    activeMutation.reset();
    const input = { displayName: values.displayName || null, email: values.email };
    try {
      if (recipient?.id) await updateMutation.mutateAsync({ id: recipient.id, input });
      else await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // Mutation state owns the safe error feedback below.
    }
  });
  const requestError = activeMutation.error instanceof ApiRequestError ? activeMutation.error : null;

  return (
    <Dialog.Root lazyMount open={open} onOpenChange={(event) => !event.open && onClose()} placement="center">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="4">
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{recipient ? t.recipients.form.editTitle : t.recipients.form.createTitle}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form id="recipient-form" noValidate onSubmit={onSubmit}>
                <Stack gap="4">
                  {requestError && (
                    <Text bg="state.dangerSoft" borderRadius="control" color="state.danger" fontSize="sm" p="3">
                      {getApiErrorMessage(requestError)}
                    </Text>
                  )}
                  <FormTextField
                    autoComplete="off"
                    error={form.formState.errors.email?.message}
                    label={t.recipients.fields.email}
                    placeholder={t.recipients.placeholders.email}
                    registration={form.register("email")}
                    type="email"
                  />
                  <FormTextField
                    autoComplete="off"
                    error={form.formState.errors.displayName?.message}
                    helperText={t.recipients.form.hint}
                    label={t.recipients.fields.displayName}
                    placeholder={t.recipients.placeholders.displayName}
                    registration={form.register("displayName")}
                  />
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} variant="outline">{t.recipients.form.cancel}</Button>
              <Button bg="accent.solid" color="ink.onAccent" form="recipient-form" loading={activeMutation.isPending} type="submit">
                <Save size={16} />{t.recipients.form.save}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
