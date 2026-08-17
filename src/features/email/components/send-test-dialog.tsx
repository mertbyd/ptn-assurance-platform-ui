"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CloseButton, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { Send } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { testRecipientSchema, type TestRecipientFormValues } from "../sender-schema";
import { useSendTestEmailMutation } from "../hooks/use-email-queries";

export function SendTestDialog({ onClose, open }: { onClose: () => void; open: boolean }) {
  const sendTestMutation = useSendTestEmailMutation();
  const form = useForm<TestRecipientFormValues>({
    defaultValues: { recipient: "" },
    resolver: zodResolver(testRecipientSchema),
  });

  useEffect(() => {
    if (open) {
      form.reset({ recipient: "" });
      sendTestMutation.reset();
    }
    // Diyalog her acilista temiz baslar; mutation nesnesi bagimlilik olarak izlenmez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, open]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await sendTestMutation.mutateAsync(values.recipient);
    } catch {
      // Mutation state owns the safe error feedback below.
    }
  });
  const requestError = sendTestMutation.error instanceof ApiRequestError ? sendTestMutation.error : null;

  return (
    <Dialog.Root lazyMount open={open} onOpenChange={(event) => !event.open && onClose()} placement="center">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="4">
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>{t.email.sender.test.title}</Dialog.Title></Dialog.Header>
            <Dialog.Body>
              <form id="send-test-form" noValidate onSubmit={onSubmit}>
                <Stack gap="4">
                  <Text color="ink.muted" fontSize="sm" lineHeight="1.7">{t.email.sender.test.description}</Text>
                  {requestError && (
                    <Text bg="state.dangerSoft" borderRadius="control" color="state.danger" fontSize="sm" p="3">
                      {getApiErrorMessage(requestError)}
                    </Text>
                  )}
                  {sendTestMutation.isSuccess && !requestError && (
                    <Text bg="state.successSoft" borderRadius="control" color="state.success" fontSize="sm" p="3" role="status">
                      {t.email.sender.test.success(sendTestMutation.variables ?? "")}
                    </Text>
                  )}
                  <FormTextField
                    autoComplete="off"
                    error={form.formState.errors.recipient?.message}
                    label={t.email.sender.test.field}
                    placeholder={t.email.sender.test.placeholder}
                    registration={form.register("recipient")}
                    type="email"
                  />
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} variant="outline">{t.email.cancel}</Button>
              <Button bg="accent.solid" color="ink.onAccent" form="send-test-form" loading={sendTestMutation.isPending} type="submit">
                <Send size={16} />{t.email.sender.test.submit}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
