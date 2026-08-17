"use client";

import { Accordion, Box, Button, Checkbox, CloseButton, Dialog, Flex, Portal, Stack, Text } from "@chakra-ui/react";
import { Save, ShieldCheck } from "lucide-react";
import { useState } from "react";

import type { IdentityUserDto, PermissionGrantInfoDto, PermissionListDto } from "@/api/team.api";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { useUpdateUserPermissionsMutation } from "../hooks/use-team-queries";

function updateGrantTree(current: Record<string, boolean>, permissions: PermissionGrantInfoDto[], name: string, checked: boolean) {
  const next = { ...current, [name]: checked };
  if (checked) {
    let parent = permissions.find((permission) => permission.name === name)?.parentName;
    while (parent) { next[parent] = true; parent = permissions.find((permission) => permission.name === parent)?.parentName; }
  } else {
    const queue = [name];
    while (queue.length) {
      const parent = queue.shift();
      permissions.filter((permission) => permission.parentName === parent).forEach((child) => { if (child.name) { next[child.name] = false; queue.push(child.name); } });
    }
  }
  return next;
}

export function PermissionEditorDialog({ data, onClose, tenantId, user }: {
  data: PermissionListDto;
  onClose: () => void;
  tenantId: string;
  user: IdentityUserDto;
}) {
  const permissions = (data.groups ?? []).flatMap((group) => group.permissions ?? []);
  const [grants, setGrants] = useState<Record<string, boolean>>(() => Object.fromEntries(permissions.flatMap((permission) => permission.name ? [[permission.name, Boolean(permission.isGranted)]] : [])));
  const mutation = useUpdateUserPermissionsMutation();
  const save = async () => {
    if (!user.id) return;
    try {
      await mutation.mutateAsync({ tenantId, userId: user.id, input: { permissions: permissions.flatMap((permission) => permission.name && permission.isEditable ? [{ isGranted: grants[permission.name] ?? false, name: permission.name }] : []) } });
      onClose();
    } catch { /* Mutation owns safe feedback. */ }
  };
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;
  return (
    <Dialog.Root open onOpenChange={(event) => !event.open && onClose()} placement="center" size="xl"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content maxH="calc(100dvh - 32px)" overflow="hidden">
      <Dialog.Header><Dialog.Title>{t.team.permissions.title(user.userName ?? "")}</Dialog.Title></Dialog.Header>
      <Dialog.Body overflowY="auto"><Stack gap="4">
        <Text color="ink.muted" fontSize="sm" lineHeight="1.6">{t.team.permissions.description}</Text>
        {error && <Text bg="state.dangerSoft" color="state.danger" p="3" borderRadius="10px">{getApiErrorMessage(error)}</Text>}
        <Accordion.Root collapsible defaultValue={(data.groups ?? []).slice(0, 1).flatMap((group) => group.name ? [group.name] : [])} multiple>
          {(data.groups ?? []).map((group) => (
            <Accordion.Item borderColor="line.subtle" key={group.name} value={group.name ?? ""}>
              <Accordion.ItemTrigger py="4"><Flex align="center" flex="1" gap="2"><ShieldCheck color="var(--acc-colors-accent-solid)" size={17} /><Text color="ink.strong" fontWeight="700">{group.displayName ?? group.name}</Text></Flex><Accordion.ItemIndicator /></Accordion.ItemTrigger>
              <Accordion.ItemContent><Accordion.ItemBody><Stack gap="2" pb="3">
                {(group.permissions ?? []).map((permission) => permission.name && (
                  <Box bg="app.subtle" borderRadius="10px" key={permission.name} p="3" pl={permission.parentName ? "7" : "3"}>
                    <Checkbox.Root checked={grants[permission.name] ?? false} disabled={!permission.isEditable} onCheckedChange={(event) => setGrants((current) => updateGrantTree(current, permissions, permission.name!, Boolean(event.checked)))}>
                      <Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                      <Checkbox.Label><Text color="ink.strong" fontSize="sm" fontWeight={permission.parentName ? "500" : "650"}>{permission.displayName ?? permission.name}</Text></Checkbox.Label>
                    </Checkbox.Root>
                  </Box>
                ))}
              </Stack></Accordion.ItemBody></Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Stack></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button bg="accent.solid" color="ink.onAccent" loading={mutation.isPending} onClick={() => void save()}><Save size={15} />{t.team.permissions.save}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
