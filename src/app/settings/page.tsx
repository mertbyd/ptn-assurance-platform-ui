"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModuleShell } from "@/components/shell/module-shell";
import { usePermissionsQuery } from "@/features/permissions";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { TabEmailSender } from "./components/email-sender-panel";
import { TabEmailTemplates } from "./components/email-templates-panel";

const GS = `
@keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
@keyframes spin    { to{transform:rotate(360deg);} }
@keyframes dotP    { 0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.4);} }
`;

export default function SettingsPage() {
  const { session, isHydrated, hydrate } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState("email_sender");
  const { data: granted = emptyGrantedPermissions, isLoading: permissionsLoading } = usePermissionsQuery();
  const canViewProvider = hasPermission(granted, Permissions.emailProvider.view);
  const canManageProvider = hasPermission(granted, Permissions.emailProvider.manage);
  const canViewTemplates = hasPermission(granted, Permissions.emailTemplates.view);
  const canManageTemplates = hasPermission(granted, Permissions.emailTemplates.manage);
  const tabs = [
    ...(canViewProvider ? [{ key: "email_sender", label: "Email Sağlayıcı" }] : []),
    ...(canViewTemplates ? [{ key: "email_templates", label: "Email Şablonları" }] : []),
  ];
  const activeTab = tabs.some((item) => item.key === tab) ? tab : (tabs[0]?.key ?? tab);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && !session) router.replace("/login");
  }, [isHydrated, session, router]);
  if (!session) return null;

  return (
    <>
      <style>{GS}</style>
      <ModuleShell
        mod="settings"
        name="Ayarlar"
        tabs={tabs}
        tab={activeTab}
        onTab={setTab}
      >
        {permissionsLoading && <PermissionMessage text="Yetkiler kontrol ediliyor…" />}
        {!permissionsLoading && tabs.length === 0 && (
          <PermissionMessage text="E-posta ayarlarını görüntüleme yetkiniz bulunmuyor." />
        )}
        {activeTab === "email_sender" && canViewProvider && <TabEmailSender canManage={canManageProvider} />}
        {activeTab === "email_templates" && canViewTemplates && <TabEmailTemplates canManage={canManageTemplates} />}
      </ModuleShell>
    </>
  );
}

function PermissionMessage({ text }: { text: string }) {
  return (
    <div style={{ padding: "64px 28px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
      {text}
    </div>
  );
}
