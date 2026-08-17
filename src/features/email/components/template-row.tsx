import { Badge, Box, Button, Flex, Text } from "@chakra-ui/react";
import { CopyPlus, Pencil, Trash2 } from "lucide-react";

import type { EmailTemplateDto } from "@/api/email.api";
import { Tooltip } from "@/components/ui/tooltip";
import { t } from "@/i18n/tr";

export function TemplateRow({
  canManage,
  isRemoving,
  onEdit,
  onFork,
  onRemove,
  template,
}: {
  canManage: boolean;
  isRemoving: boolean;
  onEdit: () => void;
  onFork: () => void;
  onRemove: () => void;
  template: EmailTemplateDto;
}) {
  const isInherited = Boolean(template.isInherited);
  const canWrite = canManage && !isInherited;
  const deniedReason = isInherited ? t.email.templates.inheritedHint : t.permissions.actionDenied;

  return (
    <Box
      aria-label={t.email.templates.rowLabel(template.name ?? "")}
      as="article"
      bg="app.surface"
      border="1px solid"
      borderColor="line.subtle"
      borderRadius="panel"
      p={{ base: "4", md: "5" }}
    >
      <Flex align="flex-start" gap="4" justify="space-between">
        <Box flex="1" minW="0">
          <Flex align="center" gap="2" wrap="wrap">
            <Text color="ink.strong" fontSize="sm" fontWeight="750">{template.name}</Text>
            <Badge colorPalette={isInherited ? "gray" : "blue"} size="sm">
              {isInherited ? t.email.templates.badges.inherited : t.email.templates.badges.owned}
            </Badge>
            {template.culture && <Badge colorPalette="gray" size="xs" variant="subtle">{template.culture}</Badge>}
            {template.isLayout && <Badge colorPalette="purple" size="xs" variant="subtle">{t.email.templates.badges.layout}</Badge>}
          </Flex>
          <Text color="ink.body" fontSize="sm" mt="2" truncate>{template.subject}</Text>
          {template.description && <Text color="ink.muted" fontSize="xs" mt="1" truncate>{template.description}</Text>}
        </Box>
        <Flex flexShrink="0" gap="1">
          {isInherited ? (
            <Tooltip content={t.permissions.actionDenied} disabled={canManage}>
              <Box as="span" display="inline-flex">
                <Button aria-label={t.email.templates.actions.fork} disabled={!canManage} onClick={onFork} size="sm" variant="ghost">
                  <CopyPlus size={16} />
                </Button>
              </Box>
            </Tooltip>
          ) : (
            <Tooltip content={deniedReason} disabled={canWrite}>
              <Box as="span" display="inline-flex">
                <Button aria-label={t.email.templates.actions.edit} disabled={!canWrite} onClick={onEdit} size="sm" variant="ghost">
                  <Pencil size={16} />
                </Button>
              </Box>
            </Tooltip>
          )}
          <Tooltip content={deniedReason} disabled={canWrite}>
            <Box as="span" display="inline-flex">
              <Button
                aria-label={t.email.templates.actions.remove}
                color="state.danger"
                disabled={!canWrite}
                loading={isRemoving}
                onClick={onRemove}
                size="sm"
                variant="ghost"
              >
                <Trash2 size={16} />
              </Button>
            </Box>
          </Tooltip>
        </Flex>
      </Flex>
      {isInherited && (
        <Text bg="app.subtle" borderRadius="control" color="ink.muted" fontSize="xs" lineHeight="1.6" mt="4" p="3">
          {t.email.templates.inheritedHint}
        </Text>
      )}
    </Box>
  );
}
