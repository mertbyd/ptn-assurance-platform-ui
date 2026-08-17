"use client";

import { FileJson2, Plus, RefreshCw, WifiOff } from "lucide-react";
import { useState } from "react";

import type { SpecDocumentDto, SpecDocumentMonitoringDto, SpecSourceDto, SpecSourceReachabilityDto } from "@/api/sources.api";
import { usePermissionsQuery } from "@/features/permissions";
import { getApiErrorMessage } from "@/i18n/error-messages";
import { t } from "@/i18n/tr";
import { ApiRequestError } from "@/lib/api-request-error";
import { emptyGrantedPermissions, hasPermission, Permissions } from "@/lib/permissions";

import { usePassivateSourceMutation, useSourcesQuery, useTestSourceMutation } from "../hooks/use-source-queries";
import { PassivateSourceDialog } from "./passivate-source-dialog";
import { MonitoringDialog } from "./monitoring-dialog";
import { SourceCard } from "./source-card";
import { SourceFormDialog } from "./source-form-dialog";

const pageSize = 12;

/* ── primitives ──────────────────────────────────────────────────── */

const ACC = "#e84040";

function Spin() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(255,255,255,0.3)"
      strokeWidth="2"
      strokeLinecap="round"
      style={{ animation: "spin .85s linear infinite", flexShrink: 0 }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "72px 0" }}>
      <Spin />
    </div>
  );
}

function Empty({
  title,
  hint,
  cta,
}: {
  title: string;
  hint?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "64px 20px",
        textAlign: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.18)",
        }}
      >
        <FileJson2 size={20} strokeWidth={1.4} />
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
        {title}
      </div>
      {hint && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>{hint}</div>
      )}
      {cta}
    </div>
  );
}

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      style={{
        background: "rgba(239,68,68,0.07)",
        border: "1px solid rgba(239,68,68,0.18)",
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <WifiOff size={15} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 650, color: "#f87171", marginBottom: 2 }}>
          {t.sources.loadErrorTitle}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
          {message}
        </div>
      </div>
      <button
        onClick={onRetry}
        style={{
          all: "unset",
          cursor: "pointer",
          padding: "4px 10px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          background: "rgba(239,68,68,0.1)",
          color: "#f87171",
          border: "1px solid rgba(239,68,68,0.2)",
          flexShrink: 0,
        }}
      >
        Yeniden dene
      </button>
    </div>
  );
}

function Btn({
  label,
  icon: Icon,
  onClick,
  variant = "ghost",
  disabled,
}: {
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: {
      background: ACC,
      color: "#fff",
      boxShadow: `0 2px 12px ${ACC}44`,
      fontWeight: 700,
    },
    ghost: {
      background: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.55)",
      border: "1px solid rgba(255,255,255,0.09)",
    },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        all: "unset",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: 32,
        padding: "0 14px",
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 580,
        opacity: disabled ? 0.45 : 1,
        transition: "opacity 130ms",
        ...styles[variant],
      }}
    >
      {Icon && <Icon size={13} strokeWidth={1.9} />}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════════════════════ */

