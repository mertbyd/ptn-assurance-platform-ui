"use client";
import { Loader2 } from "lucide-react";

export const ACC = "#f0a020"; // amber

export function Spin({ size = 16 }: { size?: number }) {
  return <Loader2 size={size} style={{ animation: "spin .85s linear infinite", flexShrink: 0 }} color="rgba(255,255,255,0.3)" />;
}

export function Loading() {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 0" }}><Spin size={20} /></div>;
}

export function Empty({ icon: Icon, title, hint, cta }: { icon: React.ElementType; title: string; hint?: string; cta?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 20px", textAlign: "center", gap: 10 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.18)" }}><Icon size={20} strokeWidth={1.4} /></div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>{hint}</div>}
      {cta}
    </div>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#131620", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden", ...style }}>{children}</div>;
}

export function CardHead({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 13, fontWeight: 650, color: "rgba(255,255,255,0.7)" }}>{title}</span>
      {right}
    </div>
  );
}

export function Btn({ label, icon: Icon, onClick, variant = "ghost", disabled, loading, small }: {
  label: string; icon?: React.ElementType; onClick?: () => void;
  variant?: "primary" | "ghost" | "accent-dim" | "danger-dim";
  disabled?: boolean; loading?: boolean; small?: boolean;
}) {
  const h = small ? 28 : 32; const px = small ? 10 : 12; const fs = small ? 11.5 : 12.5;
  const styles: Record<string, React.CSSProperties> = {
    primary:      { background: ACC, color: "#0d0f14", boxShadow: `0 2px 12px ${ACC}44`, fontWeight: 700 },
    ghost:        { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" },
    "accent-dim": { background: `${ACC}1a`, color: ACC, border: `1px solid ${ACC}33` },
    "danger-dim": { background: "rgba(239,68,68,0.07)", color: "#f87171", border: "1px solid rgba(239,68,68,0.14)" },
  };
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ all: "unset", cursor: disabled || loading ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 5, height: h, padding: `0 ${px}px`, borderRadius: 7, fontSize: fs, fontWeight: 580, transition: "opacity 130ms ease", opacity: disabled ? 0.4 : 1, ...styles[variant] }}>
      {loading ? <Loader2 size={12} style={{ animation: "spin .8s linear infinite" }} /> : Icon ? <Icon size={12} strokeWidth={1.9} /> : null}
      {label}
    </button>
  );
}

export function OutcomeBadge({ code }: { code?: string | null }) {
  if (!code) return <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>—</span>;
  const m: Record<string, [string, string]> = {
    Passed:    ["rgba(74,222,128,0.12)",  "#4ade80"],
    Failed:    ["rgba(239,68,68,0.12)",   "#f87171"],
    Broken:    ["rgba(167,139,250,0.12)", "#c4b5fd"],
    Inconclusive: ["rgba(245,158,11,0.12)", "#fbbf24"],
    Skipped:   ["rgba(255,255,255,0.06)", "#888"],
  };
  const [bg, color] = m[code] ?? ["rgba(255,255,255,0.06)", "#aaa"];
  return <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 650, background: bg, color }}>{code}</span>;
}

export function StatusBadge({ code }: { code: string }) {
  const m: Record<string, string> = {
    pending: "#fbbf24", running: "#60a5fa", completed: "#4ade80",
    failed: "#f87171", cancelled: "#888",
  };
  const lc = code.toLowerCase();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: m[lc] ?? "#aaa" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m[lc] ?? "#aaa", animation: lc === "running" ? "dotP 1.8s ease-in-out infinite" : "none" }} />
      {code}
    </span>
  );
}
