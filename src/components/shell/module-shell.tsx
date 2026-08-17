"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getSessionIdentity } from "@/lib/session-identity";
import { FloatingAgent } from "@/components/ui/floating-agent";
import type { AgentConversationController, AgentState } from "@/components/ui/floating-agent";

export interface TabDef { key: string; label: string; count?: number; }

/*
  ActivePill — sliding capsule like piton.com.tr nav.

  The pill is always in the DOM (never conditionally removed).
  This is critical: if we unmount/remount the div, the browser
  has no "previous position" to animate from — the slide disappears.

  Layout:
    <header>  height=54px, alignItems=center
      <NavTrack>  height=38px, rounded, faint bg  ← the "track"
        <ActivePill />   ← slides inside the track
        <button> · <button> · <button>   ← tabs, z-index above pill
      </NavTrack>
    </header>
*/
function ActivePill({
  navRef,
  activeKey,
  acc,
}: {
  navRef: React.RefObject<HTMLElement | null>;
  activeKey: string;
  acc: string;
}) {
  const [pos, setPos] = useState<{ left: number; width: number } | null>(null);

  const measure = () => {
    const nav = navRef.current;
    if (!nav) return;
    const btn = nav.querySelector<HTMLElement>(`[data-tabkey="${activeKey}"]`);
    if (!btn) return;
    const nr = nav.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPos({ left: br.left - nr.left, width: br.width });
  };

  useLayoutEffect(() => { measure(); }, [activeKey]); // eslint-disable-line
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(measure));
    return () => cancelAnimationFrame(id);
  }, [activeKey]); // eslint-disable-line

  return (
    <div
      aria-hidden
      data-active-pill
      style={{
        position: "absolute",
        top: "50%",
        left: 0,
        /* translateX moves horizontally, translateY centers vertically */
        transform: `translateX(${pos?.left ?? 0}px) translateY(-50%)`,
        width: pos?.width ?? 0,
        /* pill height = track height - 4px padding top+bottom */
        height: 34,
        background: acc,
        borderRadius: 8,
        opacity: pos ? 1 : 0,
        pointerEvents: "none",
        zIndex: 0,
        boxShadow: `0 2px 14px ${acc}55`,
        transition:
          "transform 240ms cubic-bezier(0.4,0,0.2,1)," +
          "width 240ms cubic-bezier(0.4,0,0.2,1)," +
          "opacity 140ms ease",
        willChange: "transform, width",
      }}
    />
  );
}

export interface ModuleShellProps {
  mod: "api" | "db" | "test" | "team" | "settings";
  name: string;
  tabs: TabDef[];
  tab: string;
  onTab: (k: string) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** FloatingAgent — sadece test modülünde varsayılan olarak aktif, diğer modüllerde false geçilebilir */
  showAgent?: boolean;
  agentState?: AgentState;
  agentTitle?: string;
  onAgentSend?: (text: string) => Promise<string>;
  agentConversation?: AgentConversationController;
}

const MOD = {
  api:      { acc: "#e84040", dim: "rgba(232,64,64,0.13)",  border: "rgba(232,64,64,0.20)",  text: "#fff" },
  db:       { acc: "#2d90f5", dim: "rgba(45,144,245,0.13)", border: "rgba(45,144,245,0.20)", text: "#fff" },
  test:     { acc: "#f0a020", dim: "rgba(240,160,32,0.13)", border: "rgba(240,160,32,0.20)", text: "#0d0f14" },
  team:     { acc: "#8b5cf6", dim: "rgba(139,92,246,0.13)", border: "rgba(139,92,246,0.20)", text: "#fff" },
  settings: { acc: "#10b981", dim: "rgba(16,185,129,0.13)", border: "rgba(16,185,129,0.20)", text: "#fff" },
} as const;

