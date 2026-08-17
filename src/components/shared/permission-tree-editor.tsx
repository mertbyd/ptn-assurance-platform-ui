"use client";

import { Badge } from "@chakra-ui/react";
import { Checkbox } from "@chakra-ui/react";
import { cn } from "@/lib/utils";
import { describeProvider, inheritedProviders } from "@/lib/permissions";
import type { GetPermissionListResultDto } from "@/types";

interface PermissionTreeEditorProps {
  data: GetPermissionListResultDto;
  grants: Record<string, boolean>;
  // "R" (rol) veya "U" (kullanici). Bu saglayici disindan gelen grant'lar kilitli gosterilir.
  providerName: string;
  onToggle: (name: string, value: boolean) => void;
  disabled?: boolean;
}

export function PermissionTreeEditor({ data, grants, providerName, onToggle, disabled }: PermissionTreeEditorProps) {
  if (!data.groups.length) {
    return <div className="py-8 text-center text-sm text-slate-500">Tanımlı izin grubu yok.</div>;
  }

  return (
    <div className="space-y-5">
      {data.groups.map((group) => (
        <div key={group.name}>
          <div className="mb-2 text-sm font-semibold text-slate-200">{group.displayName}</div>
          <div className="space-y-1.5">
            {group.permissions.map((permission) => {
              const inherited = inheritedProviders(permission, providerName);
              const locked = Boolean(disabled) || inherited.length > 0;
              return (
                <label
                  key={permission.name}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-slate-700/60 bg-slate-950/25 px-3 py-2 text-sm text-slate-200",
                    permission.parentName && "ml-5",
                    locked ? "cursor-not-allowed opacity-80" : "cursor-pointer",
                  )}
                >
                  <Checkbox
                    checked={Boolean(grants[permission.name])}
                    disabled={locked}
                    onChange={(event) => onToggle(permission.name, event.target.checked)}
                  />
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {permission.displayName}
                    {inherited.length ? (
                      <Badge variant="neutral" title="Bu izin bir rolden geliyor; kullanıcıdan doğrudan kaldırılamaz.">
                        {inherited.map(describeProvider).join(", ")} üzerinden
                      </Badge>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
