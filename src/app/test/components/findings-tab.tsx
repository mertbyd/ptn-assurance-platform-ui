"use client";

import { Bug, Filter } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { testApi, type TestFindingHeaderDto } from "@/api/test";
import { ACC, Btn, Card, Empty, Loading, OutcomeBadge } from "./primitives";
import { useTestLookups } from "./use-test-lookups";

const PAGE_SIZE = 50;
const BORDER = "rgba(255,255,255,0.08)";
const FIELD = { height: 30, padding: "0 9px", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 7, color: "#e0e4f0", fontSize: 12, fontFamily: "inherit", outline: "none" };

/* Bulgunun kaynağı kapalı kümedir ve üç hakemden gelir (ARCH-0004 "Kayıt sahibi"):
 * `Runner` hızlı ön kapıdır, sözleşme hükmünün sahibi `ApiContract`, kalıcılık hükmünün
 * sahibi `DatabaseComparison`. UI bu listeyi uydurmaz, taşır. */
const SOURCE_CHECKERS = ["Runner", "ApiContract", "DatabaseComparison"] as const;

function SeverityPill({ code }: { code?: string | null }) {
  if (!code) return <span style={{ color: "rgba(255,255,255,0.24)", fontSize: 11 }}>—</span>;
  /* `Inconclusive` ve benzeri "ölçülemedi" durumları kırmızıya boyanmaz (CURRENT-0007 §4). */
  const tone: Record<string, string> = { Breaking: "#f87171", Critical: "#f87171", Major: "#fbbf24", Warning: "#fbbf24", Minor: "#9ca3af", DocsOnly: "#6b7280" };
  const color = tone[code] ?? "rgba(255,255,255,0.45)";
  return <span style={{ padding: "1px 7px", borderRadius: 999, fontSize: 10.5, fontWeight: 650, border: `1px solid ${color}44`, color }}>{code}</span>;
}

