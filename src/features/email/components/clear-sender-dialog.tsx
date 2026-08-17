"use client";

import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";

import { t } from "@/i18n/tr";

export function ClearSenderDialog({
  isPending,
  onClose,
  onConfirm,
  open,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(event) => !event.open && onClose()} role="alertdialog">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="4">
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>{t.email.sender.clearTitle}</Dialog.Title></Dialog.Header>
            <Dialog.Body><Text color="ink.body" lineHeight="1.7">{t.email.sender.clearDescription}</Text></Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} variant="outline">{t.email.cancel}</Button>
              <Button colorPalette="red" loading={isPending} onClick={onConfirm}>{t.email.sender.clearConfirm}</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
