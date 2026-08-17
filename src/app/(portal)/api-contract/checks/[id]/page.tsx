import { CheckReportScreen } from "@/features/checks";
import { PermissionGuard } from "@/features/permissions";
import { Permissions } from "@/lib/permissions";

export default async function CheckReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PermissionGuard anyOf={[Permissions.checks.view]}><CheckReportScreen id={id} /></PermissionGuard>;
}
