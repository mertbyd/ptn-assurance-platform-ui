import { Badge, Box, Flex, Tabs, Text } from "@chakra-ui/react";
import { Braces, FileJson, Info, LogIn, LogOut } from "lucide-react";

import { t } from "@/i18n/tr";
import type { OpenApiExplorerModel, OpenApiOperation } from "../openapi/types";
import { JsonCodeBlock } from "./json-code-block";
import { OperationOverview } from "./operation-overview";
import { RequestDetails } from "./request-details";
import { ResponseDetails } from "./response-details";
import { SchemaDetails } from "./schema-details";

const methodPalette: Record<string, string> = { DELETE: "red", GET: "blue", PATCH: "orange", POST: "green", PUT: "purple" };

export function EndpointDetail({ model, operation }: { model: OpenApiExplorerModel; operation: OpenApiOperation }) {
  return (
    <Box bg="app.surface" borderRadius="panel" data-motion="surface-delayed" minW="0" overflow="hidden">
      <Box bg="app.rail" color="white" p={{ base: "4", md: "5" }}>
        <Flex align="center" gap="3" wrap="wrap"><Badge colorPalette={methodPalette[operation.method] ?? "gray"} size="md">{operation.method}</Badge><Text color="white" flex="1" fontFamily="mono" fontSize={{ base: "sm", md: "md" }} fontWeight="750" minW="0" overflowWrap="anywhere">{operation.path}</Text>{operation.deprecated && <Badge colorPalette="orange">{t.snapshots.explorer.deprecated}</Badge>}</Flex>
        <Text color="white" fontSize="lg" fontWeight="750" mt="3">{operation.summary ?? operation.operationId}</Text>
        <Text color="ink.muted" fontFamily="mono" fontSize="xs" mt="1">{operation.operationId}</Text>
      </Box>
      <Tabs.Root defaultValue="overview" lazyMount unmountOnExit variant="line">
        <Tabs.List bg="app.muted" gap="1" overflowX="auto" p="1">
          <Tabs.Trigger borderRadius="9px" value="overview"><Info size={15} />{t.snapshots.explorer.tabs.overview}</Tabs.Trigger>
          <Tabs.Trigger borderRadius="9px" value="request"><LogIn size={15} />{t.snapshots.explorer.tabs.request}</Tabs.Trigger>
          <Tabs.Trigger borderRadius="9px" value="responses"><LogOut size={15} />{t.snapshots.explorer.tabs.responses}<Badge colorPalette="accent" size="xs">{Object.keys(operation.responses).length}</Badge></Tabs.Trigger>
          <Tabs.Trigger borderRadius="9px" value="schemas"><Braces size={15} />{t.snapshots.explorer.tabs.schemas}</Tabs.Trigger>
          <Tabs.Trigger borderRadius="9px" value="raw"><FileJson size={15} />{t.snapshots.explorer.tabs.raw}</Tabs.Trigger>
        </Tabs.List>
        <Box p={{ base: "4", md: "5" }}>
          <Tabs.Content value="overview"><OperationOverview model={model} operation={operation} /></Tabs.Content>
          <Tabs.Content value="request"><RequestDetails model={model} operation={operation} /></Tabs.Content>
          <Tabs.Content value="responses"><ResponseDetails model={model} operation={operation} /></Tabs.Content>
          <Tabs.Content value="schemas"><SchemaDetails model={model} operation={operation} /></Tabs.Content>
          <Tabs.Content value="raw"><JsonCodeBlock value={operation.raw} /></Tabs.Content>
        </Box>
      </Tabs.Root>
    </Box>
  );
}
