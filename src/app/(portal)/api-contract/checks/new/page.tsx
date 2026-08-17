import { ComparisonWizard } from "@/features/checks";
import { PermissionGuard } from "@/features/permissions";
import { Permissions } from "@/lib/permissions";

export default function NewCheckPage() {
  return <PermissionGuard anyOf={[Permissions.checks.execute]}><ComparisonWizard /></PermissionGuard>;
}
