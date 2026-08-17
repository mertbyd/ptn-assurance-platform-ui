import { Box, Flex, Heading, Text } from "@chakra-ui/react";

interface PanelProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function Panel({ title, description, action, children }: PanelProps) {
  return (
    <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" data-motion="surface" overflow="hidden">
      {(title || description || action) && (
        <Flex align="flex-start" gap="4" justify="space-between" px={{ base: "5", md: "6" }} pb="3" pt="5">
          <Box>
            {title && (
              <Heading color="ink.strong" fontSize="md" fontWeight="700">
                {title}
              </Heading>
            )}
            {description && (
              <Text color="ink.muted" fontSize="sm" lineHeight="1.55" mt="1">
                {description}
              </Text>
            )}
          </Box>
          {action}
        </Flex>
      )}
      {children}
    </Box>
  );
}
