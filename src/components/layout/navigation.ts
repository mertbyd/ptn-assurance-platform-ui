import { Activity, BellRing, BookOpenCheck, Database, FileCog, Gauge, KeySquare, Mail, Microscope, Network, Settings2, UsersRound, Webhook } from "lucide-react";

import { t } from "@/i18n/tr";

export const navigation = [
  {
    label: "Assurance Platform",
    items: [
      { href: "/assurance", label: "Panolar ve Koşum", icon: Gauge, permissions: [] },
    ],
  },
  {
    label: "API Contract Checker",
    items: [
      { href: "/api-contract/sources", label: "Kaynaklar", icon: Webhook, permissions: [] },
      { href: "/api-contract/snapshots", label: "Anlık Görüntüler", icon: FileCog, permissions: [] },
      { href: "/api-contract/checks", label: "Karşılaştırmalar", icon: Activity, permissions: [] },
      { href: "/api-contract/contracts", label: "Uygunluk", icon: Network, permissions: [] },
    ],
  },
  {
    label: "Database Checker",
    items: [
      { href: "/database/connections", label: "Bağlantılar", icon: Database, permissions: [] },
      { href: "/database/schema-discovery", label: "Keşif", icon: Microscope, permissions: [] },
      { href: "/database/schema-comparison", label: "Şema Karşılaştırma", icon: Activity, permissions: [] },
      { href: "/database/runs", label: "Çalıştırmalar", icon: Activity, permissions: [] },
    ],
  },
  {
    label: "Sistem Ayarları",
    items: [
      { href: "/settings/lookups", label: "Referans Verileri", icon: BookOpenCheck, permissions: [] },
      { href: "/settings/notifications", label: "Bildirim Kuralları", icon: BellRing, permissions: [] },
      { href: "/settings/vault", label: "Gizli Kasa", icon: KeySquare, permissions: [] },
      { href: "/settings/team", label: "Kullanıcılar ve Ekip", icon: UsersRound, permissions: [] },
      { href: "/settings/email", label: "E-Posta Servisi", icon: Mail, permissions: [] },
      { href: "/settings/system", label: "Uygulama Yapılandırması", icon: Settings2, permissions: [] },
    ],
  },
] as const;

export const settingsNavigationItem = {
  href: "/settings",
  label: t.shell.navigation.settings,
  icon: Settings2,
} as const;
