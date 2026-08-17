import { Badge } from "@chakra-ui/react";
import { getStatusTone } from "@/lib/presentation";

interface StatusBadgeProps {
  code?: string | null;
  label?: string | null;
}

export function StatusBadge({ code, label }: StatusBadgeProps) {
  return <Badge variant={getStatusTone(code)}><span className="size-1.5 rounded-full bg-current opacity-80" />{label || code || "Durum yok"}</Badge>;
}
