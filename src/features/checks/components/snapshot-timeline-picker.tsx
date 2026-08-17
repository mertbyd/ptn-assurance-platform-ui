import { Badge, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { Check, Clock3, GitCommitHorizontal } from "lucide-react";

import type { SnapshotPage } from "@/api/sources.api";
import { t } from "@/i18n/tr";
import { formatDateTime } from "@/lib/formatters";

export function SnapshotTimelinePicker({ disabled, error, onChange, selectedId, snapshots }: {
  disabled?: boolean;
  error?: string;
  onChange: (id: string) => void;
  selectedId: string;
  snapshots?: SnapshotPage;
}) {
  const items = snapshots?.items ?? [];
  return (
    <Box>
      <Flex align="center" gap="2" mb="2"><Clock3 size={15} /><Text color="ink.strong" fontSize="xs" fontWeight="800" letterSpacing="wide" textTransform="uppercase">{t.checks.selection.timelineTitle}</Text><Badge colorPalette="accent" ml="auto" size="xs">{t.checks.selection.snapshotCount(items.length)}</Badge></Flex>
      <Stack borderLeft="2px solid" borderColor="accent.border" gap="2" maxH="310px" ml="2" overflowY="auto" pl="4" pr="1" py="1">
        {items.map((item, index) => {
          const selected = item.id === selectedId;
          return <Button aria-pressed={selected} bg={selected ? "accent.soft" : "app.surface"} border="1px solid" borderColor={selected ? "accent.solid" : "line.subtle"} disabled={disabled} h="auto" justifyContent="flex-start" key={item.id} onClick={() => onChange(item.id ?? "")} p="3" position="relative" textAlign="left" variant="ghost" _before={{ bg: selected ? "accent.hover" : "app.surface", border: "2px solid", borderColor: selected ? "accent.hover" : "accent.solid", borderRadius: "full", content: '""', h: "10px", left: "-22px", position: "absolute", top: "19px", w: "10px" }}><GitCommitHorizontal color="var(--acc-colors-accent-solid)" size={16} /><Box flex="1" minW="0"><Flex align="center" gap="2"><Text color="ink.strong" fontSize="sm" fontWeight="750">{formatDateTime(item.creationTime)}</Text>{index === 0 && <Badge colorPalette="green" size="xs">{t.checks.selection.latest}</Badge>}</Flex><Text color="ink.muted" fontSize="10px" mt="1">{item.apiVersion ?? item.formatCode ?? t.common.notAvailable} · {item.shortCanonicalHash ?? t.common.notAvailable}</Text></Box>{selected && <Check color="var(--acc-colors-accent-solid)" size={16} />}</Button>;
        })}
        {!items.length && <Box bg="app.subtle" borderRadius="10px" color="ink.muted" fontSize="xs" p="4">{disabled ? t.checks.selection.chooseDocumentFirst : t.checks.selection.noSnapshots}</Box>}
      </Stack>
      {error && <Text color="state.danger" fontSize="xs" mt="2">{error}</Text>}
    </Box>
  );
}
