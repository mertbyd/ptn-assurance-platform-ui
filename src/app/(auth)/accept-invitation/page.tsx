"use client";

import { Box, Button, Flex, Input, Stack, Text } from "@chakra-ui/react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm, useWatch } from "react-hook-form";

import { authApi } from "@/api/auth";

interface FormValues {
  userName: string;
  password: string;
  confirmPassword: string;
}

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const userId = searchParams.get("userId") || "";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>();
  const password = useWatch({ control, name: "password" });

  if (!token || !userId) {
    return (
      <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" p="8" textAlign="center">
        <Text color="state.danger" fontSize="sm">Geçersiz davet bağlantısı.</Text>
      </Box>
    );
  }

  if (done) {
    return (
      <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" p="8" textAlign="center" data-motion="surface">
        <Flex align="center" justify="center" mb="4">
          <CheckCircle color="var(--ptn-colors-state-success)" size={40} />
        </Flex>
        <Text color="ink.strong" fontSize="lg" fontWeight="700">Hesabınız oluşturuldu</Text>
        <Text color="ink.muted" fontSize="sm" mt="1">Otomatik yönlendiriliyorsunuz…</Text>
      </Box>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.acceptInvitation({
        userId,
        token,
        userName: values.userName,
        password: values.password,
        passwordConfirm: values.confirmPassword,
      });
      setDone(true);
      setTimeout(() => router.replace("/login"), 1200);
    } catch {
      setError("Davet kabul edilemedi. Token geçersiz veya süresi dolmuş olabilir.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="panel" data-motion="surface" p={{ base: "6", sm: "8" }}>
      <Box mb="6" textAlign="center">
        <Text color="ink.strong" fontSize="xl" fontWeight="760" letterSpacing="-0.025em">
          Daveti Kabul Et
        </Text>
        <Text color="ink.muted" fontSize="sm" mt="1">
          Hesabınızı oluşturmak için bilgilerinizi girin.
        </Text>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="4">
          <Box>
            <Text color="ink.strong" fontSize="sm" fontWeight="550" mb="1.5">Kullanıcı Adı</Text>
            <Input bg="app.subtle" border="1.5px solid" borderColor={errors.userName ? "state.danger" : "line.subtle"} borderRadius="control" h="10" px="3"
              {...register("userName", { required: true })} _focus={{ borderColor: "accent.focus", bg: "app.surface" }} />
          </Box>

          <Box>
            <Text color="ink.strong" fontSize="sm" fontWeight="550" mb="1.5">Şifre</Text>
            <Input type="password" autoComplete="new-password" bg="app.subtle" border="1.5px solid"
              borderColor={errors.password ? "state.danger" : "line.subtle"} borderRadius="control" h="10" px="3"
              {...register("password", { required: true, minLength: 6 })}
              _focus={{ borderColor: "accent.focus", bg: "app.surface" }} />
          </Box>

          <Box>
            <Text color="ink.strong" fontSize="sm" fontWeight="550" mb="1.5">Şifre Tekrar</Text>
            <Input type="password" autoComplete="new-password" bg="app.subtle" border="1.5px solid"
              borderColor={errors.confirmPassword ? "state.danger" : "line.subtle"} borderRadius="control" h="10" px="3"
              {...register("confirmPassword", { required: true, validate: (v) => v === password || "Şifreler eşleşmiyor" })}
              _focus={{ borderColor: "accent.focus", bg: "app.surface" }} />
            {errors.confirmPassword && (
              <Text color="state.danger" fontSize="xs" mt="1">{errors.confirmPassword.message}</Text>
            )}
          </Box>

          {error && (
            <Flex align="center" gap="2">
              <AlertCircle color="var(--ptn-colors-state-danger)" size={14} />
              <Text color="state.danger" fontSize="sm">{error}</Text>
            </Flex>
          )}

          <Button bg="accent.solid" borderRadius="control" color="white" h="10" loading={isLoading} mt="1" type="submit" w="full" _hover={{ bg: "accent.hover" }}>
            Hesabı Oluştur
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<Box p="8" textAlign="center"><Text color="ink.muted" fontSize="sm">Yükleniyor…</Text></Box>}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
