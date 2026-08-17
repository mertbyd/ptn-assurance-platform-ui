"use client";

import { BookOpen, Clock, FlaskConical, Play, ShieldAlert, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { testApi } from "@/api/test";
import type { TestScenarioDto } from "@/api/test";
import { extractUserMessage } from "@/lib/error-messages";
import { ACC, Btn, Card, Empty, Loading } from "./primitives";
import { useTestLookups } from "./use-test-lookups";

const PAGE_SIZE = 25;

/* ─── State badge ─────────────────────────────────────── */
function StateBadge({ scenario, stateLabel }: { scenario: TestScenarioDto; stateLabel?: string | null }) {
  if (scenario.quarantineUntil) {
    const expired = new Date(scenario.quarantineUntil) < new Date();
    return (
      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 650, background: "rgba(245,158,11,0.1)", color: "#fbbf24" }}>
        {expired ? "Karantina (süresi doldu)" : `Karantina · ${new Date(scenario.quarantineUntil).toLocaleDateString("tr-TR")}`}
      </span>
    );
  }
  /* GUID EKRANA BASILMAZ: durum adı lookup satırından gelir. Satır çözülemezse kimliği
   * göstermek yerine çözülemediğini söyleriz (CURRENT-0007 §4). */
  return <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10.5, fontWeight: 650, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.55)" }}>{stateLabel ?? "durum çözülemedi"}</span>;
}

