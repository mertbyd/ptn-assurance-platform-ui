"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { getSessionIdentity } from "@/lib/session-identity";

interface ModCardProps {
  title: string;
  desc: string;
  tags: string[];
  accent: string;
  accentRgb: string;
  href: string;
}

function ModCard({ title, desc, tags, accent, accentRgb, href }: ModCardProps) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      style={{
        all: "unset",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        padding: "28px 28px 24px",
        borderRadius: 14,
        border: `1px solid rgba(255,255,255,0.07)`,
        background: "#131620",
        width: "100%",
        textAlign: "left",
        transition: "border-color 200ms ease, box-shadow 250ms ease, transform 200ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = `${accent}55`;
        el.style.boxShadow = `0 4px 32px rgba(${accentRgb},0.12)`;
        el.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(255,255,255,0.07)";
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Color bar */}
      <div style={{ width: 32, height: 3, borderRadius: 2, background: accent, marginBottom: 20, boxShadow: `0 0 12px rgba(${accentRgb},0.5)` }} />

      <div style={{ fontSize: 16, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.36)", marginBottom: 20, flex: 1 }}>
        {desc}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 600,
              background: `rgba(${accentRgb},0.1)`,
              color: accent,
              letterSpacing: "0.02em",
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

export default function HomePage() {
  const { session, isHydrated, hydrate, logout } = useAuthStore();
  const router = useRouter();
  const identity = getSessionIdentity(session, "Kullanıcı");

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && !session) router.replace("/login");
  }, [isHydrated, session, router]);

  if (!session) return null;

  return (
    <div style={{ minHeight: "100dvh", background: "#0d0f14", display: "flex", flexDirection: "column" }}>
      {/* Topbar */}
      <header style={{
        height: 48,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "#0d0f14",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "#4f90e6",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff",
            boxShadow: "0 0 14px rgba(79,144,230,0.3)",
          }}>PT</div>
          <span style={{ fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.65)" }}>PTN Assurance</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{identity.displayName}</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => { await logout(); router.replace("/"); }}
          >
            Çıkış
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
        {/* Hero */}
        <div className="anim-up" style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{
            display: "inline-block",
            padding: "3px 12px", borderRadius: 999,
            background: "rgba(79,144,230,0.1)",
            border: "1px solid rgba(79,144,230,0.2)",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
            color: "#4f90e6",
            marginBottom: 20,
          }}>
            PTN ASSURANCE PLATFORM
          </div>
          <h1 style={{
            margin: "0 0 12px",
            fontSize: "clamp(28px, 4.5vw, 44px)",
            fontWeight: 780,
            letterSpacing: "-0.04em",
            color: "#eaedf4",
            lineHeight: 1.12,
          }}>
            Modülü Seç
          </h1>
          <p style={{ margin: 0, fontSize: 13.5, color: "rgba(255,255,255,0.3)", maxWidth: 400 }}>
            API sözleşme kontrolü, veritabanı karşılaştırma ve iş senaryosu testleri.
          </p>
        </div>

        {/* Cards */}
        <div className="stagger" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 14,
          width: "100%",
          maxWidth: 960,
        }}>
          <ModCard
            href="/api-contract/sources"
            title="API Sözleşme"
            desc="OpenAPI kaynaklarını izle, snapshot al, iki sürümü kıyasla. Kırıcı değişiklikleri ve uyumsuzlukları anında tespit et."
            tags={["Snapshot", "Kıyaslama", "Bulgular"]}
            accent="#e84040"
            accentRgb="232,64,64"
          />
          <ModCard
            href="/database/connections"
            title="Veritabanı"
            desc="Bağlantı ekle, canlı şemayı önizle, iki veritabanını karşılaştır. Tablo, kolon ve kısıt farklarını detaylı raporla."
            tags={["Bağlantılar", "Şema", "Kıyaslama"]}
            accent="#2d90f5"
            accentRgb="45,144,245"
          />
          <ModCard
            href="/test"
            title="Test Platformu"
            desc="İş senaryolarını oluştur, yayınla ve koşumları izle. Arazzo tabanlı deterministik, agent-destekli test motoru."
            tags={["Senaryolar", "Koşumlar", "Teşhis"]}
            accent="#f0a020"
            accentRgb="240,160,32"
          />
          <ModCard
            href="/team"
            title="Ekip ve Organizasyon"
            desc="Kiracıları (tenant), kullanıcıları ve rol tabanlı izinleri sistem üzerinden kolaylıkla yönetin."
            tags={["Tenant", "Kullanıcılar", "Yetkiler"]}
            accent="#8b5cf6"
            accentRgb="139,92,246"
          />
          <ModCard
            href="/settings"
            title="Ayarlar"
            desc="Bildirim, SMTP, e-posta şablonları ve global sistem ayarlarını yapılandırın."
            tags={["SMTP", "Şablonlar"]}
            accent="#10b981"
            accentRgb="16,185,129"
          />
        </div>
      </main>
    </div>
  );
}
