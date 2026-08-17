import { PermissionGuard } from "@/features/permissions";
import { SnapshotRouteResolver } from "@/features/snapshots";
import { Permissions } from "@/lib/permissions";

export default async function SnapshotDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PermissionGuard anyOf={[Permissions.sources.view]}><SnapshotRouteResolver id={id} /></PermissionGuard>;
}
