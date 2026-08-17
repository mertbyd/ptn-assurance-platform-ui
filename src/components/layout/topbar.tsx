"use client";

import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { Bell, CircleHelp, LogOut, Menu, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AppMark } from "@/components/ui/app-mark";
import { t } from "@/i18n/tr";
import { getSessionIdentity } from "@/lib/session-identity";
import { useAuthStore } from "@/stores/auth-store";

interface TopbarProps {
  condensed?: boolean;
  onOpenMenu: () => void;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Button aria-label={label} bg="transparent" borderRadius="full" color="ink.muted" h="9" minW="9" onClick={onClick} px="0" size="sm" variant="ghost" _hover={{ bg: "app.muted", color: "ink.strong" }}>
      {children}
    </Button>
  );
}

export function Topbar({ condensed = false, onOpenMenu }: TopbarProps) {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const identity = getSessionIdentity(session, t.shell.defaultUserName);
  const router = useRouter();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAccountOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountOpen]);

  const handleSignOut = () => {
    signOut();
    router.replace("/");
  };

  return (
    <Flex
      align="center"
      bg="app.surface"
      borderBottom="1px solid"
      borderColor={condensed ? "line.strong" : "line.subtle"}
      h={condensed ? "15" : "17"}
      justify="space-between"
      px={{ base: "4", md: "7" }}
      transition="height 260ms cubic-bezier(0.16, 1, 0.3, 1), border-color 180ms ease-out"
    >
      <Flex align="center" gap="3">
        <Box display={{ base: "block", lg: "none" }}>
          <IconButton label={t.shell.mobileMenuOpen} onClick={onOpenMenu}>
            <Menu aria-hidden size={20} />
          </IconButton>
        </Box>
        <Box display={{ base: "block", sm: "none" }}>
          <AppMark compact />
        </Box>
        <Button
          bg="app.muted"
          border="0"
          borderRadius="full"
          color="ink.muted"
          display={{ base: "none", sm: "flex" }}
          fontWeight="500"
          gap="2.5"
          h="10"
          justifyContent="flex-start"
          minW={{ sm: "250px", md: "340px" }}
          px="4"
          size="sm"
          variant="outline"
          _hover={{ bg: "app.hover", color: "ink.body" }}
        >
          <Search aria-hidden size={16} />
          <Text flex="1" textAlign="left">
            {t.shell.commandHint}
          </Text>
          <Text color="ink.faint" fontSize="10px" letterSpacing="0.04em">
            ⌘K
          </Text>
        </Button>
      </Flex>
      <Flex align="center" gap="1" position="relative" ref={accountRef}>
        <IconButton label={t.shell.helpLabel}>
          <CircleHelp aria-hidden size={18} />
        </IconButton>
        <IconButton label={t.shell.notificationsLabel}>
          <Bell aria-hidden size={18} />
        </IconButton>
        <Button
          aria-label={t.shell.accountLabel}
          bg="accent.solid"
          borderRadius="full"
          color="ink.onAccent"
          fontSize="xs"
          fontWeight="750"
          h="9"
          minW="9"
          ml="1"
          onClick={() => setIsAccountOpen((value) => !value)}
          px="0"
          _hover={{ bg: "accent.hover" }}
        >
          {identity.initials}
        </Button>
        {isAccountOpen && (
          <Box bg="app.surface" border="1px solid" borderColor="line.subtle" borderRadius="12px" data-motion="surface" minW="220px" p="2" position="absolute" right="0" top="12" zIndex="dropdown">
            <Box borderBottom="1px solid" borderColor="line.subtle" px="3" py="2.5">
              <Text color="ink.strong" fontSize="sm" fontWeight="650" truncate>
                {identity.displayName}
              </Text>
              <Text color="ink.muted" fontSize="xs" mt="0.5">
                {t.shell.defaultUserRole}
              </Text>
            </Box>
            <Button color="state.danger" justifyContent="flex-start" mt="1" onClick={handleSignOut} size="sm" variant="ghost" w="full">
              <LogOut aria-hidden size={16} />
              {t.shell.signOut}
            </Button>
          </Box>
        )}
      </Flex>
    </Flex>
  );
}
