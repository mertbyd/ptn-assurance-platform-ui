"use client";

import { Flex, Skeleton, Stack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { t } from "@/i18n/tr";
import { takeAuthRedirectReason } from "@/lib/auth-storage";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const session = useAuthStore((state) => state.session);
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !session) {
      const reason = takeAuthRedirectReason();
      router.replace(reason ? `/login?reason=${reason}` : "/login");
    }
  }, [isHydrated, router, session]);

  if (!isHydrated || !session) {
    return (
      <Flex align="center" aria-label={t.auth.sessionChecking} bg="app.canvas" justify="center" minH="100dvh" role="status">
        <Stack gap="3" maxW="360px" w="calc(100% - 48px)">
          <Skeleton borderRadius="12px" h="12" />
          <Skeleton borderRadius="12px" h="28" />
        </Stack>
      </Flex>
    );
  }

  return children;
}
