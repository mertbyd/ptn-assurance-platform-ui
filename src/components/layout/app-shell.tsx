"use client";

import { Box, Flex } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { t } from "@/i18n/tr";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const updateScrolledState = () => setIsScrolled(window.scrollY > 12);
    updateScrolledState();
    window.addEventListener("scroll", updateScrolledState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrolledState);
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const selector = '[data-motion]:not([data-motion="page"])';

    if (reducedMotion || !("IntersectionObserver" in window)) {
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.dataset.motionState = "visible";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          element.dataset.motionState = "visible";
          observer.unobserve(element);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.08 },
    );

    const observe = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(`${selector}:not([data-motion-state])`).forEach((element, index) => {
        const inheritedDelay = element.style.getPropertyValue("--acc-motion-delay");
        if (!inheritedDelay) {
          element.style.setProperty("--acc-motion-delay", `${Math.min(index % 4, 3) * 35}ms`);
        }
        observer.observe(element);
      });
    };

    observe(document);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(selector) && !node.dataset.motionState) observer.observe(node);
          observe(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <Box minH="100dvh">
      <Box
        boxShadow={isSidebarExpanded ? "xl" : "none"}
        display={{ base: "none", lg: "block" }}
        h="100dvh"
        left="0"
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsSidebarExpanded(false); }}
        onFocus={() => setIsSidebarExpanded(true)}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        overflow="hidden"
        position="fixed"
        top="0"
        transition="width 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 180ms ease-out"
        w={isSidebarExpanded ? "280px" : "76px"}
        zIndex="modal"
      >
        <Sidebar compact={!isSidebarExpanded} />
      </Box>
      {isMenuOpen && (
        <Box data-motion="fade" display={{ base: "block", lg: "none" }} inset="0" position="fixed" zIndex="modal">
          <Box
            aria-label={t.shell.mobileMenuClose}
            as="button"
            bg="rgba(15, 23, 42, 0.36)"
            inset="0"
            onClick={() => setIsMenuOpen(false)}
            position="absolute"
          />
          <Box data-motion="slide" h="100%" maxW="88vw" position="relative" w="292px">
            <Sidebar onNavigate={() => setIsMenuOpen(false)} />
          </Box>
        </Box>
      )}
      <Flex direction="column" minH="100dvh" ml={{ base: "0", lg: "76px" }}>
        <Box position="sticky" top="0" zIndex="sticky">
          <Topbar condensed={isScrolled} onOpenMenu={() => setIsMenuOpen(true)} />
        </Box>
        <Box as="main" flex="1" px={{ base: "4", md: "7", xl: "10" }} py={{ base: "6", md: "9" }}>
          <Box data-motion="page" key={pathname} maxW="1680px" mx="auto" w="full">
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
