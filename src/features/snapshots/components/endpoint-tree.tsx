import { Accordion, Badge, Box, Button, Input, Stack, Text } from "@chakra-ui/react";
import { Search } from "lucide-react";

import { t } from "@/i18n/tr";
import type { OpenApiOperation, OpenApiTagGroup } from "../openapi/types";

const methodPalette: Record<string, string> = {
  DELETE: "red",
  GET: "blue",
  PATCH: "orange",
  POST: "green",
  PUT: "purple",
};

export function EndpointTree({
  groups,
  onSearch,
  onSelect,
  search,
  selectedKey,
}: {
  groups: OpenApiTagGroup[];
  onSearch: (value: string) => void;
  onSelect: (operation: OpenApiOperation) => void;
  search: string;
  selectedKey?: string;
}) {
  return (
    <Stack gap="3">
      <Box position="relative">
        <Box color="ink.faint" left="3" position="absolute" top="2.5" zIndex="1"><Search size={16} /></Box>
        <Input aria-label={t.snapshots.explorer.searchLabel} bg="app.muted" border="0" borderRadius="full" onChange={(event) => onSearch(event.target.value)} pl="9" placeholder={t.snapshots.explorer.searchPlaceholder} value={search} />
      </Box>
      {groups.length === 0 ? <Text color="ink.muted" fontSize="sm" p="4">{t.snapshots.explorer.noSearchResult}</Text> : (
        <Accordion.Root collapsible defaultValue={groups.slice(0, 2).map((group) => group.name)} multiple size="sm" variant="plain">
          {groups.map((group) => (
            <Accordion.Item borderBottom="1px solid" borderColor="line.subtle" key={group.name} value={group.name}>
              <Accordion.ItemTrigger px="2" py="3">
                <Box flex="1" minW="0" textAlign="left">
                  <Text color="ink.strong" fontSize="sm" fontWeight="700" truncate>{group.name}</Text>
                  {group.description && <Text color="ink.muted" fontSize="11px" mt="0.5" truncate>{group.description}</Text>}
                </Box>
                <Badge colorPalette="accent" variant="subtle">{group.operations.length}</Badge>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody pb="3">
                  <Stack gap="1">
                    {group.operations.map((operation) => (
                      <Button
                        bg={selectedKey === operation.key ? "app.selected" : "transparent"}
                        color={selectedKey === operation.key ? "accent.solid" : "ink.body"}
                        h="auto"
                        justifyContent="flex-start"
                        key={operation.key}
                        onClick={() => onSelect(operation)}
                        px="2"
                        py="2"
                        variant="ghost"
                        w="full"
                      >
                        <Badge colorPalette={methodPalette[operation.method] ?? "gray"} flex="0 0 auto" fontSize="9px" minW="46px" size="xs">{operation.method}</Badge>
                        <Box minW="0" textAlign="left"><Text fontSize="xs" fontWeight="600" truncate>{operation.path}</Text><Text color="ink.muted" fontSize="10px" mt="0.5" truncate>{operation.summary ?? operation.operationId}</Text></Box>
                      </Button>
                    ))}
                  </Stack>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      )}
    </Stack>
  );
}
