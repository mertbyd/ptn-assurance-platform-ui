import { Button, Stack } from "@chakra-ui/react";
import { GitCompareArrows } from "lucide-react";
import Link from "next/link";

import { PageHeading } from "@/components/ui/page-heading";
import { t } from "@/i18n/tr";
import { CheckHistoryPanel } from "./check-history-panel";

export function ChecksWorkspace() {
  return (
    <Stack gap="6">
      <PageHeading actions={<Button asChild bg="accent.strong" color="white" _hover={{ bg: "accent.hover" }}><Link href="/api-contract/checks/new"><GitCompareArrows size={16} />{t.checks.newAction}</Link></Button>} description={t.checks.description} eyebrow={t.checks.eyebrow} title={t.checks.title} />
      <CheckHistoryPanel />
    </Stack>
  );
}
