import { Badge, Box, Button, Flex, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Check, FileJson2, Server } from "lucide-react";

import type { SpecSourcePage } from "@/api/sources.api";
import { t } from "@/i18n/tr";

export function ContractDocumentPicker({ documentError, documentId, onDocumentChange, onSourceChange, sourceError, sourceId, sources }: {
  documentError?: string;
  documentId: string;
  onDocumentChange: (id: string) => void;
  onSourceChange: (id: string) => void;
  sourceError?: string;
  sourceId: string;
  sources?: SpecSourcePage;
}) {
  const source = sources?.items?.find((item) => item.id === sourceId);
  return (
    <Stack gap="4">
      <Box>
        <Flex align="center" gap="2" mb="2"><Server size={15} /><Text color="ink.strong" fontSize="xs" fontWeight="800" letterSpacing="wide" textTransform="uppercase">{t.checks.selection.sourceTitle}</Text></Flex>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="2">
          {(sources?.items ?? []).filter((item) => item.id && item.isActive).map((item) => {
            const selected = item.id === sourceId;
            return <Button aria-pressed={selected} bg={selected ? "app.rail" : "app.surface"} border="0" borderLeft="3px solid" borderLeftColor={selected ? "accent.solid" : "transparent"} borderRadius="control" color={selected ? "white" : "ink.body"} h="auto" justifyContent="flex-start" key={item.id} onClick={() => onSourceChange(item.id ?? "")} p="3" textAlign="left" variant="ghost" _hover={{ bg: selected ? "app.rail" : "app.hover" }}><Box bg={selected ? "whiteAlpha.100" : "app.muted"} borderRadius="9px" color={selected ? "ink.muted" : "ink.muted"} p="2"><Server size={16} /></Box><Box flex="1" minW="0"><Text color={selected ? "white" : "ink.strong"} fontSize="sm" fontWeight="750" truncate>{item.name ?? t.common.notAvailable}</Text><Text color={selected ? "ink.muted" : "ink.muted"} fontSize="10px" mt="0.5">{t.checks.selection.documentCount(item.documents?.filter((document) => document.isActive).length ?? 0)}</Text></Box>{selected && <Check color="var(--acc)" size={16} />}</Button>;
          })}
        </SimpleGrid>
        {sourceError && <Text color="state.danger" fontSize="xs" mt="2">{sourceError}</Text>}
      </Box>
      <Box opacity={source ? 1 : 0.55}>
        <Flex align="center" gap="2" mb="2"><FileJson2 size={15} /><Text color="ink.strong" fontSize="xs" fontWeight="800" letterSpacing="wide" textTransform="uppercase">{t.checks.selection.documentTitle}</Text></Flex>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="2">
          {(source?.documents ?? []).filter((item) => item.id && item.isActive).map((item) => {
            const selected = item.id === documentId;
            return <Button aria-pressed={selected} bg={selected ? "accent.soft" : "app.surface"} border="0" borderLeft="3px solid" borderLeftColor={selected ? "accent.solid" : "transparent"} borderRadius="control" color="ink.body" disabled={!source} h="auto" justifyContent="flex-start" key={item.id} onClick={() => onDocumentChange(item.id ?? "")} p="3" textAlign="left" variant="ghost" _hover={{ bg: selected ? "accent.soft" : "app.hover" }}><FileJson2 color="var(--acc-colors-accent-solid)" size={17} /><Box flex="1" minW="0"><Text color="ink.strong" fontSize="sm" fontWeight="750" truncate>{item.documentName ?? t.common.notAvailable}</Text><Text color="ink.muted" fontFamily="mono" fontSize="10px" mt="0.5" truncate>{item.path ?? t.common.notAvailable}</Text></Box>{selected && <Badge colorPalette="accent" size="xs">{t.checks.selection.selected}</Badge>}</Button>;
          })}
        </SimpleGrid>
        {!source && <Text color="ink.muted" fontSize="xs" mt="2">{t.checks.selection.chooseSourceFirst}</Text>}
        {documentError && <Text color="state.danger" fontSize="xs" mt="2">{documentError}</Text>}
      </Box>
    </Stack>
  );
}
