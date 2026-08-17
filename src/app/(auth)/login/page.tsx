"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

// ── Animated test run preview ────────────────────────────

const STEPS = [
  { label: "POST /api/orders", st: "pass" },
  { label: "API Contract check", st: "pass" },
  { label: "DB persistence", st: "run" },
];
const STEPS2 = [
  { label: "POST /api/orders", st: "pass" },
  { label: "API Contract check", st: "pass" },
  { label: "DB persistence", st: "fail" },
];

type St = "pass" | "fail" | "run";
const stColor = { pass: "#4ade80", fail: "#f87171", run: "#60a5fa" };
const stLabel = { pass: "PASSED", fail: "FAILED", run: "RUNNING..." };

function TestPreview() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % 4), 2200);
    return () => clearInterval(t);
  }, []);

  const steps = phase < 2 ? STEPS : STEPS2;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "16px 18px",
      maxWidth: 320,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>
        Test Run #1842
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: stColor[s.st as St], letterSpacing: "0.04em" }}>
            {s.st === "run" ? (
              <span style={{ animation: "runBlink 1s ease-in-out infinite" }}>{stLabel[s.st as St]}</span>
            ) : stLabel[s.st as St]}
          </span>
        </div>
      ))}
      {phase >= 2 && (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#f87171", marginBottom: 6 }}>DB MISMATCH</div>
          <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
            Expected: <span style={{ color: "#4ade80" }}>payment_status = &quot;PAID&quot;</span><br />
            Actual: <span style={{ color: "#f87171" }}>payment_status = &quot;PENDING&quot;</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main login page content ──────────────────────────────

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { isLoading, error, clearError, session, isHydrated, hydrate, login } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [tenantId, setTenantId] = useState("");
  const [organizationUnitId, setOrganizationUnitId] = useState("");
  const [applicationScopeId, setApplicationScopeId] = useState("");
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (isHydrated && session) router.replace("/home"); }, [isHydrated, session, router]);
  useEffect(() => { usernameRef.current?.focus(); }, []);

  const returnTo = params.get("returnTo") || "/home";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (username && password) {
      try {
        await login(username, password, { tenantId, organizationUnitId, applicationScopeId });
        router.replace(returnTo);
    } catch {
        // Error is handled by the store
      }
    }
  };

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0d0f14",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter Variable',Inter,system-ui,sans-serif",
    }}>
      <style>{`
        @keyframes glowPulse {
          0%,100% { opacity:0.6; }
          50%      { opacity:1; }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes runBlink {
          0%,100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .login-field { animation: fadeUp 400ms cubic-bezier(0.16,1,0.3,1) both; }
        .login-field:nth-child(1) { animation-delay: 0ms; }
        .login-field:nth-child(2) { animation-delay: 60ms; }
        .login-field:nth-child(3) { animation-delay: 120ms; }
        .ptn-input-dark {
          width: 100%;
          height: 42px;
          padding: 0 14px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 9px;
          color: #e0e4f0;
          font-size: 13.5px;
          font-family: inherit;
          outline: none;
          transition: border-color 150ms ease, background 150ms ease;
          box-sizing: border-box;
        }
        .ptn-input-dark:focus {
          border-color: rgba(79,144,230,0.6);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 0 0 3px rgba(79,144,230,0.08);
        }
        .ptn-input-dark::placeholder { color: rgba(255,255,255,0.18); }
        .ptn-input-dark.error { border-color: rgba(239,68,68,0.5); }
        .ptn-input-dark.error:focus { border-color: rgba(239,68,68,0.7); box-shadow: 0 0 0 3px rgba(239,68,68,0.07); }
        .login-btn {
          width: 100%;
          height: 42px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 650;
          font-family: inherit;
          border: none;
          cursor: pointer;
          background: #4f90e6;
          color: #fff;
          box-shadow: 0 2px 16px rgba(79,144,230,0.3);
          transition: background 150ms ease, box-shadow 150ms ease, transform 150ms ease;
          letter-spacing: -0.01em;
        }
        .login-btn:hover:not(:disabled) {
          background: #3d7fd4;
          box-shadow: 0 4px 24px rgba(79,144,230,0.4);
          transform: translateY(-1px);
        }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        @media (max-width: 800px) {
          .ptn-login-nav { padding-inline: 16px !important; }
          .ptn-login-split { display: block !important; min-height: calc(100dvh - 52px) !important; }
          .ptn-login-visual { display: none !important; }
          .ptn-login-form { min-height: calc(100dvh - 52px); padding: 32px 20px !important; }
        }
        @media (max-width: 420px) {
          .ptn-login-form { align-items: stretch !important; padding: 24px 16px !important; }
          .ptn-login-form > div { max-width: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav className="ptn-login-nav" style={{
        height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(13,15,20,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100,
        flexShrink: 0,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg,#4f90e6,#2d6bc4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff",
            boxShadow: "0 0 14px rgba(79,144,230,0.3)",
          }}>PT</div>
          <span style={{ fontSize: 13.5, fontWeight: 650, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.01em" }}>PTN Assurance</span>
        </Link>
        <Link href="/" style={{ fontSize: 12.5, color: "rgba(255,255,255,0.28)", textDecoration: "none", transition: "color 150ms ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)"; }}>
          ← Ana Sayfa
        </Link>
      </nav>

      {/* Split */}
      <div className="ptn-login-split" style={{ flex: 1, display: "flex", minHeight: 0 }}>

        {/* ── Left: product visual ── */}
        <div className="ptn-login-visual" style={{
          flex: "0 0 55%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 56px",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}>
          {/* Grid bg */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `
              linear-gradient(rgba(79,144,230,0.035) 1px,transparent 1px),
              linear-gradient(90deg,rgba(79,144,230,0.035) 1px,transparent 1px)
            `,
            backgroundSize: "36px 36px",
            pointerEvents: "none",
          }} />
          {/* Glow */}
          <div style={{
            position: "absolute", top: "20%", left: "30%",
            width: 400, height: 300,
            background: "radial-gradient(ellipse,rgba(79,144,230,0.07) 0%,transparent 70%)",
            pointerEvents: "none",
            animation: "glowPulse 5s ease-in-out infinite",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", marginBottom: 20 }}>
              PTN ASSURANCE
            </div>
            <h2 style={{
              margin: "0 0 14px",
              fontSize: "clamp(26px,3.5vw,38px)",
              fontWeight: 780,
              letterSpacing: "-0.035em",
              color: "#eaedf4",
              lineHeight: 1.15,
            }}>
              Confidence in<br />every release.
            </h2>
            <p style={{ margin: "0 0 40px", fontSize: 14, lineHeight: 1.65, color: "rgba(255,255,255,0.32)", maxWidth: 360 }}>
              API contracts, database state and test scenarios in one intelligent assurance workspace.
            </p>

            {/* Test preview */}
            <div style={{ animation: "floatC 5s ease-in-out infinite" }}>
              <TestPreview />
            </div>

            {/* AI card */}
            <div style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "rgba(240,160,32,0.04)",
              border: "1px solid rgba(240,160,32,0.12)",
              borderRadius: 10,
              maxWidth: 320,
              animation: "floatC 6s ease-in-out 1s infinite",
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f0a020", letterSpacing: "0.06em" }}>✦ AI ANALYSIS</span>
              </div>
              <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.55, color: "rgba(255,255,255,0.32)", fontStyle: "italic" }}>
                &quot;Persistence does not match the expected scenario after the successful API request.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: login form ── */}
        <div className="ptn-login-form" style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 40px",
        }}>
          <div style={{ width: "100%", maxWidth: 380, animation: "fadeUp 400ms cubic-bezier(0.16,1,0.3,1) both" }}>
            <div style={{ marginBottom: 36 }}>
              <h1 style={{
                margin: "0 0 6px",
                fontSize: 22,
                fontWeight: 760,
                color: "#eaedf4",
                letterSpacing: "-0.03em",
              }}>
                Welcome back
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                PTN Assurance&apos;a giriş yap
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <div className="login-field">
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.38)", marginBottom: 6, letterSpacing: "0.025em" }}>
                    KULLANICI ADI
                  </label>
                  <input
                    ref={usernameRef}
                    className={`ptn-input-dark${error ? " error" : ""}`}
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); clearError(); }}
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="none"
                  />
                </div>

                <div className="login-field">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.38)", letterSpacing: "0.025em" }}>
                      PAROLA
                    </label>
                  </div>
                  <input
                    className={`ptn-input-dark${error ? " error" : ""}`}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    autoComplete="current-password"
                  />
                </div>

                <div className="login-field">
                  <button type="button" onClick={() => setShowContext((value) => !value)} style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.42)", fontSize: 12 }}>
                    {showContext ? "▾" : "▸"} Tenant ve çalışma bağlamı
                  </button>
                  {showContext && (
                    <div style={{ display: "grid", gap: 9, marginTop: 10 }}>
                      <input className="ptn-input-dark" value={tenantId} onChange={(event) => setTenantId(event.target.value.trim())} placeholder="Tenant ID (host girişi için boş)" />
                      <input className="ptn-input-dark" value={organizationUnitId} onChange={(event) => setOrganizationUnitId(event.target.value.trim())} placeholder="Organization Unit ID (opsiyonel)" />
                      <input className="ptn-input-dark" value={applicationScopeId} onChange={(event) => setApplicationScopeId(event.target.value.trim())} placeholder="Application Scope ID (opsiyonel)" />
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    animation: "fadeUp 200ms ease both",
                  }}>
                    <span style={{ color: "#f87171", fontSize: 14, flexShrink: 0, lineHeight: 1 }}>⚠</span>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                      Kullanıcı adı veya parola hatalı.
                    </span>
                  </div>
                )}

                <div className="login-field" style={{ marginTop: 4 }}>
                  <button
                    type="submit"
                    className="login-btn"
                    disabled={isLoading || !username || !password}
                  >
                    {isLoading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                          <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                          <path d="M7 1.5A5.5 5.5 0 0 1 12.5 7" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Giriş yapılıyor…
                      </span>
                    ) : "Giriş Yap"}
                  </button>
                </div>

              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
