import { Box } from "@chakra-ui/react";

export function BrandGlyph({ inverse = false, size = "9" }: { inverse?: boolean; size?: string }) {
  return (
    <Box
      aria-hidden
      bg={inverse ? "white" : "brand.950"}
      border="1px solid"
      borderColor={inverse ? "whiteAlpha.300" : "brand.800"}
      borderRadius="11px"
      color={inverse ? "brand.950" : "white"}
      flex="0 0 auto"
      h={size}
      p="1.5"
      w={size}
    >
      <svg height="100%" viewBox="0 0 36 36" width="100%">
        <path d="M8 10h7l4 4h9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
        <path d="M8 26h7l4-4h9" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.6" />
        <path d="M12 18h12" fill="none" stroke={inverse ? "#3566e8" : "#91b1ff"} strokeDasharray="2.5 3" strokeLinecap="round" strokeWidth="2.4" />
        <circle cx="7" cy="10" fill={inverse ? "#5f88f4" : "#bdd1ff"} r="2.4" />
        <circle cx="7" cy="26" fill={inverse ? "#5f88f4" : "#bdd1ff"} r="2.4" />
        <path d="m25 11 4 3-4 3M25 19l4 3-4 3" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      </svg>
    </Box>
  );
}