function FindingRow({ finding, outcomeLabel }: { finding: TestFindingHeaderDto; outcomeLabel: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <tr onClick={() => setIsOpen((value) => !value)} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)`, cursor: "pointer" }}>
        <td style={{ padding: "10px 16px" }}>
          <div style={{ color: "#e0e4f0", fontSize: 12.5 }}>{finding.message}</div>
          <code style={{ color: "rgba(255,255,255,0.3)", fontSize: 10.5 }}>{finding.location}</code>
        </td>
        <td style={{ padding: "10px 16px" }}><OutcomeBadge code={finding.outcomeCode} label={outcomeLabel} /></td>
        <td style={{ padding: "10px 16px" }}><SeverityPill code={finding.severityCode} /></td>
        <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.42)", fontSize: 11.5 }}>{finding.sourceCheckerCode}</td>
        <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.42)", fontSize: 11.5 }}>{finding.ruleRef ?? "—"}</td>
        <td style={{ padding: "10px 16px", color: "rgba(255,255,255,0.28)", fontSize: 11.5 }}>{new Date(finding.creationTime).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })}</td>
      </tr>
      {isOpen && (
        <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
          <td colSpan={6} style={{ padding: "8px 16px 14px", background: "rgba(255,255,255,0.015)" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 11.5, color: "rgba(255,255,255,0.32)" }}>
              <span>Koşum: <code style={{ color: "rgba(255,255,255,0.5)" }}>{finding.testRunId.slice(0, 8)}</code></span>
              <span>Deneme: {finding.attempt}</span>
              <span>Sıra: {finding.ordinal}</span>
              <span>Karşılaştırma: {finding.comparisonKindCode}</span>
              {/* Parmak izi bulgunun kararlı kimliğidir; aynı bulgunun koşumlar arasında
                  izlenmesini sağlar. Kısaltılmaz — dışa aktarımda birebir aranır. */}
              <span>Parmak izi: <code style={{ color: "rgba(255,255,255,0.5)" }}>{finding.fingerprint}</code></span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* Ekran 4 — Bulgu listesi ve filtre (CURRENT-0007 §3, P0).
 * Bulgular koşum raporundan bağımsız olarak sorgulanabilir: bir kuralın veya bir
 * checker'ın tüm koşumlardaki izini görmek raporu tek tek açmadan mümkün olmalıdır. */
export function TabFindings({ initialRunId }: { initialRunId?: string }) {
  const [page, setPage] = useState(0);
  const [outcomeCode, setOutcomeCode] = useState("");
  const [sourceCheckerCode, setSourceCheckerCode] = useState("");
  const [ruleRef, setRuleRef] = useState("");
  const [runId, setRunId] = useState(initialRunId ?? "");
  const lookups = useTestLookups();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["test-findings", page, outcomeCode, sourceCheckerCode, ruleRef, runId],
    queryFn: () => testApi.findings.list({
      skipCount: page * PAGE_SIZE,
      maxResultCount: PAGE_SIZE,
      outcomeCode: outcomeCode || undefined,
      sourceCheckerCode: sourceCheckerCode || undefined,
      ruleRef: ruleRef.trim() || undefined,
      testRunId: runId.trim() || undefined,
    }),
  });

  const findings = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / PAGE_SIZE);
  const resetPage = () => setPage(0);

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#eaedf4", letterSpacing: "-0.025em" }}>Bulgular</h2>
        <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>Hükmü veren checker&apos;ın kaydettiği tüm bulgular. Hüküm yalnız checker&apos;dan gelir; ajanın burada payı yoktur.</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Filter size={13} color="rgba(255,255,255,0.28)" />
        <select value={outcomeCode} onChange={(e) => { setOutcomeCode(e.target.value); resetPage(); }} style={FIELD}>
          <option value="">Tüm hükümler</option>
          {["Passed", "Failed", "Broken", "Skipped", "Inconclusive"].map((code) => (
            <option key={code} value={code}>{lookups.nameByCode(code) ?? code}</option>
          ))}
        </select>
        <select value={sourceCheckerCode} onChange={(e) => { setSourceCheckerCode(e.target.value); resetPage(); }} style={FIELD}>
          <option value="">Tüm kaynaklar</option>
          {SOURCE_CHECKERS.map((code) => <option key={code} value={code}>{code}</option>)}
        </select>
        <input value={ruleRef} onChange={(e) => { setRuleRef(e.target.value); resetPage(); }} placeholder="kural referansı" style={{ ...FIELD, width: 170 }} />
        <input value={runId} onChange={(e) => { setRunId(e.target.value); resetPage(); }} placeholder="koşum kimliği" style={{ ...FIELD, width: 260 }} />
        {(outcomeCode || sourceCheckerCode || ruleRef || runId)
          ? <Btn label="Filtreyi temizle" small onClick={() => { setOutcomeCode(""); setSourceCheckerCode(""); setRuleRef(""); setRunId(""); resetPage(); }} />
          : null}
      </div>

      <Card>
        {isLoading ? <Loading /> : isError ? (
          <Empty icon={Bug} title="Bulgular okunamadı" hint="Test modülü bağlantısını kontrol edin." />
        ) : findings.length === 0 ? (
          <Empty icon={Bug} title="Bulgu yok" hint={outcomeCode || sourceCheckerCode || ruleRef || runId ? "Filtreyi değiştirin." : "Henüz kayıtlı bulgu yok."} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                {["Bulgu", "Hüküm", "Önem", "Kaynak", "Kural", "Zaman"].map((head) => (
                  <th key={head} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {findings.map((finding) => (
                <FindingRow key={finding.id} finding={finding} outcomeLabel={lookups.nameByCode(finding.outcomeCode)} />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {pageCount > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.28)" }}>{totalCount} bulgu · sayfa {page + 1}/{pageCount}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <Btn label="← Önceki" disabled={page === 0} onClick={() => setPage((value) => value - 1)} small />
            <Btn label="Sonraki →" disabled={page >= pageCount - 1} onClick={() => setPage((value) => value + 1)} small />
          </div>
        </div>
      )}
      <p style={{ marginTop: 10, color: "rgba(255,255,255,0.22)", fontSize: 11 }}>Renk kodu: <span style={{ color: ACC }}>önem</span> kırmızıya yalnız gerçek ihlalde boyanır; &quot;ölçülemedi&quot; durumları nötr kalır.</p>
    </div>
  );
}
