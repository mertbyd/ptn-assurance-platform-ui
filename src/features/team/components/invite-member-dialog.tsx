"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CloseButton, Dialog, Field, Portal, Stack, Text } from "@chakra-ui/react";
import { Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import type { IdentityRoleDto } from "@/api/team.api";
import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { useInviteUserMutation } from "../hooks/use-team-queries";
import { inviteMemberSchema, type InviteMemberValues } from "../team-schemas";
import { RoleChecklist } from "./role-checklist";

export function InviteMemberDialog({ onClose, open, roles, tenantId }: { onClose: () => void; open: boolean; roles: IdentityRoleDto[]; tenantId?: string }) {
  const mutation = useInviteUserMutation();
  const form = useForm<InviteMemberValues>({ defaultValues: { email: "", roleNames: [], userName: "" }, resolver: zodResolver(inviteMemberSchema) });
  const submit = form.handleSubmit(async (values) => {
    if (!tenantId) return;
    try {
      await mutation.mutateAsync({ tenantId, input: { email: values.email, roleNames: values.roleNames.length ? values.roleNames : null, userName: values.userName || null } });
      form.reset(); onClose();
    } catch { /* Mutation owns safe feedback. */ }
  });
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;
  return (
    <Dialog.Root lazyMount open={open} onOpenChange={(event) => !event.open && onClose()} placement="center"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content>
      <Dialog.Header><Dialog.Title>{t.team.invite.title}</Dialog.Title></Dialog.Header>
      <Dialog.Body><form id="invite-member-form" noValidate onSubmit={submit}><Stack gap="4">
        <Text color="ink.muted" fontSize="sm" lineHeight="1.6">{t.team.invite.description}</Text>
        {error && <Text bg="state.dangerSoft" color="state.danger" p="3" borderRadius="10px">{getApiErrorMessage(error)}</Text>}
        <FormTextField error={form.formState.errors.email?.message} label={t.team.fields.email} placeholder={t.team.placeholders.email} registration={form.register("email")} type="email" />
        <FormTextField error={form.formState.errors.userName?.message} label={t.team.fields.userNameOptional} placeholder={t.team.placeholders.userName} registration={form.register("userName")} />
        <Field.Root><Field.Label>{t.team.fields.roles}</Field.Label><Controller control={form.control} name="roleNames" render={({ field }) => <RoleChecklist onChange={field.onChange} roles={roles} value={field.value} />} /><Field.HelperText>{t.team.invite.roleHint}</Field.HelperText></Field.Root>
      </Stack></form></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button bg="accent.solid" color="ink.onAccent" form="invite-member-form" loading={mutation.isPending} type="submit"><Send size={15} />{t.team.actions.sendInvite}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
