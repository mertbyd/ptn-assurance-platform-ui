import { Badge, Box, Button, Flex, Text } from "@chakra-ui/react";
import { Pencil, Power } from "lucide-react";

import type { CheckRecipientDto } from "@/api/recipients.api";
import { Tooltip } from "@/components/ui/tooltip";
import { t } from "@/i18n/tr";

// Adres ya da görünen addan tek harflik bir işaret üretir; liste satırını okunur tutar.
function getInitial(recipient: CheckRecipientDto): string {
  const source = recipient.displayName?.trim() || recipient.email?.trim() || "";
  return source.slice(0, 1).toLocaleUpperCase("tr-TR");
}

export function RecipientRow({
  canManage,
  isPassivating,
  onEdit,
  onPassivate,
  recipient,
}: {
  canManage: boolean;
  isPassivating: boolean;
  onEdit: () => void;
  onPassivate: () => void;
  recipient: CheckRecipientDto;
}) {
  const isEditable = canManage && Boolean(recipient.isActive);

  return (
    <Flex
      align="center"
      aria-label={t.recipients.rowLabel(recipient.email ?? "")}
      as="article"
      bg="app.surface"
      border="1px solid"
      borderColor="line.subtle"
      borderRadius="panel"
      gap="4"
      opacity={recipient.isActive ? 1 : 0.72}
      px={{ base: "4", md: "5" }}
      py="4"
    >
      <Flex
        align="center"
        aria-hidden
        bg={recipient.isActive ? "accent.soft" : "app.subtle"}
        borderRadius="control"
        color={recipient.isActive ? "accent.solid" : "ink.faint"}
        flexShrink="0"
        fontSize="sm"
        fontWeight="750"
        h="10"
        justify="center"
        w="10"
      >
        {getInitial(recipient)}
      </Flex>
      <Box flex="1" minW="0">
        <Flex align="center" gap="2" wrap="wrap">
          <Text color="ink.strong" fontSize="sm" fontWeight="700" truncate>{recipient.email}</Text>
          <Badge colorPalette={recipient.isActive ? "green" : "gray"} size="sm">
            {recipient.isActive ? t.recipients.status.active : t.recipients.status.passive}
          </Badge>
        </Flex>
        {recipient.displayName && (
          <Text color="ink.muted" fontSize="xs" mt="0.5" truncate>{recipient.displayName}</Text>
        )}
      </Box>
      <Flex flexShrink="0" gap="1">
        <Tooltip content={t.permissions.actionDenied} disabled={isEditable}>
          <Box as="span" display="inline-flex">
            <Button aria-label={t.recipients.actions.edit} disabled={!isEditable} onClick={onEdit} size="sm" variant="ghost">
              <Pencil size={16} />
            </Button>
          </Box>
        </Tooltip>
        <Tooltip content={t.permissions.actionDenied} disabled={isEditable}>
          <Box as="span" display="inline-flex">
            <Button
              aria-label={t.recipients.actions.passivate}
              color="state.danger"
              disabled={!isEditable}
              loading={isPassivating}
              onClick={onPassivate}
              size="sm"
              variant="ghost"
            >
              <Power size={16} />
            </Button>
          </Box>
        </Tooltip>
      </Flex>
    </Flex>
  );
}
