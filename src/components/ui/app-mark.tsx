import { Box, Flex, Text } from "@chakra-ui/react";

import { t } from "@/i18n/tr";
import { BrandGlyph } from "./brand-glyph";

interface AppMarkProps {
  blue?: boolean;
  compact?: boolean;
  inverse?: boolean;
}

export function AppMark({ blue = false, compact = false, inverse = false }: AppMarkProps) {
  return (
    <Flex align="center" gap="3" minW="0" w={compact ? "auto" : "full"}>
      <BrandGlyph inverse={inverse} />
      {!compact && (
        <Box flex="1" minW="0">
          <Text color={blue ? "brand.900" : inverse ? "white" : "ink.strong"} fontSize="sm" fontWeight="780" lineHeight="1.2" whiteSpace="nowrap">
            {t.brand.name}
          </Text>
          <Text color={blue ? "brand.600" : inverse ? "blue.200" : "ink.muted"} fontSize="xs" mt="0.5" whiteSpace="nowrap">
            {t.brand.descriptor}
          </Text>
        </Box>
      )}
    </Flex>
  );
}
