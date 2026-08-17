"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

import { system } from "@/theme/system";
import { AuthSessionSync } from "@/components/auth/auth-session-sync";

export function Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ChakraProvider value={system}>
      <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <AuthSessionSync />
          {children}
        </QueryClientProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}
