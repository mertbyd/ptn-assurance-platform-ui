"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CloseButton, Dialog, Field, Portal, SimpleGrid, Stack, Switch, Text } from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import type { EmailTemplateDto } from "@/api/email.api";
import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { templateSchema, type TemplateFormValues } from "../template-schema";
import { useCreateTemplateMutation, useUpdateTemplateMutation } from "../hooks/use-email-queries";

const emptyValues: TemplateFormValues = {
  body: "",
  culture: "",
  description: "",
  isLayout: false,
  name: "",
  subject: "",
};

function valuesFromTemplate(template?: EmailTemplateDto): TemplateFormValues {
  if (!template) return emptyValues;
  return {
    body: template.body ?? "",
    culture: template.culture ?? "",
    description: template.description ?? "",
    isLayout: template.isLayout ?? false,
    name: template.name ?? "",
    subject: template.subject ?? "",
  };
}

// Miras alinan sablon duzenlenemez; "kiraci kopyasi" akisinda icerik tasinir ama kimlik tasinmaz.
export function TemplateFormDialog({
  onClose,
  open,
  template,
}: {
  onClose: () => void;
  open: boolean;
  template?: { source?: EmailTemplateDto; targetId?: string };
}) {
  const createMutation = useCreateTemplateMutation();
  const updateMutation = useUpdateTemplateMutation();
  const form = useForm<TemplateFormValues>({ defaultValues: emptyValues, resolver: zodResolver(templateSchema) });
  const targetId = template?.targetId;
  const activeMutation = targetId ? updateMutation : createMutation;

  useEffect(() => {
    if (open) form.reset(valuesFromTemplate(template?.source));
  }, [form, open, template]);

  const onSubmit = form.handleSubmit(async (values) => {
    activeMutation.reset();
    const input = {
      body: values.body,
      culture: values.culture || null,
      description: values.description || null,
      isLayout: values.isLayout,
      name: values.name,
      subject: values.subject,
    };
    try {
      if (targetId) await updateMutation.mutateAsync({ id: targetId, input });
      else await createMutation.mutateAsync(input);
      onClose();
    } catch {
      // Mutation state owns the safe error feedback below.
    }
  });
  const requestError = activeMutation.error instanceof ApiRequestError ? activeMutation.error : null;

  return (
    <Dialog.Root lazyMount open={open} onOpenChange={(event) => !event.open && onClose()} placement="center" size="xl">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="4">
          <Dialog.Content maxH="calc(100dvh - 32px)" overflow="hidden">
            <Dialog.Header>
              <Dialog.Title>{targetId ? t.email.templates.form.editTitle : t.email.templates.form.createTitle}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body overflowY="auto">
              <form id="template-form" noValidate onSubmit={onSubmit}>
                <Stack gap="4">
                  {requestError && (
                    <Text bg="state.dangerSoft" borderRadius="control" color="state.danger" fontSize="sm" p="3">
                      {getApiErrorMessage(requestError)}
                    </Text>
                  )}
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                    <FormTextField
                      error={form.formState.errors.name?.message}
                      label={t.email.templates.fields.name}
                      placeholder={t.email.templates.placeholders.name}
                      registration={form.register("name")}
                    />
                    <FormTextField
                      error={form.formState.errors.culture?.message}
                      label={t.email.templates.fields.culture}
                      placeholder={t.email.templates.placeholders.culture}
                      registration={form.register("culture")}
                    />
                  </SimpleGrid>
                  <FormTextField
                    error={form.formState.errors.subject?.message}
                    label={t.email.templates.fields.subject}
                    placeholder={t.email.templates.placeholders.subject}
                    registration={form.register("subject")}
                  />
                  <FormTextField
                    error={form.formState.errors.description?.message}
                    label={t.email.templates.fields.description}
                    placeholder={t.email.templates.placeholders.description}
                    registration={form.register("description")}
                  />
                  <FormTextField
                    error={form.formState.errors.body?.message}
                    label={t.email.templates.fields.body}
                    multiline
                    placeholder={t.email.templates.placeholders.body}
                    registration={form.register("body")}
                  />
                  <Field.Root>
                    <Controller
                      control={form.control}
                      name="isLayout"
                      render={({ field }) => (
                        <Switch.Root checked={field.value} onCheckedChange={(event) => field.onChange(event.checked)}>
                          <Switch.HiddenInput />
                          <Switch.Control />
                          <Switch.Label>{t.email.templates.fields.isLayout}</Switch.Label>
                        </Switch.Root>
                      )}
                    />
                  </Field.Root>
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} variant="outline">{t.email.cancel}</Button>
              <Button bg="accent.solid" color="ink.onAccent" form="template-form" loading={activeMutation.isPending} type="submit">
                <Save size={16} />{t.email.templates.form.save}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
