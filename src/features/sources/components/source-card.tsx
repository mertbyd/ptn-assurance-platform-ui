import { Activity, Camera, Clock3, FileJson2, Loader2, Pencil, Power } from "lucide-react";
import Link from "next/link";

import type { SpecDocumentDto, SpecDocumentMonitoringDto, SpecSourceDto, SpecSourceReachabilityDto } from "@/api/sources.api";
import { getErrorCodeMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";

const ACC = "#e84040";

/* ── small inline helpers ──────────────────────────────────────── */

function Badge({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 650,
        background: bg,
        color,
        whiteSpace: "nowrap" as const,
      }}
    >
      {label}
    </span>
  );
}

function IconBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  loading,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        all: "unset",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        width: 30,
        height: 30,
        borderRadius: 7,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: danger ? "#f87171" : "rgba(255,255,255,0.35)",
        opacity: disabled ? 0.35 : 1,
        transition: "background 120ms, color 120ms",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          const el = e.currentTarget as HTMLElement;
          el.style.background = danger
            ? "rgba(239,68,68,0.1)"
            : "rgba(255,255,255,0.07)";
          el.style.color = danger ? "#f87171" : "rgba(255,255,255,0.75)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        el.style.color = danger ? "#f87171" : "rgba(255,255,255,0.35)";
      }}
    >
      {loading ? (
        <Loader2 size={14} style={{ animation: "spin .8s linear infinite" }} />
      ) : (
        <Icon size={14} strokeWidth={1.9} />
      )}
    </button>
  );
}

function WideBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  loading,
  variant = "outline",
  href,
}: {
  icon?: React.ElementType;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "outline" | "dark";
  href?: string;
}) {
  const base: React.CSSProperties = {
    all: "unset",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    height: 32,
    borderRadius: 8,
    fontSize: 12.5,
    fontWeight: 580,
    opacity: disabled ? 0.4 : 1,
    transition: "background 130ms, border-color 130ms",
    boxSizing: "border-box" as const,
    ...(variant === "outline"
      ? {
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.5)",
        }
      : {
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.07)",
          color: "rgba(255,255,255,0.45)",
        }),
  };

  const inner = (
    <>
      {loading ? (
        <Loader2 size={13} style={{ animation: "spin .8s linear infinite" }} />
      ) : Icon ? (
        <Icon size={13} strokeWidth={1.9} />
      ) : null}
      {label}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{ ...base, textDecoration: "none" }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(255,255,255,0.07)";
          el.style.borderColor = "rgba(255,255,255,0.18)";
          el.style.color = "rgba(255,255,255,0.75)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background =
            variant === "dark" ? "rgba(255,255,255,0.05)" : "transparent";
          el.style.borderColor =
            variant === "dark"
              ? "rgba(255,255,255,0.07)"
              : "rgba(255,255,255,0.1)";
          el.style.color =
            variant === "dark"
              ? "rgba(255,255,255,0.45)"
              : "rgba(255,255,255,0.5)";
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={base}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "rgba(255,255,255,0.07)";
          el.style.borderColor = "rgba(255,255,255,0.18)";
          el.style.color = "rgba(255,255,255,0.75)";
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background =
          variant === "dark" ? "rgba(255,255,255,0.05)" : "transparent";
        el.style.borderColor =
          variant === "dark"
            ? "rgba(255,255,255,0.07)"
            : "rgba(255,255,255,0.1)";
        el.style.color =
          variant === "dark"
            ? "rgba(255,255,255,0.45)"
            : "rgba(255,255,255,0.5)";
      }}
    >
      {inner}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SourceCard
═══════════════════════════════════════════════════════════════════ */

