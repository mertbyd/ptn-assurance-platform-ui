"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { emailApi } from "@/api/email.api";
import { queryKeys } from "@/api/query-keys";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { ApiRequestError } from "@/lib/api-request-error";

export function TabEmailSender({ canManage }: { canManage: boolean }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.email.sender(),
    queryFn: () => emailApi.sender.get(),
  });

  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.02em" }}>
          Email Sağlayıcı
        </h2>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
          Platform sağlayıcısının durumunu izleyin, Gmail bağlantısını tamamlayın ve gerçek gönderimi sınayın.
        </p>
      </div>

      {isLoading && (
        <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
          Yükleniyor…
        </div>
      )}

      {error && (
        <div style={{
          padding: "14px 16px", borderRadius: 10,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)",
          color: "#f87171", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span>{toMessage(error, "Sağlayıcı bilgileri alınamadı.")}</span>
          <button onClick={() => refetch()} style={{
            all: "unset", cursor: "pointer", padding: "4px 12px", borderRadius: 6,
            background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 12, fontWeight: 600,
          }}>Tekrar dene</button>
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Durum Kartı */}
          <div style={{
            background: "#131620", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "20px 22px",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>
              Durum
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Row label="Yapılandırma" value={
                <span style={{ color: data.isConfigured ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                  {data.isConfigured ? "✓ Yapılandırıldı" : "✗ Eksik"}
                </span>
              } />
              <Row label="Bağlantı" value={<span style={{ color: data.isConnected ? "#4ade80" : "#f59e0b" }}>{data.isConnected ? "✓ Bağlı" : "Bağlantı bekliyor"}</span>} />
              {data.provider && <Row label="Sağlayıcı" value={data.provider} />}
              {data.fromAddress && <Row label="Gönderici" value={data.fromAddress} mono />}
              {!data.isConnected && data.isConfigured && isGoogleProvider(data.provider) && (
                <GoogleConnectButton canManage={canManage} />
              )}
            </div>
            <p style={{ margin: "16px 0 0", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.32)", fontSize: 11.5, lineHeight: 1.55 }}>
              Sunucu, gönderici adresi ve gizli bilgiler dağıtım ayarlarında tutulur; parola ve OAuth tokenları API yanıtında hiçbir zaman gösterilmez.
            </p>
          </div>

          {/* Test Gönderimi */}
          <TestCard canManage={canManage} configured={!!data.isConfigured && !!data.isConnected} />
        </div>
      )}
    </div>
  );
}

function GoogleConnectButton({ canManage }: { canManage: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const connect = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await emailApi.sender.getGoogleAuthorization();
      if (!result.authorizationUrl) {
        setError("Google yetkilendirme adresi üretilemedi.");
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch (caught) {
      setError(toMessage(caught, "Google bağlantısı başlatılamadı."));
    } finally {
      setLoading(false);
    }
  };
  if (!canManage) {
    return <span style={{ color: "rgba(245,158,11,0.8)", fontSize: 11.5 }}>Bağlantıyı tamamlamak için yönetim yetkisi gerekir.</span>;
  }
  return (
    <div>
      <button disabled={loading} onClick={() => void connect()} style={{ border: 0, borderRadius: 7, padding: "8px 12px", background: "#4f90e6", color: "white", cursor: loading ? "wait" : "pointer", fontWeight: 650, opacity: loading ? 0.65 : 1 }}>
        {loading ? "Yönlendiriliyor…" : "Google hesabını bağla"}
      </button>
      {error && <p style={{ margin: "8px 0 0", color: "#f87171", fontSize: 11.5 }}>{error}</p>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
      <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.38)" }}>{label}</span>
      <span style={{
        fontSize: 12.5, color: "rgba(255,255,255,0.75)",
        fontFamily: mono ? "monospace" : "inherit",
      }}>{value}</span>
    </div>
  );
}

function TestCard({ canManage, configured }: { canManage: boolean; configured: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!isEmail(email)) {
      setError("Geçerli bir test e-posta adresi girin.");
      setStatus("err");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      await emailApi.sender.sendTest(email.trim());
      setStatus("ok");
    } catch (caught) {
      setStatus("err");
      setError(toMessage(caught, "Test e-postası gönderilemedi."));
    }
  };

  return (
    <div style={{
      background: "#131620", border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12, padding: "20px 22px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 16 }}>
        Test Gönderimi
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
        Yapılandırmayı test etmek için bir adrese örnek e-posta gönderin.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus("idle"); setError(null); }}
          placeholder="test@example.com"
          type="email"
          style={{
            flex: 1, height: 34, padding: "0 10px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 7, color: "#e0e4f0", fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={!email.trim() || !configured || !canManage || status === "loading"}
          style={{
            all: "unset", cursor: !email.trim() || !configured || !canManage ? "not-allowed" : "pointer",
            padding: "0 14px", height: 34, borderRadius: 7,
            background: "#10b981", color: "#fff", fontSize: 12.5, fontWeight: 600,
            opacity: !email.trim() || !configured || !canManage ? 0.4 : 1,
          }}
        >
          {status === "loading" ? "Gönderiliyor…" : "Gönder"}
        </button>
      </div>
      {!canManage && <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(245,158,11,0.8)" }}>Test gönderimi için sağlayıcı yönetim yetkisi gerekir.</p>}
      {canManage && !configured && <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(245,158,11,0.8)" }}>Önce sağlayıcı bağlantısını tamamlayın.</p>}
      {status === "ok" && <p style={{ margin: "10px 0 0", fontSize: 12, color: "#4ade80" }}>✓ Gönderildi.</p>}
      {status === "err" && <p style={{ margin: "10px 0 0", fontSize: 12, color: "#f87171" }}>✗ {error ?? "Gönderim başarısız."}</p>}
    </div>
  );
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isGoogleProvider(provider: string | null | undefined) {
  return (provider ?? "").toLowerCase().includes("google") || (provider ?? "").toLowerCase().includes("gmail");
}

function toMessage(error: unknown, fallback: string) {
  return error instanceof ApiRequestError ? getApiErrorMessage(error) : fallback;
}
