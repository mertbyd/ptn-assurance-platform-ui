import { Badge, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { Pencil, Power, Tag } from "lucide-react";

import type { LookupDto } from "@/api/lookups.api";
import { EmptyState } from "@/components/ui/screen-state";
import { t } from "@/i18n/tr";

export function LookupList({ canManage, items, onCreate, onEdit, onPassivate }: {
  canManage: boolean;
  items: LookupDto[];
  onCreate: () => void;
  onEdit: (item: LookupDto) => void;
  onPassivate: (item: LookupDto) => void;
}) {
  if (items.length === 0) {
    return <EmptyState actionDisabled={!canManage} actionDisabledReason={t.permissions.actionDenied} actionLabel={t.lookups.actions.create} description={t.lookups.empty.description} onAction={onCreate} title={t.lookups.empty.title} />;
  }
  return (
    <Stack gap="0" px="4" pb="4">
      {items.map((item) => (
        <Flex align={{ base: "flex-start", md: "center" }} borderTop="1px solid" borderColor="line.subtle" direction={{ base: "column", md: "row" }} gap="3" justify="space-between" key={item.id ?? item.code} py="4">
          <Flex align="flex-start" gap="3" minW="0">
            <Flex align="center" bg="accent.soft" borderRadius="10px" color="accent.solid" h="9" justify="center" w="9"><Tag size={16} /></Flex>
            <Box minW="0"><Flex align="center" gap="2" wrap="wrap"><Text color="ink.strong" fontSize="sm" fontWeight="700">{item.name}</Text><Badge colorPalette={item.isActive ? "green" : "gray"} size="xs">{item.isActive ? t.lookups.status.active : t.lookups.status.passive}</Badge><Badge colorPalette="accent" size="xs" variant="subtle">{item.code}</Badge></Flex><Text color="ink.muted" fontSize="xs" lineHeight="1.55" mt="1">{item.description || t.lookups.noDescription}</Text></Box>
          </Flex>
          <Flex gap="1"><Button aria-label={t.lookups.actions.edit} disabled={!canManage} onClick={() => onEdit(item)} size="sm" variant="ghost"><Pencil size={15} /></Button><Button aria-label={t.lookups.actions.passivate} color="state.danger" disabled={!canManage || !item.isActive} onClick={() => onPassivate(item)} size="sm" variant="ghost"><Power size={15} /></Button></Flex>
        </Flex>
      ))}
    </Stack>
  );
}
