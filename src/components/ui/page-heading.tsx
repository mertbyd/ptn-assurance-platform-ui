import { Box, Flex, Heading, Text } from "@chakra-ui/react";

interface PageHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeading({ eyebrow, title, description, actions }: PageHeadingProps) {
  return (
    <Flex align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap="6" justify="space-between">
      <Box data-motion="surface" maxW="720px">
        {eyebrow && (
          <Text color="accent.solid" fontSize="11px" fontWeight="800" letterSpacing="0.14em" mb="2.5" textTransform="uppercase">
            {eyebrow}
          </Text>
        )}
        <Heading color="ink.strong" fontSize={{ base: "2xl", md: "34px" }} fontWeight="780" letterSpacing="-0.045em" lineHeight="1.08">
          {title}
        </Heading>
        {description && (
          <Text color="ink.muted" fontSize={{ base: "sm", md: "15px" }} lineHeight="1.7" mt="2.5" maxW="720px">
            {description}
          </Text>
        )}
      </Box>
      {actions && <Box alignSelf={{ base: "flex-start", md: "center" }} data-motion="surface-delayed">{actions}</Box>}
    </Flex>
  );
}
