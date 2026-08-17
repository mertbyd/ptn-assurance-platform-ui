"use client";

import { Badge, Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { ArrowLeft, Braces, Network, Tags } from "lucide-react";
import { useState } from "react";
import "@xyflow/react/dist/style.css";

import { t } from "@/i18n/tr";
import type { OpenApiExplorerModel, OpenApiOperation } from "../openapi/types";

type ApiMapData = {
  kind: "api" | "tag" | "operation";
  label: string;
  method?: string;
  operationKey?: string;
  subtitle: string;
  tagName?: string;
};

type ApiMapNode = Node<ApiMapData, "apiMap">;

const methodPalette: Record<string, string> = { DELETE: "red", GET: "blue", PATCH: "orange", POST: "green", PUT: "purple" };

function ApiMapNodeView({ data }: NodeProps<ApiMapNode>) {
  const isApi = data.kind === "api";
  const isTag = data.kind === "tag";
  return (
    <Box
      bg={isApi ? "app.rail" : "app.surface"}
      border="1px solid"
      borderColor={isApi ? "accent.border" : isTag ? "accent.solid" : "line.subtle"}
      borderRadius="12px"
      color={isApi ? "white" : "ink.strong"}
      cursor={data.operationKey ? "pointer" : "default"}
      minW={isApi ? "210px" : isTag ? "190px" : "300px"}
      p="3"
    >
      {!isApi && <Handle isConnectable={false} position={Position.Left} type="target" />}
      <Flex align="center" gap="2">
        {isApi ? <Network size={16} /> : isTag ? <Tags color="var(--acc-colors-accent-solid)" size={15} /> : <Braces color="var(--acc-colors-ink-faint)" size={14} />}
        {data.method && <Badge colorPalette={methodPalette[data.method] ?? "gray"} size="xs">{data.method}</Badge>}
        <Text fontFamily={data.kind === "operation" ? "mono" : "inherit"} fontSize="xs" fontWeight="750" lineClamp="1">{data.label}</Text>
      </Flex>
      <Text color={isApi ? "ink.muted" : "ink.muted"} fontSize="10px" lineClamp="1" mt="1.5">{data.subtitle}</Text>
      {data.kind !== "operation" && <Handle isConnectable={false} position={Position.Right} type="source" />}
    </Box>
  );
}

const nodeTypes = { apiMap: ApiMapNodeView };

function buildTopology(model: OpenApiExplorerModel, activeTagName?: string): { edges: Edge[]; nodes: ApiMapNode[] } {
  const nodes: ApiMapNode[] = [];
  const edges: Edge[] = [];
  const activeTag = model.tags.find((tag) => tag.name === activeTagName);
  const visibleTags = activeTag ? [activeTag] : model.tags;
  const tagCenters: number[] = [];
  let operationRow = 0;
  for (const [tagIndex, tag] of visibleTags.entries()) {
    if (!tag.operations.length) continue;
    const operationYs: number[] = [];
    for (const operation of activeTag ? tag.operations : []) {
      const y = operationRow * 82;
      operationRow += 1;
      operationYs.push(y);
      const operationId = `operation:${tagIndex}:${operation.key}`;
      nodes.push({
        data: { kind: "operation", label: operation.path, method: operation.method, operationKey: operation.key, subtitle: operation.summary ?? operation.operationId },
        draggable: false,
        id: operationId,
        position: { x: 690, y },
        type: "apiMap",
      });
      edges.push({ id: `tag-${tagIndex}-${operationId}`, markerEnd: { type: MarkerType.ArrowClosed }, source: `tag:${tagIndex}`, target: operationId, type: "smoothstep" });
    }
    const y = activeTag ? operationYs.reduce((sum, value) => sum + value, 0) / operationYs.length : Math.floor(tagIndex / 4) * 96;
    const x = activeTag ? 360 : 320 + (tagIndex % 4) * 230;
    tagCenters.push(y);
    nodes.push({ data: { kind: "tag", label: tag.name, subtitle: t.snapshots.explorer.topologyEndpointCount(tag.operations.length), tagName: tag.name }, draggable: false, id: `tag:${tagIndex}`, position: { x, y }, type: "apiMap" });
    edges.push({ id: `api-tag-${tagIndex}`, markerEnd: { type: MarkerType.ArrowClosed }, source: "api", target: `tag:${tagIndex}`, type: "smoothstep" });
  }
  const rootY = tagCenters.length ? tagCenters.reduce((sum, value) => sum + value, 0) / tagCenters.length : 0;
  const title = typeof model.info.title === "string" ? model.info.title : t.snapshots.explorer.unknownTitle;
  nodes.push({ data: { kind: "api", label: title, subtitle: t.snapshots.explorer.topologySummary(model.tags.length, model.operations.length) }, draggable: false, id: "api", position: { x: 20, y: rootY }, type: "apiMap" });
  return { edges, nodes };
}

export function ApiTopology({ model, onSelect }: { model: OpenApiExplorerModel; onSelect: (operation: OpenApiOperation) => void }) {
  const [activeTag, setActiveTag] = useState<string>();
  const topology = buildTopology(model, activeTag);
  return (
    <Stack gap="3">
      <Flex align={{ base: "flex-start", md: "center" }} bg="accent.soft" border="1px solid" borderColor="accent.border" borderRadius="12px" direction={{ base: "column", md: "row" }} gap="3" justify="space-between" px="4" py="3"><Box><Text color="ink.strong" fontSize="sm" fontWeight="750">{activeTag ? t.snapshots.explorer.topologyTagTitle(activeTag) : t.snapshots.explorer.topologyHintTitle}</Text><Text color="ink.muted" fontSize="xs" mt="1">{activeTag ? t.snapshots.explorer.topologyTagHint : t.snapshots.explorer.topologyHint}</Text></Box>{activeTag && <Button onClick={() => setActiveTag(undefined)} size="xs" variant="outline"><ArrowLeft size={13} />{t.snapshots.explorer.topologyAllTags}</Button>}</Flex>
      <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" h="min(72dvh, 820px)" minH="580px" overflow="hidden">
        <ReactFlow
          key={activeTag ?? "all-tags"}
          colorMode="light"
          edges={topology.edges}
          elementsSelectable
          fitView
          fitViewOptions={{ padding: 0.16 }}
          maxZoom={1.4}
          minZoom={0.18}
          nodes={topology.nodes}
          nodesConnectable={false}
          nodesDraggable={false}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
            if (node.data.tagName) { setActiveTag(node.data.tagName); return; }
            const key = node.data.operationKey;
            const operation = key ? model.operations.find((item) => item.key === key) : undefined;
            if (operation) onSelect(operation);
          }}
          onlyRenderVisibleElements
          proOptions={{ hideAttribution: true }}
        >
          {/* Topoloji renkleri de modül aksanını izler; sabit mavi burada
              API Contract'ı kırmızı temanın dışında bırakıyordu. */}
          <Background color="var(--acc-dim)" gap={24} size={1} variant={BackgroundVariant.Dots} />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap nodeColor={(node) => node.data.kind === "api" ? "var(--acc-hover)" : node.data.kind === "tag" ? "var(--acc)" : "var(--acc-dim)"} pannable zoomable />
        </ReactFlow>
      </Box>
    </Stack>
  );
}
