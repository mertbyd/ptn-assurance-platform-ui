import { Box, Button, Flex, Heading, Text } from "@chakra-ui/react";
import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

import { t } from "@/i18n/tr";

export function AccessDenied() {
  return (
    <Flex align="center" justify="center" minH="calc(100dvh - 128px)" py="10">
      <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" maxW="560px" p={{ base: "7", md: "10" }} textAlign="center" w="full">
        <Flex align="center" bg="state.dangerSoft" borderRadius="14px" color="state.danger" h="14" justify="center" mx="auto" w="14">
          <ShieldX aria-hidden size={25} />
        </Flex>
        <Text color="state.danger" fontSize="xs" fontWeight="700" letterSpacing="0.1em" mt="5" textTransform="uppercase">
          {t.permissions.denied.eyebrow}
        </Text>
        <Heading color="ink.strong" fontSize="2xl" fontWeight="750" letterSpacing="-0.03em" mt="2">
          {t.permissions.denied.title}
        </Heading>
        <Text color="ink.muted" fontSize="sm" lineHeight="1.7" mt="3">
          {t.permissions.denied.description}
        </Text>
        <Button asChild borderColor="line.strong" color="ink.body" mt="6" size="sm" variant="outline">
          <Link href="/dashboard">
            <ArrowLeft aria-hidden size={16} />
            {t.permissions.denied.action}
          </Link>
        </Button>
      </Box>
    </Flex>
  );
}
