"use client";

import { Box, Flex, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { AppMark } from "@/components/ui/app-mark";
import { usePermissionsQuery } from "@/features/permissions";
import { t } from "@/i18n/tr";
import { emptyGrantedPermissions, hasAnyPermission } from "@/lib/permissions";
import { getSessionIdentity } from "@/lib/session-identity";
import { useAuthStore } from "@/stores/auth-store";

import { navigation } from "./navigation";

interface SidebarProps {
  compact?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ compact = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const session = useAuthStore((state) => state.session);
  const { data: grantedPermissions = emptyGrantedPermissions } = usePermissionsQuery();
  const identity = getSessionIdentity(session, t.shell.defaultUserName);
  const visibleSections = navigation
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasAnyPermission(grantedPermissions, item.permissions)),
    }))
    .filter((section) => section.items.length > 0);
  const activeHref = visibleSections
    .flatMap((section) => section.items)
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  return (
    <Flex bg="app.surface" color="brand.900" direction="column" h="100%" minH="0">
      <Flex align="center" borderBottom="1px solid" borderColor="line.subtle" h="20" justify={compact ? "center" : "flex-start"} px={compact ? "3" : "6"}>
        <AppMark blue compact={compact} />
      </Flex>
      <Box
        as="nav"
        aria-label={t.shell.navigationLabel}
        css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
        flex="1"
        overflowY="auto"
        px={compact ? "2" : "3"}
        py={compact ? "3" : "5"}
      >
        <Stack gap={compact ? "1" : "6"}>
          {visibleSections.map((section) => (
            <Box key={section.label}>
              {!compact && (
                <Text color="brand.600" data-motion="slide" fontSize="10px" fontWeight="750" letterSpacing="0.14em" mb="2" px="3" textTransform="uppercase">
                  {section.label}
                </Text>
              )}
              <Stack gap="1">
                {section.items.map((item) => {
                  const isActive = activeHref === item.href;
                  const Icon = item.icon;

                  return (
                    <Link
                      asChild
                      aria-label={compact ? item.label : undefined}
                      bg={isActive ? "accent.soft" : "transparent"}
                      borderRadius="10px"
                      color={isActive ? "accent.strong" : "brand.900"}
                      fontSize="sm"
                      fontWeight={isActive ? "650" : "520"}
                      h={compact ? "10" : "auto"}
                      key={item.href}
                      outline="none"
                      position="relative"
                      px={compact ? "0" : "3"}
                      py={compact ? "0" : "2.5"}
                      textDecoration="none"
                      transition="background-color 220ms ease-out, color 220ms ease-out, transform 260ms cubic-bezier(0.16, 1, 0.3, 1)"
                      _before={isActive ? { bg: "accent.solid", borderRadius: "full", content: '\"\"', h: "20px", left: "0", position: "absolute", w: "3px" } : undefined}
                      _hover={{ bg: "app.hover", color: "accent.strong", textDecoration: "none", transform: compact ? "scale(1.04)" : "translateX(2px)" }}
                    >
                      <NextLink
                        href={item.href}
                        onClick={() => {
                          if (onNavigate) {
                            window.setTimeout(onNavigate, 0);
                          }
                        }}
                      >
                        <Flex align="center" gap="3" h={compact ? "full" : "auto"} justify={compact ? "center" : "flex-start"}>
                          <Icon aria-hidden size={18} strokeWidth={isActive ? 2.1 : 1.8} />
                          {!compact && <Text data-motion="slide">{item.label}</Text>}
                        </Flex>
                      </NextLink>
                    </Link>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>
      <Box borderTop="1px solid" borderColor="line.subtle" p={compact ? "3" : "4"}>
        <Flex align="center" bg="app.subtle" borderRadius="12px" gap="3" justify={compact ? "center" : "flex-start"} p="3">
          <Flex align="center" bg="accent.strong" borderRadius="9px" color="white" fontSize="xs" fontWeight="750" h="9" justify="center" w="9">
            {identity.initials}
          </Flex>
          {!compact && <Box minW="0">
            <Text color="brand.900" fontSize="xs" fontWeight="650" truncate>
              {identity.displayName}
            </Text>
            <Text color="accent.strong" fontSize="11px" mt="0.5" truncate>
              {t.shell.defaultUserRole}
            </Text>
          </Box>}
        </Flex>
      </Box>
    </Flex>
  );
}
