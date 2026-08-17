"use client";

import { ModuleRouteShell } from "@/components/shell/module-route-shell";

const tabs = [
  { href: "/database/connections", key: "connections", label: "Bağlantılar", matches: (pathname: string) => pathname.startsWith("/database/connections") },
  { href: "/database/schema-discovery", key: "discovery", label: "Şema Gezgini", matches: (pathname: string) => pathname.startsWith("/database/schema-discovery") },
  { href: "/database/schema-comparison", key: "comparison", label: "Kıyasla", matches: (pathname: string) => pathname.startsWith("/database/schema-comparison") },
  { href: "/database/runs", key: "runs", label: "Koşumlar", matches: (pathname: string) => pathname.startsWith("/database/runs") },
];

export default function DatabaseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ModuleRouteShell mod="db" name="Veritabanı" tabs={tabs}>{children}</ModuleRouteShell>;
}
