"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CloseButton, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import type { TenantDto } from "@/api/team.api";
import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { useUpdateTenantMutation } from "../hooks/use-team-queries";
import { tenantRenameSchema, type TenantRenameValues } from "../team-schemas";

export function RenameTenantDialog({ onClose, tenant }: { onClose: () => void; tenant?: TenantDto }) {
  const mutation = useUpdateTenantMutation();
  const form = useForm<TenantRenameValues>({ defaultValues: { name: "" }, resolver: zodResolver(tenantRenameSchema) });
  useEffect(() => { if (tenant) form.reset({ name: tenant.name ?? "" }); }, [form, tenant]);
  const submit = form.handleSubmit(async (values) => {
    if (!tenant?.id) return;
    try { await mutation.mutateAsync({ id: tenant.id, input: { concurrencyStamp: tenant.concurrencyStamp, name: values.name } }); onClose(); } catch { /* Mutation owns safe feedback. */ }
  });
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;
  return (
    <Dialog.Root open={Boolean(tenant)} onOpenChange={(event) => !event.open && onClose()} placement="center"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content>
      <Dialog.Header><Dialog.Title>{t.team.tenantForm.renameTitle}</Dialog.Title></Dialog.Header>
      <Dialog.Body><form id="rename-tenant-form" onSubmit={submit}><Stack gap="4">{error && <Text bg="state.dangerSoft" color="state.danger" p="3" borderRadius="10px">{getApiErrorMessage(error)}</Text>}<FormTextField error={form.formState.errors.name?.message} label={t.team.fields.tenantName} registration={form.register("name")} /></Stack></form></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button bg="accent.solid" color="ink.onAccent" form="rename-tenant-form" loading={mutation.isPending} type="submit"><Save size={15} />{t.common.save}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
