import { Box, Button, Flex, Heading, Skeleton, Stack, Text } from "@chakra-ui/react";
import { CircleAlert, Inbox } from "lucide-react";

import { t } from "@/i18n/tr";
import { Tooltip } from "./tooltip";

export function LoadingState() {
  return (
    <Stack aria-label={t.states.loadingLabel} gap="3" role="status">
      <Skeleton borderRadius="10px" h="16" />
      <Skeleton borderRadius="10px" h="16" opacity="0.78" />
      <Skeleton borderRadius="10px" h="16" opacity="0.55" />
    </Stack>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionDisabledReason?: string;
  onAction?: () => void;
}

export function EmptyState({ actionDisabled = false, actionDisabledReason, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Flex align="center" data-motion="surface" direction="column" minH="260px" justify="center" px="6" py="10" textAlign="center">
      <Flex align="center" bg="accent.soft" borderRadius="12px" color="accent.solid" h="12" justify="center" mb="4" w="12">
        <Inbox aria-hidden size={22} strokeWidth={1.8} />
      </Flex>
      <Heading color="ink.strong" fontSize="md" fontWeight="700">
        {title}
      </Heading>
      <Text color="ink.muted" fontSize="sm" lineHeight="1.65" mt="2" maxW="440px">
        {description}
      </Text>
      {actionLabel && (
        <Tooltip content={actionDisabledReason} disabled={!actionDisabled || !actionDisabledReason}>
          <Box as="span" display="inline-flex" mt="5">
            <Button
              aria-label={actionDisabled && actionDisabledReason ? `${actionLabel}. ${actionDisabledReason}` : actionLabel}
              bg="accent.solid"
              color="ink.onAccent"
              disabled={actionDisabled}
              onClick={onAction}
              size="sm"
              _hover={{ bg: "accent.hover" }}
            >
              {actionLabel}
            </Button>
          </Box>
        </Tooltip>
      )}
    </Flex>
  );
}

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <Box bg="state.dangerSoft" border="1px solid" borderColor="red.200" borderRadius="panel" data-motion="slide" p="6">
      <Flex align="flex-start" gap="3">
        <CircleAlert aria-hidden color="var(--acc-colors-state-danger)" size={20} />
        <Box>
          <Heading color="state.danger" fontSize="sm" fontWeight="700">
            {title}
          </Heading>
          <Text color="ink.body" fontSize="sm" lineHeight="1.6" mt="1">
            {description}
          </Text>
          <Button mt="4" onClick={onRetry} size="sm" variant="outline">
            {t.states.retry}
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
