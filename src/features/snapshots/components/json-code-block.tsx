import { Box } from "@chakra-ui/react";

export function JsonCodeBlock({ value }: { value: unknown }) {
  return (
    <Box
      as="pre"
      bg="app.rail"
      borderRadius="10px"
      color="ink.strong"
      fontFamily="mono"
      fontSize="12px"
      lineHeight="1.65"
      m="0"
      maxH="440px"
      overflow="auto"
      p="4"
      tabIndex={0}
      whiteSpace="pre"
    >
      {JSON.stringify(value, null, 2)}
    </Box>
  );
}
