"use client";

import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useState } from "react";

import type { CheckRecipientDto } from "@/api/recipients.api";
import { PageHeading } from "@/components/ui/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/screen-state";
import { Tooltip } from "@/components/ui/tooltip";
import { usePermissionsQuery } from "@/features/permissions";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";

import { usePassivateRecipientMutation, useRecipientsQuery } from "../hooks/use-recipient-queries";
import { PassivateRecipientDialog } from "./passivate-recipient-dialog";
import { RecipientFormDialog } from "./recipient-form-dialog";
import { RecipientRow } from "./recipient-row";

const pageSize = 20;

export function RecipientsPageView() {
  const [page, setPage] = useState(0);
  const [editingRecipient, setEditingRecipient] = useState<CheckRecipientDto>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [passivatingRecipient, setPassivatingRecipient] = useState<CheckRecipientDto>();
  const recipientsQuery = useRecipientsQuery(page * pageSize, pageSize);
  const passivateMutation = usePassivateRecipientMutation();
  const { data: granted = emptyGrantedPermissions } = usePermissionsQuery();
  const canManage = hasPermission(granted, Permissions.recipients.manage);
  const items = recipientsQuery.data?.items ?? [];
  const totalCount = recipientsQuery.data?.totalCount ?? 0;
  const hasNextPage = (page + 1) * pageSize < totalCount;

  const openCreate = () => { setEditingRecipient(undefined); setIsFormOpen(true); };
  const openEdit = (recipient: CheckRecipientDto) => { setEditingRecipient(recipient); setIsFormOpen(true); };
  const confirmPassivate = async () => {
    if (!passivatingRecipient?.id) return;
    try {
      await passivateMutation.mutateAsync(passivatingRecipient.id);
      setPassivatingRecipient(undefined);
    } catch {
      // Safe page error below.
    }
  };
  const failure = recipientsQuery.error ?? passivateMutation.error;
  const requestError = failure instanceof ApiRequestError ? failure : null;

  return (
    <Stack gap="7">
      <PageHeading
        actions={
          <Tooltip content={t.permissions.actionDenied} disabled={canManage}>
            <Box as="span" display="inline-flex">
              <Button bg="accent.solid" color="ink.onAccent" disabled={!canManage} onClick={openCreate}>
                <Plus size={16} />{t.recipients.actions.add}
              </Button>
            </Box>
          </Tooltip>
        }
        description={t.recipients.description}
        eyebrow={t.recipients.eyebrow}
        title={t.recipients.title}
      />
      {requestError && (
        <ErrorState
          description={getApiErrorMessage(requestError)}
          onRetry={() => void recipientsQuery.refetch()}
          title={t.recipients.loadErrorTitle}
        />
      )}
      {recipientsQuery.isPending ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel">
          <EmptyState
            actionDisabled={!canManage}
            actionDisabledReason={t.permissions.actionDenied}
            actionLabel={t.recipients.actions.add}
            description={t.recipients.empty.description}
            onAction={openCreate}
            title={t.recipients.empty.title}
          />
        </Box>
      ) : (
        <>
          <Stack gap="3">
            {items.map((recipient) => (
              <RecipientRow
                canManage={canManage}
                isPassivating={passivateMutation.isPending && passivatingRecipient?.id === recipient.id}
                key={recipient.id ?? recipient.email}
                onEdit={() => openEdit(recipient)}
                onPassivate={() => setPassivatingRecipient(recipient)}
                recipient={recipient}
              />
            ))}
          </Stack>
          <Flex align="center" justify="space-between">
            <Text color="ink.muted" fontSize="sm">{t.recipients.pagination(totalCount)}</Text>
            <Flex gap="2">
              <Button disabled={page === 0} onClick={() => setPage((value) => value - 1)} size="sm" variant="outline">
                {t.recipients.previous}
              </Button>
              <Button disabled={!hasNextPage} onClick={() => setPage((value) => value + 1)} size="sm" variant="outline">
                {t.recipients.next}
              </Button>
            </Flex>
          </Flex>
        </>
      )}
      <RecipientFormDialog onClose={() => setIsFormOpen(false)} open={isFormOpen} recipient={editingRecipient} />
      <PassivateRecipientDialog
        isPending={passivateMutation.isPending}
        onClose={() => setPassivatingRecipient(undefined)}
        onConfirm={() => void confirmPassivate()}
        recipient={passivatingRecipient}
      />
    </Stack>
  );
}
