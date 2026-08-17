"use client";

import { Box, Flex } from "@chakra-ui/react";

import { ErrorState, LoadingState } from "@/components/ui/screen-state";
import { t } from "@/i18n/tr";

import { usePermissionsQuery } from "../hooks/use-permissions-query";

export function PermissionsBootstrap({ children }: Readonly<{ children: React.ReactNode }>) {
  const permissionsQuery = usePermissionsQuery();

  if (permissionsQuery.isPending) {
    return (
      <Flex align="center" bg="app.canvas" justify="center" minH="100dvh" p="6">
        <Box maxW="720px" w="full">
          <LoadingState />
        </Box>
      </Flex>
    );
  }

  if (permissionsQuery.isError) {
    return (
      <Flex align="center" bg="app.canvas" justify="center" minH="100dvh" p="6">
        <Box maxW="720px" w="full">
          <ErrorState
            description={t.permissions.loadError.description}
            onRetry={() => void permissionsQuery.refetch()}
            title={t.permissions.loadError.title}
          />
        </Box>
      </Flex>
    );
  }

  return children;
}
