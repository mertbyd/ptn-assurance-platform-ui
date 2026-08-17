"use client";

import { Box, Stack, Tabs } from "@chakra-ui/react";
import { Mail, ScrollText } from "lucide-react";

import { PageHeading } from "@/components/ui/page-heading";
import { usePermissionsQuery } from "@/features/permissions";
import { t } from "@/i18n/tr";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";

import { SenderPanel } from "./sender-panel";
import { TemplatesPanel } from "./templates-panel";

export function EmailPageView() {
  const { data: granted = emptyGrantedPermissions } = usePermissionsQuery();
  const canViewSender = hasPermission(granted, Permissions.email.viewSender);
  const canManageSender = hasPermission(granted, Permissions.email.manageSender);
  const canViewTemplates = hasPermission(granted, Permissions.emailTemplates.view);
  const canManageTemplates = hasPermission(granted, Permissions.emailTemplates.manage);
  const defaultTab = canViewSender ? "sender" : "templates";

  return (
    <Stack gap="7">
      <PageHeading description={t.email.description} eyebrow={t.email.eyebrow} title={t.email.title} />
      <Tabs.Root defaultValue={defaultTab} lazyMount variant="enclosed">
        <Tabs.List bg="app.subtle" borderRadius="control" p="1">
          {canViewSender && (
            <Tabs.Trigger value="sender"><Mail size={15} />{t.email.tabs.sender}</Tabs.Trigger>
          )}
          {canViewTemplates && (
            <Tabs.Trigger value="templates"><ScrollText size={15} />{t.email.tabs.templates}</Tabs.Trigger>
          )}
        </Tabs.List>
        {canViewSender && (
          <Tabs.Content value="sender">
            <Box pt="5"><SenderPanel canManage={canManageSender} canView={canViewSender} /></Box>
          </Tabs.Content>
        )}
        {canViewTemplates && (
          <Tabs.Content value="templates">
            <Box pt="5"><TemplatesPanel canManage={canManageTemplates} canView={canViewTemplates} /></Box>
          </Tabs.Content>
        )}
      </Tabs.Root>
    </Stack>
  );
}
