"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, CloseButton, Dialog, Portal, Stack, Switch, Text } from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import type { LookupDto, LookupKind } from "@/api/lookups.api";
import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { useCreateLookupMutation, useUpdateLookupMutation } from "../hooks/use-lookup-queries";
import { lookupSchema, type LookupFormValues } from "../lookup-schema";

export function LookupFormDialog({ item, kind, onClose, open }: { item?: LookupDto; kind: LookupKind; onClose: () => void; open: boolean }) {
  const create = useCreateLookupMutation();
  const update = useUpdateLookupMutation();
  const mutation = item ? update : create;
  const form = useForm<LookupFormValues>({ defaultValues: { code: "", description: "", isActive: true, name: "" }, resolver: zodResolver(lookupSchema) });
  useEffect(() => { if (open) form.reset({ code: item?.code ?? "", description: item?.description ?? "", isActive: item?.isActive ?? true, name: item?.name ?? "" }); }, [form, item, open]);
  const submit = form.handleSubmit(async (values) => {
    try {
      if (item?.id) await update.mutateAsync({ id: item.id, kind, input: { description: values.description || null, isActive: values.isActive, name: values.name } });
      else await create.mutateAsync({ kind, input: { code: values.code, description: values.description || null, isActive: values.isActive, name: values.name } });
      onClose();
    } catch { /* Mutation owns safe feedback. */ }
  });
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;
  return (
    <Dialog.Root lazyMount open={open} onOpenChange={(event) => !event.open && onClose()} placement="center"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content>
      <Dialog.Header><Dialog.Title>{item ? t.lookups.form.editTitle : t.lookups.form.createTitle}</Dialog.Title></Dialog.Header>
      <Dialog.Body><form id="lookup-form" noValidate onSubmit={submit}><Stack gap="4">
        {error && <Text bg="state.dangerSoft" color="state.danger" p="3" borderRadius="10px">{getApiErrorMessage(error)}</Text>}
        {item ? <Box><Text color="ink.body" fontSize="sm" fontWeight="650">{t.lookups.fields.code}</Text><Text bg="app.subtle" borderRadius="10px" color="accent.solid" fontFamily="mono" fontSize="sm" mt="2" p="3">{item.code}</Text><Text color="ink.muted" fontSize="xs" mt="1.5">{t.lookups.form.codeImmutable}</Text></Box> : <FormTextField error={form.formState.errors.code?.message} label={t.lookups.fields.code} placeholder={t.lookups.placeholders.code} registration={form.register("code")} />}
        <FormTextField error={form.formState.errors.name?.message} label={t.lookups.fields.name} placeholder={t.lookups.placeholders.name} registration={form.register("name")} />
        <FormTextField error={form.formState.errors.description?.message} label={t.lookups.fields.description} placeholder={t.lookups.placeholders.description} registration={form.register("description")} />
        <Controller control={form.control} name="isActive" render={({ field }) => <Switch.Root checked={field.value} onCheckedChange={(event) => field.onChange(event.checked)}><Switch.HiddenInput /><Switch.Control /><Switch.Label>{t.lookups.fields.active}</Switch.Label></Switch.Root>} />
      </Stack></form></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button bg="accent.solid" color="ink.onAccent" form="lookup-form" loading={mutation.isPending} type="submit"><Save size={15} />{t.common.save}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
