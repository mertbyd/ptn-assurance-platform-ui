"use client";

import { Badge, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { RotateCcw, Send } from "lucide-react";
import { useState } from "react";

import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { Tooltip } from "@/components/ui/tooltip";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";

import { ClearSenderDialog } from "./clear-sender-dialog";
import { SendTestDialog } from "./send-test-dialog";
import { SenderForm } from "./sender-form";
import { useClearEmailSenderMutation, useEmailSenderQuery } from "../hooks/use-email-queries";

export function SenderPanel({ canManage, canView }: { canManage: boolean; canView: boolean }) {
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const senderQuery = useEmailSenderQuery(canView);
  const clearMutation = useClearEmailSenderMutation();
  const sender = senderQuery.data;
  const isConfigured = Boolean(sender?.isConfigured);
  const failure = senderQuery.error ?? clearMutation.error;
  const requestError = failure instanceof ApiRequestError ? failure : null;

  const confirmClear = async () => {
    try {
      await clearMutation.mutateAsync();
      setIsClearOpen(false);
    } catch {
      // Safe panel error below.
    }
  };

  if (senderQuery.isPending && canView) {
    return <LoadingState />;
  }

  return (
    <Stack gap="5">
      {requestError && (
        <ErrorState
          description={getApiErrorMessage(requestError)}
          onRetry={() => void senderQuery.refetch()}
          title={t.email.sender.loadErrorTitle}
        />
      )}
      <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" p={{ base: "5", md: "6" }}>
        <Flex align="flex-start" direction={{ base: "column", md: "row" }} gap="4" justify="space-between" mb="6">
          <Box>
            <Flex align="center" gap="2" mb="1.5" wrap="wrap">
              <Text color="ink.strong" fontSize="md" fontWeight="750">{t.email.sender.title}</Text>
              <Badge colorPalette={isConfigured ? "blue" : "gray"} size="sm">
                {isConfigured ? t.email.sender.statusConfigured : t.email.sender.statusPlatform}
              </Badge>
            </Flex>
            <Text color="ink.muted" fontSize="sm" lineHeight="1.7" maxW="620px">
              {isConfigured ? t.email.sender.statusConfiguredHint : t.email.sender.statusPlatformHint}
            </Text>
          </Box>
          <Flex gap="2" wrap="wrap">
            <Tooltip content={t.permissions.actionDenied} disabled={canManage}>
              <Box as="span" display="inline-flex">
                <Button disabled={!canManage} onClick={() => setIsTestOpen(true)} size="sm" variant="outline">
                  <Send size={15} />{t.email.sender.test.open}
                </Button>
              </Box>
            </Tooltip>
            <Tooltip content={t.permissions.actionDenied} disabled={canManage}>
              <Box as="span" display="inline-flex">
                <Button
                  color="state.danger"
                  disabled={!canManage || !isConfigured}
                  onClick={() => setIsClearOpen(true)}
                  size="sm"
                  variant="ghost"
                >
                  <RotateCcw size={15} />{t.email.sender.clear}
                </Button>
              </Box>
            </Tooltip>
          </Flex>
        </Flex>
        <Text color="ink.muted" fontSize="sm" lineHeight="1.7" mb="5">{t.email.sender.description}</Text>
        <SenderForm canManage={canManage} sender={sender} />
      </Box>
      <SendTestDialog onClose={() => setIsTestOpen(false)} open={isTestOpen} />
      <ClearSenderDialog
        isPending={clearMutation.isPending}
        onClose={() => setIsClearOpen(false)}
        onConfirm={() => void confirmClear()}
        open={isClearOpen}
      />
    </Stack>
  );
}
