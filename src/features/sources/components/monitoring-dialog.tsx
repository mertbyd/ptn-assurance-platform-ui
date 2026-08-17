"use client";

import { Button, CloseButton, Dialog, Field, Input, Portal, Stack, Switch, Text } from "@chakra-ui/react";
import { Clock3 } from "lucide-react";
import { useState } from "react";

import type { SpecDocumentDto, SpecDocumentMonitoringDto } from "@/api/sources.api";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { useConfigureMonitoringMutation } from "../hooks/use-source-queries";

type DocumentWithSource = { document: SpecDocumentDto; sourceId: string };

export function MonitoringDialog({ onClose, onSaved, target }: {
  onClose: () => void;
  onSaved: (documentId: string, result: SpecDocumentMonitoringDto) => void;
  target?: DocumentWithSource;
}) {
  const [isMonitored, setIsMonitored] = useState(true);
  const [interval, setInterval] = useState(60);
  const mutation = useConfigureMonitoringMutation();
  const save = async () => {
    if (!target?.document.id) return;
    try {
      const result = await mutation.mutateAsync({ documentId: target.document.id, id: target.sourceId, input: { checkIntervalMinutes: isMonitored ? interval : null, isMonitored } });
      onSaved(target.document.id, result); onClose();
    } catch { /* Mutation owns safe feedback. */ }
  };
  const error = mutation.error instanceof ApiRequestError ? mutation.error : null;
  return (
    <Dialog.Root open={Boolean(target)} onOpenChange={(event) => !event.open && onClose()} placement="center"><Portal><Dialog.Backdrop /><Dialog.Positioner p="4"><Dialog.Content>
      <Dialog.Header><Dialog.Title>{t.sources.monitoring.title(target?.document.documentName ?? "")}</Dialog.Title></Dialog.Header>
      <Dialog.Body><Stack gap="4">
        <Text color="ink.muted" fontSize="sm" lineHeight="1.6">{t.sources.monitoring.description}</Text>
        {error && <Text bg="state.dangerSoft" color="state.danger" p="3" borderRadius="10px">{getApiErrorMessage(error)}</Text>}
        <Switch.Root checked={isMonitored} onCheckedChange={(event) => setIsMonitored(event.checked)}><Switch.HiddenInput /><Switch.Control /><Switch.Label>{t.sources.monitoring.enabled}</Switch.Label></Switch.Root>
        {isMonitored && <Field.Root><Field.Label>{t.sources.monitoring.interval}</Field.Label><Input bg="app.muted" borderColor="transparent" max={10080} min={1} onChange={(event) => setInterval(Number(event.target.value))} type="number" value={interval} /><Field.HelperText>{t.sources.monitoring.intervalHint}</Field.HelperText></Field.Root>}
        <Text bg="state.infoSoft" borderRadius="10px" color="ink.body" fontSize="xs" lineHeight="1.6" p="3">{t.sources.monitoring.readLimitation}</Text>
      </Stack></Dialog.Body>
      <Dialog.Footer><Button onClick={onClose} variant="outline">{t.common.cancel}</Button><Button bg="accent.solid" color="ink.onAccent" disabled={isMonitored && (!Number.isInteger(interval) || interval < 1 || interval > 10080)} loading={mutation.isPending} onClick={() => void save()}><Clock3 size={15} />{t.sources.monitoring.save}</Button></Dialog.Footer>
      <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
    </Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>
  );
}