/* ─── Scenario row ────────────────────────────────────── */
function ScenarioRow({ s, onRun, stateLabel }: { s: TestScenarioDto; onRun: (id: string) => void; stateLabel?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [gateResult, setGateResult] = useState<{ isPublishable: boolean; failedGateCodes: string[]; warnings: string[] } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [quarantineUntil, setQuarantineUntil] = useState("");
  const [quarantineReason, setQuarantineReason] = useState(s.quarantineReason ?? "");
  const [scheduleCron, setScheduleCron] = useState(s.scheduleCron ?? "");
  const [scheduleEnabled, setScheduleEnabled] = useState(s.scheduleEnabled);
  const queryClient = useQueryClient();

  async function preparePublication() {
    if (!s.specSnapshotId) { setActionError("Derleme için API snapshot zorunludur."); return; }
    setIsWorking(true); setActionError(null); setGateResult(null);
    try {
      const preview = await testApi.scenarios.compilePreview(s.sourceDocument, s.specSnapshotId);
      if (!preview.isSchemaValid) {
        setGateResult({ isPublishable: false, failedGateCodes: ["SchemaValidity"], warnings: [preview.lintDiagnostics] });
        return;
      }
      await testApi.scenarios.submitForApproval(s.id);
      const decision = await testApi.scenarios.evaluatePublication(s.id);
      setGateResult(decision);
    } catch (error) {
      setActionError(extractUserMessage(error, "Yayın kapıları değerlendirilemedi."));
    } finally { setIsWorking(false); }
  }

  async function publish() {
    if (!gateResult?.isPublishable) return;
    setIsWorking(true); setActionError(null);
    try {
      await testApi.scenarios.publish(s.id);
      await queryClient.invalidateQueries({ queryKey: ["test-scenarios"] });
      setGateResult(null);
    } catch (error) {
      setActionError(extractUserMessage(error, "Senaryo yayınlanamadı."));
    } finally { setIsWorking(false); }
  }

  /* Katalog eylemleri: yayından kaldırma ve silme. Silme yalnız hiç koşulmamış taslak
   * için anlamlıdır; sunucu tarihsel senaryonun silinmesini kalıcı olarak reddeder ve
   * hata mesajı kullanıcıya olduğu gibi gösterilir. */
  async function deprecate() {
    setIsWorking(true); setActionError(null);
    try {
      await testApi.scenarios.deprecate(s.id);
      await queryClient.invalidateQueries({ queryKey: ["test-scenarios"] });
    } catch (error) { setActionError(extractUserMessage(error, "Senaryo kullanımdan kaldırılamadı.")); }
    finally { setIsWorking(false); }
  }

  async function remove() {
    if (!confirmingDelete) { setConfirmingDelete(true); return; }
    setIsWorking(true); setActionError(null);
    try {
      await testApi.scenarios.delete(s.id);
      await queryClient.invalidateQueries({ queryKey: ["test-scenarios"] });
    } catch (error) { setActionError(extractUserMessage(error, "Senaryo silinemedi.")); }
    finally { setIsWorking(false); setConfirmingDelete(false); }
  }

  async function saveSchedule() {
    setIsWorking(true); setActionError(null);
    try {
      await testApi.scenarios.schedule(s.id, scheduleCron.trim() || null, scheduleEnabled);
      await queryClient.invalidateQueries({ queryKey: ["test-scenarios"] });
    } catch (error) { setActionError(extractUserMessage(error, "Zamanlama kaydedilemedi.")); }
    finally { setIsWorking(false); }
  }

  async function toggleQuarantine() {
    setIsWorking(true); setActionError(null);
    try {
      if (s.quarantineUntil) await testApi.scenarios.releaseQuarantine(s.id);
      else {
        if (!quarantineUntil) throw new Error("Karantina bitiş zamanını seçin.");
        await testApi.scenarios.quarantine(s.id, new Date(quarantineUntil).toISOString(), quarantineReason.trim() || null);
      }
      await queryClient.invalidateQueries({ queryKey: ["test-scenarios"] });
    } catch (error) { setActionError(extractUserMessage(error, "Karantina değiştirilemedi.")); }
    finally { setIsWorking(false); }
  }

  return (
    <>
      <tr
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}
      onClick={() => setExpanded((v) => !v)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.025)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <td style={{ padding: "11px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <code style={{ fontFamily: "monospace", fontSize: 12, color: ACC }}>{s.scenarioKey}</code>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>v{s.versionNo}</span>
            {s.authoredByAgent && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>AI</span>}
          </div>
          <div style={{ fontSize: 12.5, color: "#e0e4f0", marginTop: 2 }}>{s.title}</div>
        </td>
        <td style={{ padding: "11px 16px" }}>
          <StateBadge scenario={s} stateLabel={stateLabel} />
        </td>
        <td style={{ padding: "11px 16px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {s.specSnapshotId && <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 3 }}><ShieldCheck size={11} />API</span>}
            {s.dbConnectionId && <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 3 }}><ShieldCheck size={11} />DB</span>}
            <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>{s.assertionCount} assert</span>
          </div>
        </td>
        <td style={{ padding: "11px 16px" }}>
          {s.scheduleCron && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: s.scheduleEnabled ? ACC : "rgba(255,255,255,0.28)" }}>
              <Clock size={11} />
              {s.scheduleEnabled ? s.scheduleCron : "devre dışı"}
            </span>
          )}
        </td>
        <td style={{ padding: "11px 16px" }}>
          <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
            <Btn label="Koş" icon={Play} variant="accent-dim" small onClick={() => onRun(s.id)} />
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <td colSpan={5} style={{ padding: "8px 16px 14px", background: "rgba(255,255,255,0.015)" }}>
            {s.description && <p style={{ margin: "0 0 8px", fontSize: 12.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>{s.description}</p>}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, fontSize: 11.5, color: "rgba(255,255,255,0.3)" }}>
              {s.specSnapshotId && <span>API Snapshot: <code style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.45)" }}>{s.specSnapshotId.slice(0, 8)}</code></span>}
              {s.dbConnectionId && <span>DB Bağlantı: <code style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.45)" }}>{s.dbConnectionId.slice(0, 8)}</code></span>}
              {s.rulesFingerprint && <span>Rules: <code style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.45)" }}>{s.rulesFingerprint.slice(0, 8)}</code></span>}
              {s.approvedAt && <span>Onay: {new Date(s.approvedAt).toLocaleDateString("tr-TR")}</span>}
            </div>
            {s.quarantineReason && (
              <div style={{ marginTop: 6, padding: "6px 10px", background: "rgba(245,158,11,0.07)", borderRadius: 6, fontSize: 12, color: "#fbbf24" }}>
                <ShieldAlert size={12} style={{ display: "inline", marginRight: 4 }} />
                Karantina sebebi: {s.quarantineReason}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12 }}>
              <Btn label={isWorking ? "Kontrol ediliyor" : "Derle → onaya sun → kapıları değerlendir"} variant="accent-dim" small disabled={isWorking} onClick={() => void preparePublication()} />
              {gateResult?.isPublishable && <Btn label="Yayınla" variant="primary" small disabled={isWorking} onClick={() => void publish()} />}
              <span style={{ flex: 1 }} />
              <Btn label="Kullanımdan kaldır" small disabled={isWorking} onClick={() => void deprecate()} />
              <Btn label={confirmingDelete ? "Silmeyi onayla" : "Sil"} variant="danger-dim" small disabled={isWorking} onClick={() => void remove()} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,.06)" }}>
              <div style={{ display: "grid", gap: 7 }}><strong style={{ color: "rgba(255,255,255,.55)", fontSize: 11 }}>Zamanlama</strong><div style={{ display: "flex", gap: 6 }}><input value={scheduleCron} onChange={(e) => setScheduleCron(e.target.value)} placeholder="0 */2 * * *" style={{ flex: 1, height: 28, border: "1px solid rgba(255,255,255,.09)", borderRadius: 6, background: "rgba(255,255,255,.04)", color: "#ddd", padding: "0 8px", fontSize: 11 }} /><label style={{ color: "rgba(255,255,255,.42)", fontSize: 10.5, display: "flex", alignItems: "center", gap: 4 }}><input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} />aktif</label><Btn label="Kaydet" small disabled={isWorking} onClick={() => void saveSchedule()} /></div></div>
              <div style={{ display: "grid", gap: 7 }}><strong style={{ color: "rgba(255,255,255,.55)", fontSize: 11 }}>Karantina</strong>{s.quarantineUntil ? <Btn label="Karantinayı kaldır" small disabled={isWorking} onClick={() => void toggleQuarantine()} /> : <div style={{ display: "flex", gap: 6 }}><input type="datetime-local" value={quarantineUntil} onChange={(e) => setQuarantineUntil(e.target.value)} style={{ height: 28, border: "1px solid rgba(255,255,255,.09)", borderRadius: 6, background: "rgba(255,255,255,.04)", color: "#ddd", padding: "0 6px", fontSize: 10.5 }} /><input value={quarantineReason} onChange={(e) => setQuarantineReason(e.target.value)} placeholder="Gerekçe" style={{ flex: 1, height: 28, border: "1px solid rgba(255,255,255,.09)", borderRadius: 6, background: "rgba(255,255,255,.04)", color: "#ddd", padding: "0 8px", fontSize: 11 }} /><Btn label="Karantinaya al" small disabled={isWorking} onClick={() => void toggleQuarantine()} /></div>}</div>
            </div>
            {gateResult && !gateResult.isPublishable && (
              <div style={{ marginTop: 9, padding: "9px 11px", borderRadius: 7, background: "rgba(239,68,68,.07)", border: "1px solid rgba(239,68,68,.17)", color: "#fca5a5", fontSize: 11.5 }}>
                Yayın engellendi: {gateResult.failedGateCodes.map(gateLabel).join(" · ")}
                {gateResult.warnings.length > 0 && <div style={{ marginTop: 5, color: "rgba(255,255,255,.38)" }}>{gateResult.warnings.join(" · ")}</div>}
              </div>
            )}
            {actionError && <div style={{ marginTop: 8, color: "#f87171", fontSize: 11.5 }}>{actionError}</div>}
          </td>
        </tr>
      )}
    </>
  );
}

