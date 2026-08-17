"use client";

import { usePathname, useRouter } from "next/navigation";

import { ModuleShell, type TabDef } from "@/components/shell/module-shell";

interface RouteTab extends TabDef {
  href: string;
  matches: (pathname: string) => boolean;
}

interface ModuleRouteShellProps {
  children: React.ReactNode;
  mod: "api" | "db";
  name: string;
  tabs: RouteTab[];
}

export function ModuleRouteShell({ children, mod, name, tabs }: ModuleRouteShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = tabs.find((tab) => tab.matches(pathname)) ?? tabs[0];

  return (
    <ModuleShell
      mod={mod}
      name={name}
      onTab={(key) => {
        const target = tabs.find((tab) => tab.key === key);
        if (target) router.push(target.href);
      }}
      showAgent={false}
      tab={activeTab.key}
      tabs={tabs}
    >
      {children}
    </ModuleShell>
  );
}
