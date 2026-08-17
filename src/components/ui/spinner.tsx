import { Flex } from "@chakra-ui/react";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  centered?: boolean;
}

export function Spinner({ size = 20, centered = false }: SpinnerProps) {
  const icon = (
    <Loader2
      className="animate-spin"
      color="var(--ptn-colors-accent-solid)"
      size={size}
    />
  );

  if (centered) {
    return (
      <Flex align="center" justify="center" py="16">
        {icon}
      </Flex>
    );
  }

  return icon;
}
