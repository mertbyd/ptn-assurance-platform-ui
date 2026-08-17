"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { getSectionForPath, SECTIONS, type SectionConfig } from "@/lib/section";

export function useSection(): SectionConfig {
  const pathname = usePathname();
  return useMemo(() => SECTIONS[getSectionForPath(pathname)], [pathname]);
}