export function SourcesPageView() {
  const [page, setPage] = useState(0);
  const [editingSource, setEditingSource] = useState<SpecSourceDto>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [passivatingSource, setPassivatingSource] = useState<SpecSourceDto>();
  const [reachabilityMap, setReachabilityMap] = useState<
    Record<string, SpecSourceReachabilityDto>
  >({});
  const [monitoringMap, setMonitoringMap] = useState<
    Record<string, SpecDocumentMonitoringDto>
  >({});
  const [monitoringTarget, setMonitoringTarget] = useState<{
    document: SpecDocumentDto;
    sourceId: string;
  }>();

  const sourcesQuery = useSourcesQuery(page * pageSize, pageSize);
  const passivateMutation = usePassivateSourceMutation();
  const testMutation = useTestSourceMutation();
  const { data: granted = emptyGrantedPermissions } = usePermissionsQuery();
  const canManage = hasPermission(granted, Permissions.sources.manage);
  const items = sourcesQuery.data?.items ?? [];
  const totalCount = sourcesQuery.data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / pageSize);
  const hasNextPage = (page + 1) * pageSize < totalCount;

  const openCreate = () => { setEditingSource(undefined); setIsFormOpen(true); };
  const openEdit = (source: SpecSourceDto) => { setEditingSource(source); setIsFormOpen(true); };
  const confirmPassivate = async () => {
    if (!passivatingSource?.id) return;
    try {
      await passivateMutation.mutateAsync(passivatingSource.id);
      setPassivatingSource(undefined);
    } catch { /* error shown via requestError */ }
  };
  const testSource = async (source: SpecSourceDto) => {
    if (!source.id) return;
    try {
      const result = await testMutation.mutateAsync(source.id);
      setReachabilityMap((prev) => ({ ...prev, [source.id!]: result }));
    } catch { /* error shown via requestError */ }
  };

  const requestError =
    (sourcesQuery.error ?? passivateMutation.error ?? testMutation.error) instanceof
    ApiRequestError
      ? ((sourcesQuery.error ??
          passivateMutation.error ??
          testMutation.error) as ApiRequestError)
      : null;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ padding: "28px 32px" }}>
        {/* ── Header ─────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: "#eaedf4",
                letterSpacing: "-0.025em",
              }}
            >
              {t.sources.title}
            </h2>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12.5,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {t.sources.description}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Btn
              label="Yenile"
              icon={RefreshCw}
              onClick={() => void sourcesQuery.refetch()}
            />
            <Btn
              label={t.sources.actions.add}
              icon={Plus}
              variant="primary"
              disabled={!canManage}
              onClick={openCreate}
            />
          </div>
        </div>

        {/* ── Error banner ────────────────────────────────── */}
        {requestError && (
          <div style={{ marginBottom: 20 }}>
            <ErrorBanner
              message={getApiErrorMessage(requestError)}
              onRetry={() => void sourcesQuery.refetch()}
            />
          </div>
        )}

        {/* ── Content ─────────────────────────────────────── */}
        {sourcesQuery.isPending ? (
          <Loading />
        ) : items.length === 0 ? (
          <div
            style={{
              background: "#131620",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <Empty
              title={t.sources.empty.title}
              hint={t.sources.empty.description}
              cta={
                <Btn
                  label={t.sources.actions.add}
                  icon={Plus}
                  variant="primary"
                  disabled={!canManage}
                  onClick={openCreate}
                />
              }
            />
          </div>
        ) : (
          <>
            {/* Card grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
                gap: 12,
              }}
            >
              {items.map((source) => {
                const reachability = source.id
                  ? reachabilityMap[source.id]
                  : undefined;
                return (
                  <SourceCard
                    key={source.id ?? source.name}
                    canManage={canManage}
                    isPassivating={
                      passivateMutation.isPending &&
                      passivatingSource?.id === source.id
                    }
                    isTesting={
                      testMutation.isPending &&
                      testMutation.variables === source.id
                    }
                    monitoring={monitoringMap}
                    onConfigureMonitoring={(document) =>
                      source.id &&
                      setMonitoringTarget({ document, sourceId: source.id })
                    }
                    onEdit={() => openEdit(source)}
                    onPassivate={() => setPassivatingSource(source)}
                    onTest={() => void testSource(source)}
                    reachability={reachability}
                    source={source}
                  />
                );
              })}
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 14,
                  fontSize: 12,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.28)" }}>
                  {t.sources.pagination(totalCount)}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((v) => v - 1)}
                    style={{
                      all: "unset",
                      cursor: page === 0 ? "not-allowed" : "pointer",
                      padding: "4px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.06)",
                      color:
                        page === 0
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {t.sources.previous}
                  </button>
                  <button
                    disabled={!hasNextPage}
                    onClick={() => setPage((v) => v + 1)}
                    style={{
                      all: "unset",
                      cursor: !hasNextPage ? "not-allowed" : "pointer",
                      padding: "4px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.06)",
                      color: !hasNextPage
                        ? "rgba(255,255,255,0.2)"
                        : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {t.sources.next}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────── */}
      <SourceFormDialog
        onClose={() => setIsFormOpen(false)}
        open={isFormOpen}
        source={editingSource}
      />
      <PassivateSourceDialog
        isPending={passivateMutation.isPending}
        onClose={() => setPassivatingSource(undefined)}
        onConfirm={() => void confirmPassivate()}
        source={passivatingSource}
      />
      <MonitoringDialog
        onClose={() => setMonitoringTarget(undefined)}
        onSaved={(documentId, result) =>
          setMonitoringMap((current) => ({ ...current, [documentId]: result }))
        }
        target={monitoringTarget}
      />
    </>
  );
}
