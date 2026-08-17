"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

import { authApi } from "@/api/auth";

type State = "loading" | "success" | "error";

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const userId = searchParams.get("userId") || "";
  const [state, setState] = useState<State>(token && userId ? "loading" : "error");

  useEffect(() => {
    if (!token || !userId) return;
    authApi.confirmEmail(token, userId)
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token, userId]);

  return (
    <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" data-motion="surface" p="8" textAlign="center">
      {state === "loading" && (
        <Flex align="center" direction="column" gap="4">
          <Loader2 className="animate-spin" color="var(--ptn-colors-accent-solid)" size={36} />
          <Text color="ink.muted" fontSize="sm">E-posta onaylanıyor…</Text>
        </Flex>
      )}

      {state === "success" && (
        <Flex align="center" direction="column" gap="4">
          <CheckCircle color="var(--ptn-colors-state-success)" size={40} />
          <Box>
            <Text color="ink.strong" fontSize="lg" fontWeight="700">E-posta onaylandı</Text>
            <Text color="ink.muted" fontSize="sm" mt="1">Artık giriş yapabilirsiniz.</Text>
          </Box>
          <Button asChild bg="accent.solid" borderRadius="control" color="white" h="9" px="5" _hover={{ bg: "accent.hover" }}>
            <Link href="/login">Giriş yap</Link>
          </Button>
        </Flex>
      )}

      {state === "error" && (
        <Flex align="center" direction="column" gap="4">
          <XCircle color="var(--ptn-colors-state-danger)" size={40} />
          <Box>
            <Text color="ink.strong" fontSize="lg" fontWeight="700">Onay başarısız</Text>
            <Text color="ink.muted" fontSize="sm" mt="1">Token geçersiz veya süresi dolmuş.</Text>
          </Box>
          <Button asChild bg="app.subtle" border="1px solid" borderColor="line.subtle" borderRadius="control" color="ink.strong" h="9" px="5" _hover={{ bg: "app.hover" }}>
            <Link href="/login">Ana sayfaya dön</Link>
          </Button>
        </Flex>
      )}
    </Box>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<Box p="8" textAlign="center"><Text color="ink.muted" fontSize="sm">Yükleniyor…</Text></Box>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
