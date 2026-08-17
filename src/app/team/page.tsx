"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ModuleShell } from "@/components/shell/module-shell";
import { useAuthPermissionsQuery } from "@/features/permissions/hooks/use-permissions-query";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import { TabTenants } from "./components/tenants-panel";
import { TabUsers } from "./components/users-panel";
import { TabPermissions } from "./components/permissions-panel";

const GS = `
@keyframes fadeUp { from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);} }
@keyframes spin    { to{transform:rotate(360deg);} }
@keyframes dotP    { 0%,100%{opacity:.5;transform:scale(1);}50%{opacity:1;transform:scale(1.4);} }
`;

export default function TeamPage() {
  const { session, isHydrated, hydrate } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState("tenants");
  const { data: granted = emptyGrantedPermissions, isLoading: permissionsLoading } = useAuthPermissionsQuery();
  const tenantAccess = {
    create: hasPermission(granted, Permissions.authenticator.tenants.create),
    passivate: hasPermission(granted, Permissions.authenticator.tenants.passivate),
    reactivate: hasPermission(granted, Permissions.authenticator.tenants.reactivate),
    read: hasPermission(granted, Permissions.authenticator.tenants.read),
    rename: hasPermission(granted, Permissions.authenticator.tenants.rename),
  };
  const userAccess = {
    delete: hasPermission(granted, Permissions.identity.users.delete),
    invite: hasPermission(granted, Permissions.authenticator.auth.inviteMember),
    managePermissions: hasPermission(granted, Permissions.identity.users.managePermissions),
    update: hasPermission(granted, Permissions.identity.users.update),
    view: hasPermission(granted, Permissions.identity.users.view),
  };
  const roleAccess = {
    managePermissions: hasPermission(granted, Permissions.identity.roles.managePermissions),
    view: hasPermission(granted, Permissions.identity.roles.view),
  };
  const tabs = [
    ...(tenantAccess.read ? [{ key: "tenants", label: "Organizasyonlar" }] : []),
    ...(userAccess.view ? [{ key: "users", label: "Kullanıcılar" }] : []),
    ...(roleAccess.view ? [{ key: "permissions", label: "Rol ve İzinler" }] : []),
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
        mod="team"
        name="Ekip ve Organizasyon"
        tabs={tabs}
        tab={activeTab}
        onTab={setTab}
      >
        {permissionsLoading && <div style={{ padding: 64, textAlign: "center", color: "rgba(255,255,255,.4)" }}>Yetkiler kontrol ediliyor…</div>}
        {!permissionsLoading && tabs.length === 0 && <div style={{ padding: 64, textAlign: "center", color: "rgba(255,255,255,.4)" }}>Ekip yönetimini görüntüleme yetkiniz bulunmuyor.</div>}
        {activeTab === "tenants" && tenantAccess.read && <TabTenants access={tenantAccess} />}
        {activeTab === "users" && userAccess.view && <TabUsers access={userAccess} />}
        {activeTab === "permissions" && roleAccess.view && <TabPermissions canManage={roleAccess.managePermissions} />}
      </ModuleShell>
    </>
  );
}
