import { Button, CloseButton, Dialog, Portal, Text } from "@chakra-ui/react";

import type { LookupDto } from "@/api/lookups.api";
import { t } from "@/i18n/tr";

export function PassivateLookupDialog({ isPending, item, onClose, onConfirm }: { isPending: boolean; item?: LookupDto; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog.Root open={Boolean(item)} onOpenChange={(event) => !event.open && onClose()} role="alertdialog"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content>
      <Dialog.Header><Dialog.Title>{t.lookups.passivate.title}</Dialog.Title></Dialog.Header>
      <Dialog.Body><Text color="ink.body" lineHeight="1.7">{t.lookups.passivate.description(item?.name ?? "")}</Text></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button colorPalette="red" loading={isPending} onClick={onConfirm}>{t.lookups.actions.passivate}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
