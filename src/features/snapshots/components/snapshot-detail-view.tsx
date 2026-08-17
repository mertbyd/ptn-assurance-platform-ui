import { Button, Stack } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { PageHeading } from "@/components/ui/page-heading";
import { t } from "@/i18n/tr";
import { SnapshotContentPanel } from "./snapshot-content-panel";

export function SnapshotDetailView({ id }: { id: string }) {
  return (
    <Stack gap="6">
      <PageHeading actions={<Button asChild variant="outline"><Link href="/api-contract/sources"><ArrowLeft size={16} />{t.snapshots.back}</Link></Button>} description={t.snapshots.detailDescription} eyebrow={t.snapshots.eyebrow} title={t.snapshots.detailTitle} />
      <SnapshotContentPanel id={id} />
    </Stack>
  );
}
