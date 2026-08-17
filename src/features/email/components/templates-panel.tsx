"use client";

import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useState } from "react";

import type { EmailTemplateDto } from "@/api/email.api";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/screen-state";
import { Tooltip } from "@/components/ui/tooltip";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { RemoveTemplateDialog } from "./remove-template-dialog";
import { TemplateFormDialog } from "./template-form-dialog";
import { TemplateRow } from "./template-row";
import { useEmailTemplatesQuery, useRemoveTemplateMutation } from "../hooks/use-email-queries";

const pageSize = 20;

export function TemplatesPanel({ canManage, canView }: { canManage: boolean; canView: boolean }) {
  const [page, setPage] = useState(0);
  const [formTarget, setFormTarget] = useState<{ source?: EmailTemplateDto; targetId?: string }>();
  const [removingTemplate, setRemovingTemplate] = useState<EmailTemplateDto>();
  const templatesQuery = useEmailTemplatesQuery(canView, page * pageSize, pageSize);
  const removeMutation = useRemoveTemplateMutation();
  const items = templatesQuery.data?.items ?? [];
  const totalCount = templatesQuery.data?.totalCount ?? 0;
  const hasNextPage = (page + 1) * pageSize < totalCount;
  const failure = templatesQuery.error ?? removeMutation.error;
  const requestError = failure instanceof ApiRequestError ? failure : null;

  // Miras alinan sablon icerigi tasinir, kimlik tasinmaz: sonuc yeni bir kiraci kaydidir.
  const openFork = (template: EmailTemplateDto) => setFormTarget({ source: template });
  const openEdit = (template: EmailTemplateDto) => setFormTarget({ source: template, targetId: template.id });
  const confirmRemove = async () => {
    if (!removingTemplate?.id) return;
    try {
      await removeMutation.mutateAsync(removingTemplate.id);
      setRemovingTemplate(undefined);
    } catch {
      // Safe panel error below.
    }
  };

  return (
    <Stack gap="5">
      <Flex align="flex-start" direction={{ base: "column", md: "row" }} gap="4" justify="space-between">
        <Box>
          <Text color="ink.strong" fontSize="md" fontWeight="750">{t.email.templates.title}</Text>
          <Text color="ink.muted" fontSize="sm" lineHeight="1.7" maxW="640px" mt="1">{t.email.templates.description}</Text>
        </Box>
        <Tooltip content={t.permissions.actionDenied} disabled={canManage}>
          <Box as="span" display="inline-flex">
            <Button bg="accent.solid" color="ink.onAccent" disabled={!canManage} onClick={() => setFormTarget({})} size="sm">
              <Plus size={15} />{t.email.templates.actions.add}
            </Button>
          </Box>
        </Tooltip>
      </Flex>
      {requestError && (
        <ErrorState
          description={getApiErrorMessage(requestError)}
          onRetry={() => void templatesQuery.refetch()}
          title={t.email.templates.loadErrorTitle}
        />
      )}
      {templatesQuery.isPending && canView ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel">
          <EmptyState
            actionDisabled={!canManage}
            actionDisabledReason={t.permissions.actionDenied}
            actionLabel={t.email.templates.actions.add}
            description={t.email.templates.empty.description}
            onAction={() => setFormTarget({})}
            title={t.email.templates.empty.title}
          />
        </Box>
      ) : (
        <>
          <Stack gap="3">
            {items.map((template) => (
              <TemplateRow
                canManage={canManage}
                isRemoving={removeMutation.isPending && removingTemplate?.id === template.id}
                key={template.id ?? template.name}
                onEdit={() => openEdit(template)}
                onFork={() => openFork(template)}
                onRemove={() => setRemovingTemplate(template)}
                template={template}
              />
            ))}
          </Stack>
          <Flex align="center" justify="space-between">
            <Text color="ink.muted" fontSize="sm">{t.email.templates.pagination(totalCount)}</Text>
            <Flex gap="2">
              <Button disabled={page === 0} onClick={() => setPage((value) => value - 1)} size="sm" variant="outline">
                {t.email.templates.previous}
              </Button>
              <Button disabled={!hasNextPage} onClick={() => setPage((value) => value + 1)} size="sm" variant="outline">
                {t.email.templates.next}
              </Button>
            </Flex>
          </Flex>
        </>
      )}
      <TemplateFormDialog onClose={() => setFormTarget(undefined)} open={Boolean(formTarget)} template={formTarget} />
      <RemoveTemplateDialog
        isPending={removeMutation.isPending}
        onClose={() => setRemovingTemplate(undefined)}
        onConfirm={() => void confirmRemove()}
        template={removingTemplate}
      />
    </Stack>
  );
}
