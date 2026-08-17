"use client";

import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";

import type { CheckRecipientDto } from "@/api/recipients.api";
import { t } from "@/i18n/tr";

export function PassivateRecipientDialog({
  isPending,
  onClose,
  onConfirm,
  recipient,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipient?: CheckRecipientDto;
}) {
  return (
    <Dialog.Root open={Boolean(recipient)} onOpenChange={(event) => !event.open && onClose()} role="alertdialog">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="4">
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>{t.recipients.passivate.title}</Dialog.Title></Dialog.Header>
            <Dialog.Body>
              <Text color="ink.body" lineHeight="1.7">{t.recipients.passivate.description(recipient?.email ?? "")}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={onClose} variant="outline">{t.recipients.form.cancel}</Button>
              <Button colorPalette="red" loading={isPending} onClick={onConfirm}>{t.recipients.passivate.confirm}</Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
