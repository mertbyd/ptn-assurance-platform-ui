"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

function FloatingCard({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "14px 16px",
      backdropFilter: "blur(8px)",
      fontSize: 12,
      color: "rgba(255,255,255,0.55)",
      fontFamily: "'Inter Variable',Inter,system-ui,sans-serif",
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatusRow({ label, status }: { label: string; status: "pass" | "fail" | "warn" | "run" }) {
  const colors = { pass: "#4ade80", fail: "#f87171", warn: "#fbbf24", run: "#60a5fa" };
  const labels = { pass: "PASSED", fail: "FAILED", warn: "WARNING", run: "RUNNING" };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "4px 0" }}>
      <span style={{ color: "rgba(255,255,255,0.45)", fontFamily: "monospace", fontSize: 11 }}>{label}</span>
      <span style={{ color: colors[status], fontWeight: 600, fontSize: 11, letterSpacing: "0.04em" }}>{labels[status]}</span>
    </div>
  );
}

function ConnectionDiagram() {
  return (
    <svg width="340" height="260" viewBox="0 0 340 260" fill="none" style={{ opacity: 0.35 }}>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="rgba(79,144,230,0.7)" />
        </marker>
      </defs>
      <rect x="120" y="95" width="100" height="36" rx="8" fill="rgba(79,144,230,0.08)" stroke="rgba(79,144,230,0.3)" strokeWidth="1" />
      <text x="170" y="117" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11" fontWeight="600">PTN Assurance</text>
      <rect x="130" y="16" width="80" height="30" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <text x="170" y="35" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="10">API Source</text>
      <line x1="170" y1="46" x2="170" y2="95" stroke="rgba(79,144,230,0.25)" strokeWidth="1" strokeDasharray="4 3" markerEnd="url(#arrow)" />
      <rect x="14" y="168" width="96" height="30" rx="6" fill="rgba(45,144,245,0.06)" stroke="rgba(45,144,245,0.2)" strokeWidth="1" />
      <text x="62" y="187" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">DB Checker</text>
      <line x1="130" y1="125" x2="90" y2="168" stroke="rgba(45,144,245,0.2)" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="230" y="168" width="96" height="30" rx="6" fill="rgba(232,64,64,0.06)" stroke="rgba(232,64,64,0.2)" strokeWidth="1" />
      <text x="278" y="187" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">API Checker</text>
      <line x1="210" y1="125" x2="250" y2="168" stroke="rgba(232,64,64,0.2)" strokeWidth="1" strokeDasharray="4 3" />
      <rect x="115" y="220" width="110" height="30" rx="6" fill="rgba(240,160,32,0.06)" stroke="rgba(240,160,32,0.2)" strokeWidth="1" />
      <text x="170" y="239" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">Test Result</text>
      <line x1="62" y1="198" x2="140" y2="220" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />
      <line x1="278" y1="198" x2="200" y2="220" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />
      <circle r="2.5" fill="#4f90e6" opacity="0.7">
        <animateMotion dur="3s" repeatCount="indefinite" path="M170,46 L170,95" />
      </circle>
      <circle r="2" fill="#2d90f5" opacity="0.6">
        <animateMotion dur="3.5s" repeatCount="indefinite" path="M130,125 L90,168" />
      </circle>
      <circle r="2" fill="#e84040" opacity="0.6">
        <animateMotion dur="4s" repeatCount="indefinite" path="M210,125 L250,168" />
      </circle>
    </svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { session, isHydrated, hydrate } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isHydrated && session) router.replace("/home");
  }, [isHydrated, session, router]);

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0d0f14",
      color: "#dde1ea",
      fontFamily: "'Inter Variable',Inter,system-ui,sans-serif",
      overflowX: "hidden",
      position: "relative",
    }}>
      {/* Grid background */}
      <div style={{
        position: "fixed",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(79,144,230,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(79,144,230,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 0,
      }} />
      {/* Glow */}
      <div style={{
        position: "fixed",
        top: "10%", left: "50%",
        transform: "translateX(-50%)",
        width: 700, height: 400,
        background: "radial-gradient(ellipse at center, rgba(79,144,230,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
        animation: "glowPulse 6s ease-in-out infinite",
      }} />

      <style>{`
        @keyframes glowPulse {
          0%,100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
          50%      { opacity: 1;   transform: translateX(-50%) scale(1.05); }
        }
        @keyframes floatA {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-6px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform: translateY(18px); }
          to   { opacity:1; transform: translateY(0); }
        }
        .land-hero-title { animation: fadeUp 600ms cubic-bezier(0.16,1,0.3,1) 100ms both; }
        .land-hero-sub   { animation: fadeUp 600ms cubic-bezier(0.16,1,0.3,1) 220ms both; }
        .land-hero-cta   { animation: fadeUp 600ms cubic-bezier(0.16,1,0.3,1) 340ms both; }
        .land-cards      { animation: fadeUp 600ms cubic-bezier(0.16,1,0.3,1) 460ms both; }
        .dot-pulse {
          display:inline-block; width:5px; height:5px; border-radius:50%;
          animation: dotPulse 1.8s ease-in-out infinite;
        }
        @keyframes dotPulse {
          0%,100%{ opacity:0.4; transform:scale(1); }
          50%    { opacity:1;   transform:scale(1.4); }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(13,15,20,0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #4f90e6, #2d6bc4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#fff",
            boxShadow: "0 0 16px rgba(79,144,230,0.35)",
          }}>PT</div>
          <span style={{ fontSize: 14, fontWeight: 650, color: "rgba(255,255,255,0.8)", letterSpacing: "-0.01em" }}>
            PTN Assurance
          </span>
        </div>
        <button
          onClick={() => router.push("/login")}
          style={{
            all: "unset",
            cursor: "pointer",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.04)",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(79,144,230,0.5)";
            (e.currentTarget as HTMLElement).style.color = "#fff";
            (e.currentTarget as HTMLElement).style.background = "rgba(79,144,230,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
          }}
        >
          Giriş Yap
        </button>
      </nav>

      {/* Hero */}
      <section style={{
        position: "relative",
        zIndex: 1,
        padding: "140px 24px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}>
        <div className="land-hero-title" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "4px 12px",
          borderRadius: 999,
          background: "rgba(79,144,230,0.08)",
          border: "1px solid rgba(79,144,230,0.2)",
          fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
          color: "#4f90e6",
          marginBottom: 28,
        }}>
          <span className="dot-pulse" style={{ background: "#4f90e6" }} />
          DEVELOPER TESTING PLATFORM
        </div>

        <h1 className="land-hero-title" style={{
          margin: "0 0 18px",
          fontSize: "clamp(36px, 6vw, 68px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.07,
          color: "#f0f3fa",
          maxWidth: 760,
        }}>
          Test smarter.<br />
          <span style={{ color: "rgba(255,255,255,0.35)" }}>Understand failures faster.</span>
        </h1>

        <p className="land-hero-sub" style={{
          margin: "0 0 40px",
          fontSize: 16,
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.38)",
          maxWidth: 500,
        }}>
          API contracts, database state and scenario validation<br />
          in one intelligent assurance workspace.
        </p>

        <div className="land-hero-cta" style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => router.push("/login")}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 650,
              background: "#4f90e6",
              color: "#fff",
              boxShadow: "0 2px 20px rgba(79,144,230,0.35)",
              transition: "all 160ms ease",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#3d7fd4";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 28px rgba(79,144,230,0.45)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#4f90e6";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 20px rgba(79,144,230,0.35)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            Giriş Yap &rarr;
          </button>
          <button
            onClick={() => { const el = document.getElementById("features"); el?.scrollIntoView({ behavior: "smooth" }); }}
            style={{
              all: "unset",
              cursor: "pointer",
              padding: "10px 24px",
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 550,
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.03)",
              transition: "all 160ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.18)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)";
            }}
          >
            Platformu Kesfet
          </button>
        </div>

        {/* Floating preview cards */}
        <div className="land-cards" style={{
          display: "flex",
          gap: 14,
          marginTop: 64,
          justifyContent: "center",
          flexWrap: "wrap",
          maxWidth: 900,
        }}>
          <FloatingCard style={{ minWidth: 180, animation: "floatA 5s ease-in-out infinite" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2d90f5", marginBottom: 10, letterSpacing: "0.05em" }}>DATABASE CHECKER</div>
            <StatusRow label="schema" status="pass" />
            <StatusRow label="tables (18)" status="pass" />
            <StatusRow label="constraints" status="warn" />
          </FloatingCard>

          <div style={{ display: "flex", alignItems: "center", animation: "floatB 6s ease-in-out infinite" }}>
            <ConnectionDiagram />
          </div>

          <FloatingCard style={{ minWidth: 180, animation: "floatA 4.5s ease-in-out 0.5s infinite" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#e84040", marginBottom: 10, letterSpacing: "0.05em" }}>API CONTRACT</div>
            <StatusRow label="GET /orders" status="pass" />
            <StatusRow label="POST /payments" status="fail" />
            <StatusRow label="GET /users" status="pass" />
            <div style={{ marginTop: 8, padding: "6px 8px", borderRadius: 6, background: "rgba(232,64,64,0.07)", border: "1px solid rgba(232,64,64,0.15)", fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>
              2 contract changes detected
            </div>
          </FloatingCard>
        </div>

        <div className="land-cards" style={{ marginTop: 14 }}>
          <FloatingCard style={{ maxWidth: 420, textAlign: "left", animation: "floatB 5.5s ease-in-out 1s infinite" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(240,160,32,0.15)", border: "1px solid rgba(240,160,32,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>&#10022;</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f0a020", letterSpacing: "0.05em" }}>AI ANALYSIS</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: "rgba(255,255,255,0.38)" }}>
              &quot;Database persistence does not match the expected scenario after the successful API request. The <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 3 }}>payment_status</code> field was not updated.&quot;
            </p>
          </FloatingCard>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{
        position: "relative", zIndex: 1,
        padding: "80px 24px",
        maxWidth: 900,
        margin: "0 auto",
      }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase", marginBottom: 12 }}>
            One workspace.
          </div>
          <h2 style={{ margin: 0, fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 750, color: "#eaedf4", letterSpacing: "-0.03em" }}>
            Everything you need to validate your system.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 1 }}>
          {[
            { color: "#2d90f5", title: "Database Checker", desc: "Compare expected and actual database state across environments." },
            { color: "#e84040", title: "API Contract", desc: "Validate contracts, detect breaking changes and schema drift." },
            { color: "#f0a020", title: "Scenario Testing", desc: "Define business scenarios and execute repeatable Arazzo tests." },
            { color: "#a855f7", title: "AI Analysis", desc: "Understand failures using existing checker evidence, not guesswork." },
          ].map((f) => (
            <div key={f.title} style={{
              padding: "28px 24px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              transition: "border-color 200ms ease, background 200ms ease",
            }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = `${f.color}30`;
                el.style.background = "rgba(255,255,255,0.035)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(255,255,255,0.06)";
                el.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <div style={{ width: 28, height: 3, borderRadius: 2, background: f.color, marginBottom: 16, boxShadow: `0 0 10px ${f.color}60` }} />
              <div style={{ fontSize: 14, fontWeight: 650, color: "#e0e4f0", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.32)" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 24px 80px" }}>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
          Ready to validate your system?
        </p>
        <button
          onClick={() => router.push("/login")}
          style={{
            all: "unset",
            cursor: "pointer",
            padding: "11px 32px",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 650,
            background: "#4f90e6",
            color: "#fff",
            boxShadow: "0 2px 20px rgba(79,144,230,0.3)",
            transition: "all 160ms ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#3d7fd4"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#4f90e6"; }}
        >
          Platforma Giris Yap &rarr;
        </button>
      </section>
    </div>
  );
}
