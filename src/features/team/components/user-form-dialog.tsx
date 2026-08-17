"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button, CloseButton, Dialog, Field, Portal, SimpleGrid, Stack, Switch, Text } from "@chakra-ui/react";
import { Save } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import type { IdentityRoleDto, IdentityUserDto } from "@/api/team.api";
import { FormTextField } from "@/components/ui/form-text-field";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { useUpdateUserMutation } from "../hooks/use-team-queries";
import { userSchema, type UserFormValues } from "../team-schemas";
import { RoleChecklist } from "./role-checklist";

export function UserFormDialog({ assignedRoles, onClose, roles, tenantId, user }: { assignedRoles: IdentityRoleDto[]; onClose: () => void; roles: IdentityRoleDto[]; tenantId?: string; user?: IdentityUserDto }) {
  const mutation = useUpdateUserMutation();
  const form = useForm<UserFormValues>({
    defaultValues: { email: user?.email ?? "", isActive: user?.isActive ?? true, lockoutEnabled: user?.lockoutEnabled ?? true, name: user?.name ?? "", phoneNumber: user?.phoneNumber ?? "", roleNames: assignedRoles.flatMap((role) => role.name ? [role.name] : []), surname: user?.surname ?? "", userName: user?.userName ?? "" },
    resolver: zodResolver(userSchema),
  });
  const submit = form.handleSubmit(async (values) => {
    if (!tenantId || !user?.id) return;
    try {
      await mutation.mutateAsync({ tenantId, userId: user.id, input: { ...values, concurrencyStamp: user.concurrencyStamp, name: values.name || null, phoneNumber: values.phoneNumber || null, surname: values.surname || null } });
      onClose();
    } catch { /* Mutation owns safe feedback. */ }
  });
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;
  return (
    <Dialog.Root open={Boolean(user)} onOpenChange={(event) => !event.open && onClose()} placement="center" size="lg"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content maxH="calc(100dvh - 32px)" overflow="hidden">
      <Dialog.Header><Dialog.Title>{t.team.userForm.title}</Dialog.Title></Dialog.Header>
      <Dialog.Body overflowY="auto"><form id="user-form" noValidate onSubmit={submit}><Stack gap="4">
        {error && <Text bg="state.dangerSoft" color="state.danger" p="3" borderRadius="10px">{getApiErrorMessage(error)}</Text>}
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4"><FormTextField error={form.formState.errors.userName?.message} label={t.team.fields.userName} registration={form.register("userName")} /><FormTextField error={form.formState.errors.email?.message} label={t.team.fields.email} registration={form.register("email")} type="email" /><FormTextField error={form.formState.errors.name?.message} label={t.team.fields.name} registration={form.register("name")} /><FormTextField error={form.formState.errors.surname?.message} label={t.team.fields.surname} registration={form.register("surname")} /><FormTextField error={form.formState.errors.phoneNumber?.message} label={t.team.fields.phone} registration={form.register("phoneNumber")} /></SimpleGrid>
        <Field.Root><Field.Label>{t.team.fields.roles}</Field.Label><Controller control={form.control} name="roleNames" render={({ field }) => <RoleChecklist onChange={field.onChange} roles={roles} value={field.value} />} /></Field.Root>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="3">
          <Controller control={form.control} name="isActive" render={({ field }) => <Switch.Root checked={field.value} onCheckedChange={(event) => field.onChange(event.checked)}><Switch.HiddenInput /><Switch.Control /><Switch.Label>{t.team.fields.active}</Switch.Label></Switch.Root>} />
          <Controller control={form.control} name="lockoutEnabled" render={({ field }) => <Switch.Root checked={field.value} onCheckedChange={(event) => field.onChange(event.checked)}><Switch.HiddenInput /><Switch.Control /><Switch.Label>{t.team.fields.lockout}</Switch.Label></Switch.Root>} />
        </SimpleGrid>
      </Stack></form></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button bg="accent.solid" color="ink.onAccent" form="user-form" loading={mutation.isPending} type="submit"><Save size={15} />{t.common.save}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
