"use client";

import { Accordion, Badge, Box, Flex, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Braces, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { t } from "@/i18n/tr";
import { isOpenApiObject, readArray, readString } from "../openapi/parser";
import type { OpenApiExplorerModel } from "../openapi/types";
import { JsonCodeBlock } from "./json-code-block";

export function SchemaCatalog({ model }: { model: OpenApiExplorerModel }) {
  const [search, setSearch] = useState("");
  const schemas = useMemo(() => isOpenApiObject(model.document.components) && isOpenApiObject(model.document.components.schemas)
    ? model.document.components.schemas
    : {}, [model.document]);
  const entries = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr-TR");
    return Object.entries(schemas).filter(([name, schema]) => !needle || `${name} ${JSON.stringify(schema)}`.toLocaleLowerCase("tr-TR").includes(needle));
  }, [schemas, search]);
  return (
    <Stack gap="4">
      <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap="3" justify="space-between">
        <Box><Text color="ink.strong" fontSize="lg" fontWeight="750">{t.snapshots.explorer.schemaCatalogTitle}</Text><Text color="ink.muted" fontSize="sm" mt="1">{t.snapshots.explorer.schemaCatalogDescription}</Text></Box>
        <Badge colorPalette="accent" size="lg">{t.snapshots.explorer.schemaCount(Object.keys(schemas).length)}</Badge>
      </Flex>
      <Box position="relative"><Box color="ink.faint" left="3" position="absolute" top="2.5" zIndex="1"><Search size={16} /></Box><Input aria-label={t.snapshots.explorer.schemaSearchLabel} onChange={(event) => setSearch(event.target.value)} pl="9" placeholder={t.snapshots.explorer.schemaSearchPlaceholder} value={search} /></Box>
      {entries.length ? <Accordion.Root collapsible multiple variant="enclosed">
        {entries.map(([name, value]) => {
          const schema = isOpenApiObject(value) ? value : {};
          const properties = isOpenApiObject(schema.properties) ? schema.properties : {};
          const required = readArray(schema.required).filter((item): item is string => typeof item === "string");
          return <Accordion.Item key={name} value={name}><Accordion.ItemTrigger px="4" py="3"><Braces color="var(--acc-colors-accent-solid)" size={16} /><Box flex="1" textAlign="left"><Text color="ink.strong" fontFamily="mono" fontSize="sm" fontWeight="750">{name}</Text><Text color="ink.muted" fontSize="11px" mt="0.5">{readString(schema.description) ?? t.snapshots.explorer.schemaSummary(Object.keys(properties).length, required.length)}</Text></Box><Badge>{readString(schema.type) ?? "object"}</Badge><Accordion.ItemIndicator /></Accordion.ItemTrigger><Accordion.ItemContent><Accordion.ItemBody px="4" pb="4"><SimpleGrid columns={{ base: 2, md: 3 }} gap="2" mb="3"><Box bg="app.subtle" borderRadius="8px" p="3"><Text color="ink.muted" fontSize="10px">{t.snapshots.explorer.propertyCount}</Text><Text fontWeight="800" mt="1">{Object.keys(properties).length}</Text></Box><Box bg="app.subtle" borderRadius="8px" p="3"><Text color="ink.muted" fontSize="10px">{t.snapshots.explorer.requiredCount}</Text><Text fontWeight="800" mt="1">{required.length}</Text></Box><Box bg="app.subtle" borderRadius="8px" p="3"><Text color="ink.muted" fontSize="10px">{t.snapshots.explorer.additionalProperties}</Text><Text fontWeight="800" mt="1">{schema.additionalProperties === false ? t.common.no : t.common.yes}</Text></Box></SimpleGrid><JsonCodeBlock value={schema} /></Accordion.ItemBody></Accordion.ItemContent></Accordion.Item>;
        })}
      </Accordion.Root> : <Box border="1px dashed" borderColor="line.subtle" borderRadius="12px" color="ink.muted" p="8" textAlign="center">{t.snapshots.explorer.noSchemaSearchResult}</Box>}
    </Stack>
  );
}
