"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CloseButton, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { useCreateTenantMutation } from "../hooks/use-team-queries";
import { tenantSchema, type TenantFormValues } from "../team-schemas";

export function CreateTenantDialog({ onClose, open }: { onClose: () => void; open: boolean }) {
  const mutation = useCreateTenantMutation();
  const form = useForm<TenantFormValues>({ defaultValues: { adminEmailAddress: "", adminPassword: "", name: "" }, resolver: zodResolver(tenantSchema) });
  const submit = form.handleSubmit(async (values) => {
    mutation.reset();
    try { await mutation.mutateAsync(values); form.reset(); onClose(); } catch { /* Mutation owns safe feedback. */ }
  });
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;

  return (
    <Dialog.Root lazyMount open={open} onOpenChange={(event) => !event.open && onClose()} placement="center">
      <Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content>
        <Dialog.Header><Dialog.Title>{t.team.tenantForm.createTitle}</Dialog.Title></Dialog.Header>
        <Dialog.Body><form id="create-tenant-form" noValidate onSubmit={submit}><Stack gap="4">
          <Text color="ink.muted" fontSize="sm" lineHeight="1.6">{t.team.tenantForm.description}</Text>
          {error && <Text bg="state.dangerSoft" color="state.danger" p="3" borderRadius="10px">{getApiErrorMessage(error)}</Text>}
          <FormTextField error={form.formState.errors.name?.message} label={t.team.fields.tenantName} placeholder={t.team.placeholders.tenantName} registration={form.register("name")} />
          <FormTextField error={form.formState.errors.adminEmailAddress?.message} label={t.team.fields.adminEmail} placeholder={t.team.placeholders.email} registration={form.register("adminEmailAddress")} type="email" />
          <FormTextField autoComplete="new-password" error={form.formState.errors.adminPassword?.message} label={t.team.fields.adminPassword} placeholder={t.team.placeholders.password} registration={form.register("adminPassword")} type="password" />
        </Stack></form></Dialog.Body>
        <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button bg="accent.solid" color="ink.onAccent" form="create-tenant-form" loading={mutation.isPending} type="submit"><Save size={15} />{t.common.save}</Button></Dialog.Footer>
        <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
      </Dialog.Content></Dialog.Positioner></Portal>
    </Dialog.Root>
  );
}
