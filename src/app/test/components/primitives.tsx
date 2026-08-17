"use client";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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

/* Buton dili tek yerde tanımlıdır: yükseklik, kenarlık ve yazı ağırlığı varyantlar arasında
 * aynı; ayrışan tek şey renktir. Etkileşim durumları (hover/active/odak) inline stille
 * yazılamadığı için state ile taşınır — depoda `connections-page-view` de aynı deseni
 * kullanıyor. Odak halkası bilinçli olarak korunur: `all: unset` onu siliyordu. */
export function Btn({ label, icon: Icon, onClick, variant = "ghost", disabled, loading, small, block }: {
  label: string; icon?: React.ElementType; onClick?: () => void;
  variant?: "primary" | "ghost" | "accent-dim" | "danger-dim";
  disabled?: boolean; loading?: boolean; small?: boolean; block?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const isOff = Boolean(disabled || loading);
  const h = small ? 26 : 32;
  const styles: Record<string, { bg: string; color: string; border: string; hoverBg: string }> = {
    primary:      { bg: ACC, color: "#0d0f14", border: `1px solid ${ACC}`, hoverBg: "#ffb43a" },
    ghost:        { bg: "rgba(255,255,255,0.045)", color: "rgba(255,255,255,0.62)", border: "1px solid rgba(255,255,255,0.10)", hoverBg: "rgba(255,255,255,0.09)" },
    "accent-dim": { bg: `${ACC}16`, color: ACC, border: `1px solid ${ACC}3d`, hoverBg: `${ACC}26` },
    "danger-dim": { bg: "rgba(239,68,68,0.09)", color: "#f87171", border: "1px solid rgba(239,68,68,0.22)", hoverBg: "rgba(239,68,68,0.16)" },
  };
  const tone = styles[variant];
  return (
    <button
      onClick={onClick}
      disabled={isOff}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onPointerDown={() => setActive(true)}
      onPointerUp={() => setActive(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
        width: block ? "100%" : undefined,
        height: h, padding: small ? "0 9px" : "0 12px", borderRadius: 7,
        background: isOff ? tone.bg : hover ? tone.hoverBg : tone.bg,
        border: tone.border, color: tone.color,
        font: `${small ? 650 : 620} ${small ? 11 : 12.5}px/1 inherit`,
        cursor: isOff ? "not-allowed" : "pointer",
        opacity: isOff ? 0.38 : 1,
        transform: active && !isOff ? "translateY(1px)" : "none",
        transition: "background 120ms ease, opacity 120ms ease, transform 80ms ease",
        whiteSpace: "nowrap",
      }}
    >
      {loading ? <Loader2 size={12} style={{ animation: "spin .8s linear infinite", flexShrink: 0 }} /> : Icon ? <Icon size={12} strokeWidth={2} style={{ flexShrink: 0 }} /> : null}
      {label}
    </button>
  );
}

/* Rozetin RENGİ kapalı koddan, YAZISI lookup satırından gelir. `label` verilmezse koda
 * düşülür; bu yalnız lookup henüz yüklenmemişken olur (CURRENT-0007 §4). */
export function OutcomeBadge({ code, label }: { code?: string | null; label?: string | null }) {
  if (!code) return <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>—</span>;
  const m: Record<string, [string, string]> = {
    Passed:    ["rgba(74,222,128,0.12)",  "#4ade80"],
    Failed:    ["rgba(239,68,68,0.12)",   "#f87171"],
    Broken:    ["rgba(167,139,250,0.12)", "#c4b5fd"],
    Inconclusive: ["rgba(245,158,11,0.12)", "#fbbf24"],
    Skipped:   ["rgba(255,255,255,0.06)", "#888"],
  };
  const [bg, color] = m[code] ?? ["rgba(255,255,255,0.06)", "#aaa"];
  return <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 650, background: bg, color }}>{label ?? code}</span>;
}

export function StatusBadge({ code, label }: { code: string; label?: string | null }) {
  const m: Record<string, string> = {
    pending: "#fbbf24", running: "#60a5fa", completed: "#4ade80",
    failed: "#f87171", cancelled: "#888",
  };
  const lc = code.toLowerCase();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: m[lc] ?? "#aaa" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m[lc] ?? "#aaa", animation: lc === "running" ? "dotP 1.8s ease-in-out infinite" : "none" }} />
      {label ?? code}
    </span>
  );
}
