"use client";

import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";

import type { EmailTemplateDto } from "@/api/email.api";
import { t } from "@/i18n/tr";

export function RemoveTemplateDialog({
  isPending,
  onClose,
  onConfirm,
  template,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  template?: EmailTemplateDto;
}) {
  return (
    <Dialog.Root open={Boolean(template)} onOpenChange={(event) => !event.open && onClose()} role="alertdialog">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="4">
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>{t.email.templates.remove.title}</Dialog.Title></Dialog.Header>
            <Dialog.Body>
              <Text color="ink.body" lineHeight="1.7">{t.email.templates.remove.description(template?.name ?? "")}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} variant="outline">{t.email.cancel}</Button>
              <Button colorPalette="red" loading={isPending} onClick={onConfirm}>{t.email.templates.remove.confirm}</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
