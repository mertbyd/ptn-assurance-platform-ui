"use client";

import { Button, Text } from "@chakra-ui/react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyButtonProps {
  value: string;
  size?: "xs" | "sm";
}

export function CopyButton({ value, size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <Button
      bg="transparent"
      borderRadius="8px"
      color={copied ? "state.success" : "ink.muted"}
      gap="1.5"
      h={size === "xs" ? "6" : "7"}
      onClick={handleCopy}
      px="2"
      size="xs"
      transition="all 180ms ease-out"
      variant="ghost"
      _hover={{ bg: "app.muted", color: "ink.strong" }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <Text fontSize={size === "xs" ? "10px" : "xs"} fontWeight="500">
        {copied ? "Kopyalandı!" : "Kopyala"}
      </Text>
    </Button>
  );
}
