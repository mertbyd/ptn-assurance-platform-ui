"use client";

import { Activity, Download, FlaskConical, Play, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { testApi } from "@/api/test";
import type { TestRunHeaderDto } from "@/api/test";
import { extractUserMessage } from "@/lib/error-messages";
import { ACC, Btn, Card, Empty, Loading, OutcomeBadge, StatusBadge } from "./primitives";
import { useTestLookups, type TestLookupLabels } from "./use-test-lookups";

const PAGE_SIZE = 25;

/* ─── Run report drawer ───────────────────────────────── */
function RunReportPanel({ runId, onClose }: { runId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["test-run-report", runId],
    queryFn: () => testApi.runs.getReport(runId),
    refetchInterval: (query) => {
      const d = query.state.data;
      return d?.outcomeCode ? false : 3000;
    },
  });

  const qc = useQueryClient();
  const [artifactBusy, setArtifactBusy] = useState<string | null>(null);
  const [artifactError, setArtifactError] = useState<string | null>(null);
  const [contradictionChoice, setContradictionChoice] = useState<string | null>(null);

  const { data: contradiction } = useQuery({
    queryKey: ["test-run-contradiction", runId],
    queryFn: () => testApi.runs.getDryRunContradiction(runId),
    enabled: Boolean(data?.run.isDryRun && data?.outcomeCode),
  });

  const cancelMut = useMutation({
    mutationFn: () => testApi.runs.cancel(runId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["test-run-report", runId] }); },
  });

  function download(content: string, contentType: string, name: string) {
    const url = URL.createObjectURL(new Blob([content], { type: contentType }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; anchor.click();
    URL.revokeObjectURL(url);
  }

  async function exportArtifact(format: "Ctrf" | "JUnit" | "Sarif") {
    if (!data?.result) return;
    setArtifactBusy(format); setArtifactError(null);
    try {
      await testApi.runs.export(runId);
      const artifact = await testApi.runs.getArtifactContent(data.result.id, format);
      download(artifact.content, artifact.contentType, artifact.blobName || `${data.run.testKey}.${format.toLowerCase()}`);
    } catch (error) { setArtifactError(extractUserMessage(error, `${format} artefaktı indirilemedi.`)); }
    finally { setArtifactBusy(null); }
  }

  async function downloadHar() {
    if (!data?.run.harBlobName) return;
    setArtifactBusy("HAR"); setArtifactError(null);
    try {
      const artifact = await testApi.runs.getHar(runId);
      download(artifact.content, artifact.contentType, artifact.blobName || `${data.run.testKey}.har`);
    } catch (error) { setArtifactError(extractUserMessage(error, "HAR indirilemedi.")); }
    finally { setArtifactBusy(null); }
  }

  return (
    <div style={{ position: "fixed", top: 48, right: 0, bottom: 0, width: "min(680px,100vw)", background: "#131620", borderLeft: "1px solid rgba(255,255,255,0.08)", zIndex: 300, display: "flex", flexDirection: "column", animation: "slideIn 200ms ease" }}>
      <style>{`@keyframes slideIn{from{transform:translateX(30px);opacity:0;}to{transform:translateX(0);opacity:1;}}`}</style>

      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <Activity size={14} color={ACC} />
        <span style={{ fontSize: 13, fontWeight: 650, color: "#e0e4f0", flex: 1 }}>Koşum Raporu</span>
        {!data?.outcomeCode && (
          <Btn label="İptal Et" variant="danger-dim" small loading={cancelMut.isPending} onClick={() => cancelMut.mutate()} />
        )}
        {data?.result ? <><Btn label="CTRF" icon={Download} small loading={artifactBusy === "Ctrf"} onClick={() => void exportArtifact("Ctrf")} /><Btn label="JUnit" icon={Download} small loading={artifactBusy === "JUnit"} onClick={() => void exportArtifact("JUnit")} /><Btn label="SARIF" icon={Download} small loading={artifactBusy === "Sarif"} onClick={() => void exportArtifact("Sarif")} /></> : null}
        {data?.run.harBlobName ? <Btn label="HAR" icon={Download} small loading={artifactBusy === "HAR"} onClick={() => void downloadHar()} /> : null}
        <button onClick={onClose} style={{ all: "unset", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex" }}><X size={16} /></button>
      </div>

      {isLoading ? <Loading /> : !data ? (
        <Empty icon={FlaskConical} title="Rapor yok" />
      ) : (
        <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
          {/* Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "#0d0f14", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.07em", marginBottom: 5 }}>HÜKÜM</div>
              <OutcomeBadge code={data.outcomeCode} />
              {data.isHealed && <span style={{ marginLeft: 8, fontSize: 10.5, color: "#4ade80" }}>✓ Onarıldı</span>}
            </div>
            <div style={{ background: "#0d0f14", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.07em", marginBottom: 5 }}>ÖNCEKİ</div>
              <OutcomeBadge code={data.previousOutcomeCode} />
            </div>
          </div>

          {/* Run meta */}
          <div style={{ marginBottom: 16, fontSize: 12, color: "rgba(255,255,255,0.35)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Ortam: </span>{data.run.environmentKey}</div>
            <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Test key: </span><code style={{ fontFamily: "monospace" }}>{data.run.testKey}</code></div>
            {data.run.startedAt && <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Başladı: </span>{new Date(data.run.startedAt).toLocaleString("tr-TR")}</div>}
            {data.run.completedAt && <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Tamamlandı: </span>{new Date(data.run.completedAt).toLocaleString("tr-TR")}</div>}
            {data.run.traceId && <div><span style={{ color: "rgba(255,255,255,0.25)" }}>Trace: </span><code style={{ fontFamily: "monospace", fontSize: 11 }}>{data.run.traceId}</code></div>}
          </div>
          {artifactError ? <div style={{ marginBottom: 12, color: "#f87171", fontSize: 11.5 }}>{artifactError}</div> : null}

          {contradiction?.hasContradiction ? (
            <div style={{ marginBottom: 16, padding: 12, border: "1px solid rgba(251,191,36,.25)", borderRadius: 9, background: "rgba(251,191,36,.06)" }}>
              <strong style={{ color: "#fbbf24", fontSize: 12 }}>Kuru koşum çelişkisi — insan kararı</strong>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: 11.5, lineHeight: 1.5 }}>{contradiction.observation}</p>
              <code style={{ display: "block", color: "rgba(255,255,255,.38)", fontSize: 10 }}>{contradiction.location} · {contradiction.contract}</code>
              <div style={{ display: "flex", gap: 7, marginTop: 10 }}><Btn label="Senaryo yanlış" small variant={contradictionChoice === "scenario" ? "primary" : "ghost"} onClick={() => setContradictionChoice("scenario")} /><Btn label="Bu gerçek bir hata" small variant={contradictionChoice === "defect" ? "primary" : "ghost"} onClick={() => setContradictionChoice("defect")} /></div>
              <small style={{ display: "block", marginTop: 8, color: "rgba(255,255,255,.32)" }}>Agent assertion&apos;ı zayıflatmaz; karar yalnız inceleme bağlamında tutulur.</small>
            </div>
          ) : null}

          {data.result?.diagnosisReport ? <div style={{ marginBottom: 16, padding: 12, border: "1px solid rgba(255,255,255,.07)", borderRadius: 9, background: "#0d0f14" }}><strong style={{ color: "rgba(255,255,255,.6)", fontSize: 11.5 }}>Teşhis raporu</strong><pre style={{ color: "rgba(255,255,255,.42)", whiteSpace: "pre-wrap", font: "10.5px/1.5 ui-monospace,monospace" }}>{data.result.diagnosisReport}</pre></div> : null}

          {/* Findings */}
          {data.result?.findings && data.result.findings.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
                Bulgular ({data.result.findings.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.result.findings.map((f) => (
                  <div key={f.id} style={{ background: "#0d0f14", borderRadius: 8, padding: "10px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: f.expectedValue || f.observedValue ? 8 : 0 }}>
                      <span style={{ fontSize: 10.5, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", fontFamily: "monospace", flexShrink: 0 }}>{f.sourceCheckerCode}</span>
                      <span style={{ fontSize: 12.5, color: "#e0e4f0", lineHeight: 1.4 }}>{f.message}</span>
                    </div>
                    <code style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.35)", display: "block", marginBottom: 4 }}>{f.location}</code>
                    {(f.expectedValue || f.observedValue) && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        {f.expectedValue && <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4ade80" }}>✓ beklenen: {f.expectedValue}</div>}
                        {f.observedValue && <div style={{ fontFamily: "monospace", fontSize: 11, color: "#f87171" }}>✗ gözlenen: {f.observedValue}</div>}
                      </div>
                    )}
                    {f.evidenceSummary && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4, fontStyle: "italic" }}>{f.evidenceSummary}</div>}
                    {f.observedAtMs != null && <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>@{f.observedAtMs}ms{f.attemptCount ? `, ${f.attemptCount} deneme` : ""}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.result && data.result.findings.length === 0 && data.outcomeCode === "Passed" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 8 }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 600 }}>Tüm assertion&apos;lar geçti</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Run row ─────────────────────────────────────────── */
function RunRow({ run, onOpen, lookups }: { run: TestRunHeaderDto; onOpen: (id: string) => void; lookups: TestLookupLabels }) {
  const durationSec = run.durationMs != null ? (run.durationMs / 1000).toFixed(1) : null;

  return (
    <tr
      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
      onClick={() => onOpen(run.id)}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <td style={{ padding: "11px 16px" }}>
        <code style={{ fontFamily: "monospace", fontSize: 12, color: ACC }}>{run.testKey}</code>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{run.environmentKey}</div>
      </td>
      <td style={{ padding: "11px 16px" }}><StatusBadge code={run.runStatusCode} label={lookups.nameByCode(run.runStatusCode)} /></td>
      <td style={{ padding: "11px 16px" }}><OutcomeBadge code={run.outcomeCode} label={lookups.nameByCode(run.outcomeCode)} /></td>
      <td style={{ padding: "11px 16px" }}>
        <span style={{ fontSize: 12, color: run.findingCount > 0 ? "#fbbf24" : "rgba(255,255,255,0.28)" }}>{run.findingCount}</span>
      </td>
      <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.35)", fontSize: 11.5 }}>
        {durationSec ? `${durationSec}s` : "—"}
      </td>
      <td style={{ padding: "11px 16px" }}>
        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>{lookups.nameByCode(run.triggerKindCode) ?? run.triggerKindCode}</span>
        {run.isDryRun && <span style={{ marginLeft: 5, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>dry-run</span>}
      </td>
      <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.28)", fontSize: 11.5 }}>
        {run.startedAt ? new Date(run.startedAt).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" }) : "—"}
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════════ */
export function TabRuns({ initialScenarioId }: { initialScenarioId?: string }) {
  const [page, setPage] = useState(0);
  const [outcomeFilter, setOutcomeFilter] = useState("");
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [environmentKey, setEnvironmentKey] = useState("local");
  const [canonicalInputs, setCanonicalInputs] = useState("{}");
  const [isDryRun, setIsDryRun] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: selectedScenario } = useQuery({
    queryKey: ["test-scenario", initialScenarioId],
    queryFn: () => testApi.scenarios.get(initialScenarioId!),
    enabled: Boolean(initialScenarioId),
  });

  const lookups = useTestLookups();
  const { data: outcomes } = useQuery({
    queryKey: ["test-lookups", "outcomes"],
    queryFn: () => testApi.lookups.outcomeStatuses(),
  });

  const triggerMut = useMutation({
    mutationFn: async () => {
      if (!selectedScenario) throw new Error("Koşturulacak senaryo bulunamadı.");
      JSON.parse(canonicalInputs);
      return testApi.runs.trigger({
        scenarioId: selectedScenario.id,
        testKey: selectedScenario.scenarioKey,
        environmentKey: environmentKey.trim(),
        triggerKindCode: "Manual",
        canonicalInputs,
        specFingerprint: selectedScenario.specFingerprint,
        dbSchemaFingerprint: selectedScenario.dbSchemaFingerprint,
        isDryRun,
      });
    },
    onSuccess: async (run) => {
      setTriggerError(null);
      setOpenRunId(run.id);
      await queryClient.invalidateQueries({ queryKey: ["test-runs"] });
    },
    onError: (error) => setTriggerError(extractUserMessage(error, "Koşum tetiklenemedi.")),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["test-runs", "list", page, outcomeFilter, initialScenarioId],
    queryFn: () => testApi.runs.list({
      skipCount: outcomeFilter ? 0 : page * PAGE_SIZE,
      maxResultCount: outcomeFilter ? 1000 : PAGE_SIZE,
      scenarioId: initialScenarioId,
    }),
    refetchInterval: 5000, // auto-refresh while runs may be active
  });

  const matchingRuns = outcomeFilter
    ? (data?.items ?? []).filter((run) => run.outcomeCode === outcomeFilter)
    : (data?.items ?? []);
  const runs = outcomeFilter
    ? matchingRuns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : matchingRuns;
  const totalCount = outcomeFilter ? matchingRuns.length : (data?.totalCount ?? 0);
  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Koşumlar</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>
            Test koşum geçmişi. {initialScenarioId && <span style={{ color: ACC }}>Senaryo filtreli</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={outcomeFilter} onChange={(e) => { setOutcomeFilter(e.target.value); setPage(0); }} style={{ height: 32, padding: "0 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7, color: "#e0e4f0", fontSize: 12, fontFamily: "inherit", outline: "none", appearance: "none" }}>
            <option value="">Tüm Hükümler</option>
            {outcomes?.items.filter((item) => item.isActive).map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
          </select>
        </div>
      </div>

      {initialScenarioId && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", color: "rgba(255,255,255,.7)", fontSize: 12.5, fontWeight: 650 }}>Yeni manuel koşum · {selectedScenario?.title ?? "Senaryo yükleniyor"}</div>
          <div style={{ padding: 14, display: "grid", gridTemplateColumns: "180px 1fr auto auto", gap: 8, alignItems: "end" }}>
            <label style={{ display: "grid", gap: 4, color: "rgba(255,255,255,.45)", fontSize: 10.5 }}>Ortam anahtarı<input value={environmentKey} onChange={(e) => setEnvironmentKey(e.target.value)} style={{ height: 31, border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, background: "rgba(255,255,255,.04)", color: "#ddd", padding: "0 9px" }} /></label>
            <label style={{ display: "grid", gap: 4, color: "rgba(255,255,255,.45)", fontSize: 10.5 }}>Kanonik girdiler (JSON)<input value={canonicalInputs} onChange={(e) => setCanonicalInputs(e.target.value)} style={{ height: 31, border: "1px solid rgba(255,255,255,.09)", borderRadius: 7, background: "rgba(255,255,255,.04)", color: "#ddd", padding: "0 9px", fontFamily: "monospace" }} /></label>
            <label style={{ height: 31, display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,.48)", fontSize: 11 }}><input type="checkbox" checked={isDryRun} onChange={(e) => setIsDryRun(e.target.checked)} />dry-run</label>
            <Btn label="Koşumu tetikle" icon={Play} variant="primary" loading={triggerMut.isPending} disabled={!selectedScenario || !environmentKey.trim()} onClick={() => triggerMut.mutate()} />
          </div>
          {triggerError ? <div style={{ margin: "0 14px 12px", color: "#f87171", fontSize: 11.5 }}>{triggerError}</div> : null}
        </Card>
      )}

      <Card>
        {isLoading ? <Loading /> : isError ? (
          <Empty icon={Activity} title="API'ye ulaşılamadı" hint="Test modülü bağlantısını kontrol edin." />
        ) : runs.length === 0 ? (
          <Empty icon={FlaskConical} title="Koşum yok" hint="Henüz koşum kaydı bulunmuyor." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Test Key / Ortam", "Durum", "Hüküm", "Bulgu", "Süre", "Tetikleyici", "Başlangıç"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => <RunRow key={r.id} run={r} onOpen={setOpenRunId} lookups={lookups} />)}
            </tbody>
          </table>
        )}
      </Card>

      {pageCount > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.28)" }}>{totalCount} koşum · sayfa {page + 1}/{pageCount}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn label="← Önceki" disabled={page === 0} onClick={() => setPage((p) => p - 1)} small />
            <Btn label="Sonraki →" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} small />
          </div>
        </div>
      )}

      {/* Run detail drawer */}
      {openRunId && <RunReportPanel runId={openRunId} onClose={() => setOpenRunId(null)} />}
    </div>
  );
}
