"use client";

import { Portal, Tooltip as ChakraTooltip } from "@chakra-ui/react";

interface TooltipProps extends ChakraTooltip.RootProps {
  content: React.ReactNode;
  disabled?: boolean;
}

export function Tooltip({ children, content, disabled, ...rootProps }: TooltipProps) {
  if (disabled) {
    return children;
  }

  return (
    <ChakraTooltip.Root {...rootProps}>
      <ChakraTooltip.Trigger asChild>{children}</ChakraTooltip.Trigger>
      <Portal>
        <ChakraTooltip.Positioner>
          <ChakraTooltip.Content>{content}</ChakraTooltip.Content>
        </ChakraTooltip.Positioner>
      </Portal>
    </ChakraTooltip.Root>
  );
}
