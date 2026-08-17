"use client";

import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";

import type { SpecSourceDto } from "@/api/sources.api";
import { t } from "@/i18n/tr";

export function PassivateSourceDialog({
  isPending,
  onClose,
  onConfirm,
  source,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  source?: SpecSourceDto;
}) {
  return (
    <Dialog.Root open={Boolean(source)} onOpenChange={(event) => !event.open && onClose()} role="alertdialog">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p="4">
          <Dialog.Content>
            <Dialog.Header><Dialog.Title>{t.sources.passivate.title}</Dialog.Title></Dialog.Header>
            <Dialog.Body><Text color="ink.body" lineHeight="1.7">{t.sources.passivate.description(source?.name ?? "")}</Text></Dialog.Body>
            <Dialog.Footer><Button onClick={onClose} variant="outline">{t.sources.form.cancel}</Button><Button colorPalette="red" loading={isPending} onClick={onConfirm}>{t.sources.passivate.confirm}</Button></Dialog.Footer>
            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