function gateLabel(code: string): string {
  return ({
    SchemaValidity: "Arazzo şeması geçersiz",
    Derivability: "Assertion sözleşmeden türetilemiyor",
    AssertionCount: "En az bir beklenti gerekli",
    MaterialIntegrity: "Malzeme mührü eksik veya bayat",
    SourceDescriptionConsistency: "Kaynak adresleri tutarsız",
  } as Record<string, string>)[code] ?? code;
}

/* ═══════════════════════════════════════════════════════
   EXPORT
═══════════════════════════════════════════════════════ */
export function TabScenarios({ onRunScenario }: { onRunScenario: (id: string) => void }) {
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["test-scenarios", "list", page],
    queryFn: () => testApi.scenarios.list({ skipCount: page * PAGE_SIZE, maxResultCount: PAGE_SIZE }),
  });

  const lookups = useTestLookups();

  const normalizedFilter = filter.trim().toLocaleLowerCase("tr-TR");
  const scenarios = (data?.items ?? []).filter((scenario) => !normalizedFilter || `${scenario.scenarioKey} ${scenario.title} ${scenario.description ?? ""}`.toLocaleLowerCase("tr-TR").includes(normalizedFilter));
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Test Senaryoları</h2>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>Katalogdaki iş senaryolarını görüntüle ve koştur.</p>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 14 }}>
        <input value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0); }} placeholder="Senaryo ara…"
          style={{ height: 32, padding: "0 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, color: "#e0e4f0", fontSize: 12.5, fontFamily: "inherit", outline: "none", width: 280 }} />
      </div>

      <Card>
        {isLoading ? <Loading /> : isError ? (
          <Empty icon={BookOpen} title="API'ye ulaşılamadı" hint="Test modülü bağlantısını kontrol edin." />
        ) : scenarios.length === 0 ? (
          <Empty icon={FlaskConical} title="Senaryo yok" hint={filter ? "Arama kriterini değiştirin." : "Henüz senaryo oluşturulmamış."} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Senaryo", "Durum", "Bağlantılar", "Zamanlama", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenarios.map((s) => <ScenarioRow key={s.id} s={s} stateLabel={lookups.nameById(s.stateId)} onRun={onRunScenario} />)}
            </tbody>
          </table>
        )}
      </Card>

      {pageCount > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.28)" }}>{totalCount} senaryo · sayfa {page + 1}/{pageCount}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn label="← Önceki" disabled={page === 0} onClick={() => setPage((p) => p - 1)} small />
            <Btn label="Sonraki →" disabled={page >= pageCount - 1} onClick={() => setPage((p) => p + 1)} small />
          </div>
        </div>
      )}
    </div>
  );
}
