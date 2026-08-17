import { Avatar, Badge, Box, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Mail, ShieldCheck } from "lucide-react";

import type { OperatorDto } from "@/api/team.api";
import { EmptyState } from "@/components/ui/screen-state";
import { t } from "@/i18n/tr";

export function OperatorList({ operators }: { operators: OperatorDto[] }) {
  if (operators.length === 0) {
    return <EmptyState description={t.team.operators.emptyDescription} title={t.team.operators.emptyTitle} />;
  }

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap="3" p="4">
      {operators.map((operator) => (
        <Flex align="center" border="1px solid" borderColor="line.subtle" borderRadius="12px" gap="3" key={operator.id ?? operator.userId} p="4">
          <Avatar.Root colorPalette="accent" size="md"><Avatar.Fallback name={operator.userName ?? operator.email ?? ""} /></Avatar.Root>
          <Stack flex="1" gap="1" minW="0">
            <Flex align="center" gap="2"><Text color="ink.strong" fontSize="sm" fontWeight="700" truncate>{operator.userName}</Text><Badge colorPalette={operator.isActive ? "green" : "gray"} size="xs">{operator.isActive ? t.team.status.active : t.team.status.passive}</Badge></Flex>
            <Flex align="center" color="ink.muted" fontSize="xs" gap="1.5"><Mail size={13} /><Text truncate>{operator.email}</Text></Flex>
          </Stack>
          <Box color="accent.solid"><ShieldCheck size={18} /></Box>
        </Flex>
      ))}
    </SimpleGrid>
  );
}
