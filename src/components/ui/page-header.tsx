import { Box, Flex, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <Flex align="flex-start" justify="space-between" mb="7">
      <Box>
        <Text
          as="h1"
          color="ink.strong"
          data-motion="surface"
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="780"
          letterSpacing="-0.03em"
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            color="ink.muted"
            data-motion="surface"
            fontSize="sm"
            fontWeight="450"
            mt="0.5"
          >
            {subtitle}
          </Text>
        )}
      </Box>
      {action && (
        <Box data-motion="surface" flexShrink={0} ml="4" mt="0.5">
          {action}
        </Box>
      )}
    </Flex>
  );
}
