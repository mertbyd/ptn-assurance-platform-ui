"use client";

import { Badge, Box, Button, Checkbox, Flex, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { Braces, Fingerprint, Minus, Plus, Route, Search, Tags, X } from "lucide-react";
import { useMemo, useState } from "react";

import { t } from "@/i18n/tr";
import type { OpenApiExplorerModel } from "@/features/snapshots/openapi/types";
import type { ComparisonFormValues } from "../comparison-schema";

type Rule = ComparisonFormValues["scopeRules"][number];
type Target = Rule["targetCode"];

const targets: Array<{ code: Target; icon: typeof Tags }> = [
  { code: "tag", icon: Tags },
  { code: "path", icon: Route },
  { code: "operation-id", icon: Fingerprint },
  { code: "schema", icon: Braces },
];

function catalog(model: OpenApiExplorerModel, target: Target) {
  if (target === "tag") return model.tags.map((tag) => ({ description: t.checks.scopePicker.endpointCount(tag.operations.length), value: tag.name }));
  if (target === "path") return [...new Set(model.operations.map((operation) => operation.path))].map((path) => ({ description: [...new Set(model.operations.filter((operation) => operation.path === path).map((operation) => operation.method))].join(" · "), value: path }));
  if (target === "operation-id") return model.operations.map((operation) => ({ description: `${operation.method} ${operation.path}`, value: operation.operationId }));
  const components = model.document.components;
  const schemas = components && typeof components === "object" && !Array.isArray(components) && "schemas" in components ? components.schemas : undefined;
  const names = schemas && typeof schemas === "object" && !Array.isArray(schemas) ? Object.keys(schemas) : [];
  return names.map((value) => ({ description: t.checks.scopePicker.componentSchema, value }));
}

export function ScopeItemPicker({ model, onChange, rules }: { model: OpenApiExplorerModel; onChange: (rules: Rule[]) => void; rules: Rule[] }) {
  const [kind, setKind] = useState<Rule["kindCode"]>("include");
  const [target, setTarget] = useState<Target>("tag");
  const [query, setQuery] = useState("");
  const [pattern, setPattern] = useState("");
  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr-TR");
    return catalog(model, target).filter((item) => !needle || `${item.value} ${item.description}`.toLocaleLowerCase("tr-TR").includes(needle));
  }, [model, query, target]);
  const selected = new Set(rules.filter((rule) => rule.targetCode === target).map((rule) => rule.pattern));
  const setRule = (value: string, checked: boolean) => {
    const without = rules.filter((rule) => !(rule.targetCode === target && rule.pattern === value));
    onChange(checked ? [...without, { kindCode: kind, pattern: value, targetCode: target }].slice(0, 100) : without);
  };
  const selectVisible = () => {
    const other = rules.filter((rule) => rule.targetCode !== target || !items.some((item) => item.value === rule.pattern));
    onChange([...other, ...items.map((item) => ({ kindCode: kind, pattern: item.value, targetCode: target }))].slice(0, 100));
  };
  const addPattern = () => {
    const value = pattern.trim();
    if (!value) return;
    setRule(value, true);
    setPattern("");
  };
  return (
    <Stack gap="4">
      <SimpleGrid bg="app.muted" borderRadius="14px" columns={{ base: 2, lg: 4 }} gap="1" p="1">
        {targets.map(({ code, icon: Icon }) => <Button bg={target === code ? "app.rail" : "transparent"} border="0" color={target === code ? "white" : "ink.body"} h="auto" justifyContent="flex-start" key={code} onClick={() => { setTarget(code); setQuery(""); }} p="3" variant="ghost" _hover={{ bg: target === code ? "app.rail" : "app.hover" }}><Icon size={16} /><Box textAlign="left"><Text fontSize="xs" fontWeight="750">{t.checks.scopeTargets[code]}</Text><Text color={target === code ? "ink.muted" : "ink.muted"} fontSize="10px" mt="0.5">{t.checks.scopePicker.selectedCount(rules.filter((rule) => rule.targetCode === code).length)}</Text></Box></Button>)}
      </SimpleGrid>
      <SimpleGrid bg="app.muted" borderRadius="control" columns={2} gap="1" p="1">
        <Button aria-pressed={kind === "include"} bg={kind === "include" ? "app.surface" : "transparent"} border="0" color={kind === "include" ? "ink.strong" : "ink.body"} onClick={() => setKind("include")} size="sm" variant="ghost"><Plus size={15} />{t.checks.scopeKinds.include}</Button>
        <Button aria-pressed={kind === "exclude"} bg={kind === "exclude" ? "orange.50" : "transparent"} border="0" color={kind === "exclude" ? "orange.800" : "ink.body"} onClick={() => setKind("exclude")} size="sm" variant="ghost"><Minus size={15} />{t.checks.scopeKinds.exclude}</Button>
      </SimpleGrid>
      <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap="2">
        <Box flex="1" position="relative"><Box color="ink.faint" left="3" position="absolute" top="2.5" zIndex="1"><Search size={16} /></Box><Input aria-label={t.checks.scopePicker.searchLabel} bg="app.muted" border="0" borderRadius="full" onChange={(event) => setQuery(event.target.value)} pl="9" placeholder={t.checks.scopePicker.searchPlaceholder} size="sm" value={query} /></Box>
        <Button onClick={selectVisible} size="sm" variant="outline">{t.checks.scopePicker.selectVisible}</Button><Button onClick={() => onChange(rules.filter((rule) => rule.targetCode !== target))} size="sm" variant="ghost">{t.checks.scopePicker.clearCategory}</Button>
      </Flex>
      <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="14px" maxH="430px" overflowY="auto">
        <Stack gap="0">{items.map((item) => <Checkbox.Root borderBottom="1px solid" borderColor="line.subtle" checked={selected.has(item.value)} cursor="pointer" key={item.value} onCheckedChange={({ checked }) => setRule(item.value, checked === true)} px="4" py="3"><Checkbox.HiddenInput /><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control><Checkbox.Label flex="1" minW="0"><Flex align="center" gap="3" justify="space-between"><Box minW="0"><Text color="ink.strong" fontFamily={target === "path" || target === "operation-id" ? "mono" : "inherit"} fontSize="sm" fontWeight="700" truncate>{item.value}</Text><Text color="ink.muted" fontSize="11px" mt="0.5" truncate>{item.description}</Text></Box>{selected.has(item.value) && <Badge colorPalette={rules.find((rule) => rule.targetCode === target && rule.pattern === item.value)?.kindCode === "exclude" ? "orange" : "blue"}>{t.checks.scopeKinds[rules.find((rule) => rule.targetCode === target && rule.pattern === item.value)?.kindCode ?? "include"]}</Badge>}</Flex></Checkbox.Label></Checkbox.Root>)}</Stack>
        {!items.length && <Text color="ink.muted" fontSize="sm" p="8" textAlign="center">{t.checks.scopePicker.noResult}</Text>}
      </Box>
      <Box bg="app.muted" borderRadius="12px" p="4"><Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.scopePicker.advancedTitle}</Text><Text color="ink.muted" fontSize="xs" mt="1">{t.checks.scopePicker.advancedDescription}</Text><Flex gap="2" mt="3"><Input bg="app.surface" border="0" borderRadius="control" onChange={(event) => setPattern(event.target.value)} placeholder={t.checks.form.scopePatternPlaceholder} size="sm" value={pattern} /><Button onClick={addPattern} size="sm" variant="outline"><Plus size={14} />{t.checks.scopePicker.addPattern}</Button></Flex></Box>
      {rules.length > 0 && <Box><Flex align="center" justify="space-between" mb="2"><Text color="ink.strong" fontSize="sm" fontWeight="750">{t.checks.scopePicker.summaryTitle}</Text><Badge colorPalette="accent">{t.checks.scopePicker.ruleCount(rules.length)}</Badge></Flex><Flex gap="2" wrap="wrap">{rules.map((rule, index) => <Button h="auto" key={`${rule.kindCode}-${rule.targetCode}-${rule.pattern}-${index}`} onClick={() => onChange(rules.filter((_, itemIndex) => itemIndex !== index))} px="2.5" py="1.5" size="xs" variant="outline"><Badge colorPalette={rule.kindCode === "exclude" ? "orange" : "blue"} size="xs">{t.checks.scopeKinds[rule.kindCode]}</Badge><Text fontFamily="mono" fontSize="10px" maxW="240px" truncate>{t.checks.scopeTargets[rule.targetCode]}: {rule.pattern}</Text><X size={12} /></Button>)}</Flex></Box>}
    </Stack>
  );
}