export function ModuleShell({ mod, name, tabs, tab, onTab, actions, children, showAgent, agentState, agentTitle, onAgentSend, agentConversation }: ModuleShellProps) {
  const router   = useRouter();
  const { session, logout } = useAuthStore();
  const identity = getSessionIdentity(session, "Kullanıcı");
  const m        = MOD[mod];
  const [acct, setAcct] = useState(false);
  const acctRef  = useRef<HTMLDivElement>(null);
  const navRef   = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!acct) return;
    const h = (e: MouseEvent) => {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setAcct(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [acct]);

  return (
    <div data-module={mod} style={{
      minHeight: "100dvh",
      background: "#0d0f14",
      fontFamily: "'Inter Variable',Inter,system-ui,sans-serif",
      color: "#dde1ea",
      fontSize: 15,
    }}>

      {/* ── TOPBAR ──────────────────────────────────────
          alignItems: center  →  everything is vertically
          centered. Logo/module have their own height:100%
          for the divider lines, but content is centered.
      ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: 54,
        background: "rgba(13,15,20,0.96)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${m.border}`,
        display: "flex",
        alignItems: "center",   /* ← center, NOT stretch */
        zIndex: 200,
      }}>

        {/* Logo */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "0 18px",
          height: "100%",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
          cursor: "pointer",
        }} onClick={() => router.push("/home")}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.7"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg,#4f90e6,#2d6bc4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: "#fff",
            boxShadow: "0 0 14px rgba(79,144,230,0.45)",
            flexShrink: 0,
          }}>PT</div>
          <span style={{ fontSize: 14.5, fontWeight: 650, color: "rgba(255,255,255,0.55)" }}>PTN</span>
        </div>

        {/* Module name */}
        <div style={{
          display: "flex", alignItems: "center",
          padding: "0 16px",
          height: "100%",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}>
          <span style={{
            padding: "4px 12px", borderRadius: 7,
            fontSize: 13, fontWeight: 660,
            background: m.dim, color: m.acc,
          }}>{name}</span>
        </div>

        {/* ── NAV TRACK ──
            38px yüksekliğinde, hafif arka planlı, köşe yuvarlak
            bir "tepsi". Topbar 54px, tepsi 38px → her iki yanda
            (54-38)/2 = 8px boşluk → pill topbara yapışık değil.
        ── */}
        <nav
          ref={navRef as React.RefObject<HTMLElement>}
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            position: "relative",
            height: 38,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 10,
            padding: "0 2px",
            margin: "0 12px",
          }}
        >
          {/* Sliding pill — NEVER removed from DOM */}
          <ActivePill
            navRef={navRef as React.RefObject<HTMLElement>}
            activeKey={tab}
            acc={m.acc}
          />

          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                data-tabkey={t.key}
                onClick={() => onTab(t.key)}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "0 16px",
                  height: 34,            /* same as pill height */
                  fontSize: 14,
                  fontWeight: active ? 650 : 430,
                  color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  position: "relative",
                  zIndex: 1,             /* above pill */
                  borderRadius: 8,
                  transition: "color 220ms ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
                }}
              >
                {t.label}
                {t.count !== undefined && (
                  <span style={{
                    fontSize: 11, fontWeight: 650,
                    padding: "1px 6px", borderRadius: 999,
                    background: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                    color: active ? "#fff" : "rgba(255,255,255,0.35)",
                    transition: "background 220ms, color 220ms",
                  }}>{t.count}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: actions + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0 }}>
          {actions}
          <div ref={acctRef} style={{ position: "relative" }}>
            <button onClick={() => setAcct((v) => !v)} style={{
              all: "unset", cursor: "pointer",
              width: 34, height: 34, borderRadius: "50%",
              background: m.acc, color: m.text,
              fontSize: 12, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 0 0 2px ${m.acc}44`,
              transition: "box-shadow 150ms",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 3px ${m.acc}66`; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 2px ${m.acc}44`; }}
            >
              {identity.initials}
            </button>

            {acct && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                minWidth: 200, background: "#181b26",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, padding: 6,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                zIndex: 400,
                animation: "msDropIn 160ms ease both",
              }}>
                <style>{`@keyframes msDropIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
                <div style={{ padding: "8px 12px 10px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.82)" }}>{identity.displayName}</div>
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>Operatör</div>
                </div>
                {[
                  { label: "Modül Değiştir", fn: () => { setAcct(false); router.push("/home"); } },
                  { label: "Çıkış Yap", fn: async () => { setAcct(false); await logout(); router.push("/"); }, danger: true },
                ].map((item) => (
                  <button key={item.label} onClick={item.fn} style={{
                    all: "unset", display: "block", width: "100%",
                    padding: "9px 12px", fontSize: 14, borderRadius: 8, cursor: "pointer",
                    color: item.danger ? "#f87171" : "rgba(255,255,255,0.55)",
                    transition: "background 100ms, color 100ms",
                  }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = item.danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.07)";
                      el.style.color = item.danger ? "#f87171" : "rgba(255,255,255,0.9)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "transparent";
                      el.style.color = item.danger ? "#f87171" : "rgba(255,255,255,0.55)";
                    }}
                  >{item.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main style={{ marginTop: 54, minHeight: "calc(100dvh - 54px)" }}>
        {children}
      </main>

      {/* ── FLOATING AGENT — test modülünde varsayılan açık, prop ile kontrol edilebilir ── */}
      {(showAgent ?? mod === "test") && (
        <FloatingAgent
          conversation={agentConversation}
          state={agentState}
          title={agentTitle ?? (mod === "test" ? "Test Agent" : "PTN Agent")}
          onSend={onAgentSend}
        />
      )}
    </div>
  );
}