export function SourceCard({
  canManage,
  isPassivating,
  isTesting,
  onEdit,
  onConfigureMonitoring,
  onPassivate,
  onTest,
  reachability,
  monitoring,
  source,
}: {
  canManage: boolean;
  isPassivating: boolean;
  isTesting: boolean;
  onEdit: () => void;
  onConfigureMonitoring: (document: SpecDocumentDto) => void;
  onPassivate: () => void;
  onTest: () => void;
  reachability?: SpecSourceReachabilityDto;
  monitoring: Record<string, SpecDocumentMonitoringDto>;
  source: SpecSourceDto;
}) {
  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <article
        aria-label={t.sources.cardLabel(source.name ?? "")}
        style={{
          background: "#131620",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          transition:
            "border-color 180ms ease-out, transform 220ms cubic-bezier(0.16,1,0.3,1)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = `${ACC}44`;
          el.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "rgba(255,255,255,0.07)";
          el.style.transform = "translateY(0)";
        }}
      >
        {/* ── Top row: name + status + actions ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap" as const,
              }}
            >
              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 750,
                  color: "#eaedf4",
                  letterSpacing: "-0.02em",
                }}
              >
                {source.name}
              </span>
              <Badge
                label={source.isActive ? t.sources.status.active : t.sources.status.passive}
                color={source.isActive ? "#4ade80" : "rgba(255,255,255,0.35)"}
                bg={
                  source.isActive
                    ? "rgba(74,222,128,0.1)"
                    : "rgba(255,255,255,0.06)"
                }
              />
            </div>
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.35)",
                marginTop: 3,
                wordBreak: "break-all" as const,
              }}
            >
              {source.baseUrl}
            </div>
          </div>

          <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
            <IconBtn
              icon={Pencil}
              label={t.sources.actions.edit}
              disabled={!canManage || !source.isActive}
              onClick={onEdit}
            />
            <IconBtn
              icon={Power}
              label={t.sources.actions.passivate}
              disabled={!canManage || !source.isActive}
              loading={isPassivating}
              onClick={onPassivate}
              danger
            />
          </div>
        </div>

        {/* ── Document list ── */}
        {(source.documents ?? []).length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              marginTop: 16,
            }}
          >
            {(source.documents ?? []).map((document) => {
              const mon = document.id ? monitoring[document.id] : undefined;
              return (
                <div
                  key={document.id ?? document.documentName}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <FileJson2
                    aria-hidden
                    size={15}
                    color={ACC}
                    style={{ flexShrink: 0 }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 650,
                        color: "#e0e4f0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {document.documentName}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.28)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      {document.path}
                    </div>
                  </div>

                  {/* monitoring badge */}
                  {mon && (
                    <Badge
                      label={
                        mon.isMonitored
                          ? t.sources.monitoring.scheduled
                          : t.sources.monitoring.disabled
                      }
                      color={mon.isMonitored ? "#a78bfa" : "rgba(255,255,255,0.3)"}
                      bg={
                        mon.isMonitored
                          ? "rgba(167,139,250,0.1)"
                          : "rgba(255,255,255,0.05)"
                      }
                    />
                  )}

                  {/* active/passive badge */}
                  <Badge
                    label={
                      document.isActive
                        ? t.sources.status.documentActive
                        : t.sources.status.documentPassive
                    }
                    color={
                      document.isActive ? "var(--acc)" : "rgba(255,255,255,0.28)"
                    }
                    bg={
                      document.isActive
                        ? "rgba(96,165,250,0.1)"
                        : "rgba(255,255,255,0.05)"
                    }
                  />

                  <IconBtn
                    icon={Clock3}
                    label={t.sources.monitoring.action(document.documentName ?? "")}
                    disabled={!canManage || !document.isActive}
                    onClick={() => onConfigureMonitoring(document)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Reachability result ── */}
        {reachability && (
          <div
            role="status"
            style={{
              marginTop: 14,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              background: reachability.isReachable
                ? "rgba(74,222,128,0.07)"
                : "rgba(239,68,68,0.07)",
              border: `1px solid ${reachability.isReachable ? "rgba(74,222,128,0.18)" : "rgba(239,68,68,0.18)"}`,
              color: reachability.isReachable ? "#4ade80" : "#f87171",
              lineHeight: 1.5,
            }}
          >
            {reachability.isReachable
              ? t.sources.reachability.success(
                  reachability.testedDocumentCount ?? 0,
                  reachability.statusCode,
                )
              : getErrorCodeMessage(reachability.errorMessage || "RESULT_ERROR")}
          </div>
        )}

        {/* ── Action buttons ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 14,
          }}
        >
          <WideBtn
            icon={Activity}
            label={t.sources.actions.test}
            disabled={!canManage || !source.isActive}
            loading={isTesting}
            onClick={onTest}
            variant="outline"
          />
          {source.id && (
            <WideBtn
              icon={Camera}
              label={t.sources.actions.snapshots}
              href={`/api-contract/contracts?source=${source.id}`}
              variant="dark"
            />
          )}
        </div>
      </article>
    </>
  );
}
