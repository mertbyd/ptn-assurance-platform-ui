import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";

import { t } from "@/i18n/tr";

export function ConfirmDeleteDialog({ description, isPending, onClose, onConfirm, open, title }: {
  description: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(event) => !event.open && onClose()} role="alertdialog"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content>
      <Dialog.Header><Dialog.Title>{title}</Dialog.Title></Dialog.Header>
      <Dialog.Body><Text color="ink.body" lineHeight="1.7">{description}</Text></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button colorPalette="red" loading={isPending} onClick={onConfirm}>{t.common.delete}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
