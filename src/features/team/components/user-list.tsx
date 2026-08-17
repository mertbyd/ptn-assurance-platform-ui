import { Avatar, Badge, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { KeyRound, Pencil, Trash2, UserRoundPlus } from "lucide-react";

import type { IdentityUserDto } from "@/api/team.api";
import { EmptyState } from "@/components/ui/screen-state";
import { t } from "@/i18n/tr";

export function UserList({ onDelete, onEdit, onInvite, onPermissions, users }: {
  onDelete: (user: IdentityUserDto) => void;
  onEdit: (user: IdentityUserDto) => void;
  onInvite: () => void;
  onPermissions: (user: IdentityUserDto) => void;
  users: IdentityUserDto[];
}) {
  if (users.length === 0) {
    return <EmptyState actionLabel={t.team.actions.invite} description={t.team.users.emptyDescription} onAction={onInvite} title={t.team.users.emptyTitle} />;
  }

  return (
    <Stack gap="0" px="4" pb="4">
      {users.map((user) => (
        <Flex align={{ base: "flex-start", md: "center" }} borderTop="1px solid" borderColor="line.subtle" direction={{ base: "column", md: "row" }} gap="3" justify="space-between" key={user.id} py="4">
          <Flex align="center" gap="3" minW="0">
            <Avatar.Root colorPalette="accent" size="sm"><Avatar.Fallback name={[user.name, user.surname].filter(Boolean).join(" ") || user.userName || ""} /></Avatar.Root>
            <Box minW="0"><Flex align="center" gap="2"><Text color="ink.strong" fontSize="sm" fontWeight="700" truncate>{user.userName}</Text><Badge colorPalette={user.isActive ? "green" : "gray"} size="xs">{user.isActive ? t.team.status.active : t.team.status.passive}</Badge></Flex><Text color="ink.muted" fontSize="xs" mt="1" truncate>{user.email}</Text></Box>
          </Flex>
          <Flex gap="1">
            <Button onClick={() => onPermissions(user)} size="sm" variant="outline"><KeyRound size={15} />{t.team.actions.permissions}</Button>
            <Button aria-label={t.team.actions.editUser} onClick={() => onEdit(user)} size="sm" variant="ghost"><Pencil size={15} /></Button>
            <Button aria-label={t.team.actions.deleteUser} color="state.danger" onClick={() => onDelete(user)} size="sm" variant="ghost"><Trash2 size={15} /></Button>
          </Flex>
        </Flex>
      ))}
      <Button alignSelf="flex-start" mt="3" onClick={onInvite} size="sm" variant="outline"><UserRoundPlus size={15} />{t.team.actions.invite}</Button>
    </Stack>
  );
}
