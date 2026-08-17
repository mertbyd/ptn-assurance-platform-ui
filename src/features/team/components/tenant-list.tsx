import { Badge, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { Building2, Pencil, Trash2 } from "lucide-react";

import type { TenantDto } from "@/api/team.api";
import { EmptyState } from "@/components/ui/screen-state";
import { t } from "@/i18n/tr";

export function TenantList({ onCreate, onDelete, onEdit, onSelect, selectedId, tenants }: {
  onCreate: () => void;
  onDelete: (tenant: TenantDto) => void;
  onEdit: (tenant: TenantDto) => void;
  onSelect: (tenant: TenantDto) => void;
  selectedId?: string;
  tenants: TenantDto[];
}) {
  if (tenants.length === 0) {
    return <EmptyState actionLabel={t.team.actions.createTenant} description={t.team.tenants.emptyDescription} onAction={onCreate} title={t.team.tenants.emptyTitle} />;
  }

  return (
    <Stack gap="2" p="3">
      {tenants.map((tenant) => {
        const selected = tenant.id === selectedId;
        return (
          <Box bg={selected ? "accent.soft" : "transparent"} border="1px solid" borderColor={selected ? "accent.border" : "transparent"} borderRadius="12px" key={tenant.id} p="3" transition="all 160ms ease-out">
            <Flex align="center" gap="3">
              <Button aria-label={t.team.tenants.select(tenant.name ?? "")} flex="1" h="auto" justifyContent="flex-start" onClick={() => onSelect(tenant)} p="0" variant="ghost">
                <Flex align="center" bg={selected ? "accent.solid" : "app.subtle"} borderRadius="10px" color={selected ? "ink.onAccent" : "accent.solid"} h="9" justify="center" w="9"><Building2 size={17} /></Flex>
                <Box minW="0" textAlign="left"><Text color="ink.strong" fontSize="sm" fontWeight="700" truncate>{tenant.name}</Text><Badge colorPalette="accent" mt="1" size="xs">{t.team.tenants.workspace}</Badge></Box>
              </Button>
              <Button aria-label={t.team.actions.renameTenant} onClick={() => onEdit(tenant)} size="xs" variant="ghost"><Pencil size={14} /></Button>
              <Button aria-label={t.team.actions.deleteTenant} color="state.danger" onClick={() => onDelete(tenant)} size="xs" variant="ghost"><Trash2 size={14} /></Button>
            </Flex>
          </Box>
        );
      })}
    </Stack>
  );
}
