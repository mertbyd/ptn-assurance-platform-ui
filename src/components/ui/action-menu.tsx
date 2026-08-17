"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export function ActionMenu({ items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <Box position="relative" ref={ref}>
      <Button
        aria-label="İşlemler"
        bg="transparent"
        borderRadius="8px"
        color="ink.muted"
        h="8"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        px="2"
        variant="ghost"
        _hover={{ bg: "app.muted", color: "ink.strong" }}
      >
        <MoreHorizontal size={16} />
      </Button>

      {open && (
        <Box
          bg="app.surface"
          border="1px solid"
          borderColor="line.subtle"
          borderRadius="12px"
          boxShadow="0 8px 30px rgba(0,0,0,0.08)"
          data-motion="surface"
          minW="160px"
          overflow="hidden"
          p="1"
          position="absolute"
          right="0"
          top="calc(100% + 4px)"
          zIndex="dropdown"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                borderRadius="8px"
                color={item.variant === "danger" ? "state.danger" : "ink.body"}
                disabled={item.disabled}
                fontSize="sm"
                fontWeight="500"
                h="9"
                justifyContent="flex-start"
                key={item.label}
                onClick={() => { item.onClick(); setOpen(false); }}
                px="3"
                variant="ghost"
                w="full"
                _hover={{ bg: item.variant === "danger" ? "state.dangerSoft" : "app.hover" }}
              >
                <Flex align="center" gap="2">
                  {Icon && <Icon size={14} />}
                  <Text>{item.label}</Text>
                </Flex>
              </Button>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
