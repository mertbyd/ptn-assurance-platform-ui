import { Box, Button, Flex, Text } from "@chakra-ui/react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Flex
      align="center"
      data-motion="surface"
      direction="column"
      gap="4"
      py="20"
      textAlign="center"
    >
      <Flex
        align="center"
        bg="app.muted"
        borderRadius="16px"
        color="ink.faint"
        h="14"
        justify="center"
        w="14"
      >
        <Icon size={24} strokeWidth={1.4} />
      </Flex>
      <Box>
        <Text color="ink.strong" fontSize="sm" fontWeight="600">
          {title}
        </Text>
        {description && (
          <Text color="ink.muted" fontSize="sm" mt="1">
            {description}
          </Text>
        )}
      </Box>
      {action && (
        <Button
          bg="accent.solid"
          borderRadius="control"
          color="white"
          h="9"
          onClick={action.onClick}
          px="4"
          size="sm"
          _hover={{ bg: "accent.hover" }}
        >
          {action.label}
        </Button>
      )}
    </Flex>
  );
}
