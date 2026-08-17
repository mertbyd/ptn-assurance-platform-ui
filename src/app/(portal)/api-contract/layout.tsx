"use client";

import { ModuleRouteShell } from "@/components/shell/module-route-shell";

const tabs = [
  { href: "/api-contract/sources", key: "sources", label: "Kaynaklar", matches: (pathname: string) => pathname.startsWith("/api-contract/sources") },
  { href: "/api-contract/contracts", key: "contracts", label: "Snapshot Explorer", matches: (pathname: string) => pathname.startsWith("/api-contract/contracts") || pathname.startsWith("/api-contract/snapshots") },
  { href: "/api-contract/checks", key: "checks", label: "Kıyasla", matches: (pathname: string) => pathname.startsWith("/api-contract/checks") },
];

export default function ApiContractLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ModuleRouteShell mod="api" name="API Sözleşme" tabs={tabs}>{children}</ModuleRouteShell>;
}
