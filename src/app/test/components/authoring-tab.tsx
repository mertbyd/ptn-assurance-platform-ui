"use client";

import {
  BookOpenCheck,
  Braces,
  Check,
  GitPullRequestArrow,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { checkerApi, type SpecSnapshotHeaderDto, type SpecSourceDto } from "@/api/checker";
import { dbApi, type DatabaseConnectionDto } from "@/api/db";
import {
  testApi,
  type AuthoringSourceDto,
  type ProfilePackSummaryDto,
  type ScenarioCompilePreviewResultDto,
  type TestScenarioDto,
  type TestScenarioPublishDecisionDto,
} from "@/api/test";
import { useTestAgent } from "@/features/test-agent/test-agent-context";
import { extractUserMessage } from "@/lib/error-messages";
import { ACC, Btn, Card, CardHead, Loading } from "./primitives";

const BORDER = "rgba(255,255,255,0.08)";
const FIELD = { width: "100%", minHeight: 34, border: `1px solid ${BORDER}`, borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "#e5e7eb", font: "12px inherit", outline: "none", padding: "7px 10px", boxSizing: "border-box" as const };
const GATE_LABELS: Record<string, string> = {
  SchemaValidity: "Arazzo şeması geçersiz",
  Derivability: "Assertion sözleşme kanıtından türetilemiyor",
  AssertionCount: "En az bir beklenti eksik",
  MaterialIntegrity: "Malzeme mührü eksik veya bayat",
  SourceDescriptionConsistency: "Kaynak adresleri seçilen kanıtla uyuşmuyor",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <label style={{ display: "grid", gap: 5 }}><span style={{ color: "rgba(255,255,255,.66)", fontSize: 12, fontWeight: 650 }}>{label}</span>{children}{hint ? <small style={{ color: "rgba(255,255,255,.28)", fontSize: 10.5 }}>{hint}</small> : null}</label>;
}

function StatusLine({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const palette = tone === "success" ? ["#4ade80", "rgba(74,222,128,.08)"] : tone === "warning" ? ["#fbbf24", "rgba(251,191,36,.08)"] : tone === "danger" ? ["#f87171", "rgba(248,113,113,.08)"] : ["rgba(255,255,255,.48)", "rgba(255,255,255,.035)"];
  return <div style={{ padding: "9px 11px", border: `1px solid ${palette[0]}33`, borderRadius: 8, background: palette[1], color: palette[0], fontSize: 11.5, lineHeight: 1.45 }}>{children}</div>;
}

async function readTextFile(file: File | undefined, expectedNames?: string[]) {
  if (!file) return "";
  if (expectedNames && !expectedNames.includes(file.name.toLocaleLowerCase("tr-TR"))) throw new Error(`Dosya adı ${expectedNames.join(" veya ")} olmalı.`);
  return file.text();
}

export function AuthoringTab() {
  const {
    authoringSession,
    startAuthoringSession,
    answerAuthoringQuestion,
    uploadContext,
  } = useTestAgent();
  const [sources, setSources] = useState<SpecSourceDto[]>([]);
  const [connections, setConnections] = useState<DatabaseConnectionDto[]>([]);
  const [profiles, setProfiles] = useState<ProfilePackSummaryDto[]>([]);
  const [snapshots, setSnapshots] = useState<SpecSnapshotHeaderDto[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [snapshotId, setSnapshotId] = useState("");
  const [connectionId, setConnectionId] = useState("");
  const [profileKey, setProfileKey] = useState("");
  const [workflowId, setWorkflowId] = useState("assurance-flow");
  const [workflowSummary, setWorkflowSummary] = useState("İş akışını API ve veritabanı kanıtlarıyla doğrula");
  const [scenarioKey, setScenarioKey] = useState("assurance-flow");
  const [title, setTitle] = useState("Assurance iş senaryosu");
  const [description, setDescription] = useState("");
  const [scenarioText, setScenarioText] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [profileUploadKey, setProfileUploadKey] = useState("");
  const [profileYaml, setProfileYaml] = useState("");
  const [rulesSeal, setRulesSeal] = useState<AuthoringSourceDto | null>(null);
  const [uploadedScenarioText, setUploadedScenarioText] = useState("");
  const [compile, setCompile] = useState<ScenarioCompilePreviewResultDto | null>(null);
  const [scenario, setScenario] = useState<TestScenarioDto | null>(null);
  const [submittedForApproval, setSubmittedForApproval] = useState(false);
  const [decision, setDecision] = useState<TestScenarioPublishDecisionDto | null>(null);
  const [busy, setBusy] = useState<string | null>("inventory");
  const [error, setError] = useState<string | null>(null);

  const selectedSource = sources.find((item) => item.id === sourceId);
  const selectedSnapshot = snapshots.find((item) => item.id === snapshotId);
  const selectedProfile = profiles.find((item) => item.profileKey === profileKey);
  const unanswered = authoringSession?.questions.filter((question) => !authoringSession.answers[question.questionCode]) ?? [];
  const stepCount = (authoringSession?.steps.length ?? 0) + (authoringSession?.databaseSteps.length ?? 0);
  const canStart = Boolean(rulesSeal && uploadedScenarioText === scenarioText && scenarioText.trim() && profileKey && snapshotId && connectionId && workflowId.trim() && workflowSummary.trim());
  const canPersist = Boolean(compile?.isSchemaValid && authoringSession && stepCount > 0 && unanswered.length === 0 && rulesSeal && selectedSnapshot && selectedProfile);

  useEffect(() => {
    let active = true;
    void Promise.all([
      checkerApi.sources.list({ skipCount: 0, maxResultCount: 1000 }),
      dbApi.connections.list({ skipCount: 0, maxResultCount: 1000 }),
      testApi.authoring.listProfilePacks(),
    ]).then(([sourcePage, connectionPage, profileItems]) => {
      if (!active) return;
      const nextSources = sourcePage.items.filter((item) => item.isActive);
      const nextConnections = connectionPage.items.filter((item) => item.isActive);
      setSources(nextSources);
      setConnections(nextConnections);
      setProfiles(profileItems);
      setSourceId(nextSources[0]?.id ?? "");
      setDocumentId(nextSources[0]?.documents?.find((item) => item.isActive)?.id ?? "");
      setConnectionId(nextConnections[0]?.id ?? "");
      setProfileKey(profileItems[0]?.profileKey ?? "");
      setBusy(null);
    }).catch((requestError) => {
      if (!active) return;
      setError(extractUserMessage(requestError, "Yazarlık envanteri yüklenemedi."));
      setBusy(null);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!sourceId || !documentId) return;
    let active = true;
    void checkerApi.sources.listSnapshots(sourceId, documentId, { skipCount: 0, maxResultCount: 200 })
      .then((page) => {
        if (!active) return;
        setSnapshots(page.items);
        setSnapshotId(page.items[0]?.id ?? "");
      })
      .catch((requestError) => active && setError(extractUserMessage(requestError, "Snapshot listesi yüklenemedi.")));
    return () => { active = false; };
  }, [documentId, sourceId]);

  async function saveMaterials() {
    if (!rulesText.trim() || !scenarioText.trim()) { setError("kurallar.md ve senaryo.md içerikleri zorunludur."); return; }
    if (new Blob([scenarioText]).size > 262_144 || new Blob([rulesText]).size > 262_144) { setError("Agent bağlam dosyalarının her biri en fazla 256 KB olabilir."); return; }
    setBusy("materials"); setError(null);
    try {
      const stored = await testApi.authoring.uploadBusinessRules(rulesText);
      setRulesSeal(stored);
      await uploadContext("kurallar.md", rulesText);
      await uploadContext("senaryo.md", scenarioText);
      setUploadedScenarioText(scenarioText);
    } catch (requestError) { setError(extractUserMessage(requestError, "Malzemeler kaydedilemedi.")); }
    finally { setBusy(null); }
  }

  async function uploadProfile() {
    if (!profileUploadKey.trim() || !profileYaml.trim()) { setError("Profil anahtarı ve YAML içeriği zorunludur."); return; }
    setBusy("profile"); setError(null);
    try {
      await testApi.authoring.uploadProfilePack(profileUploadKey.trim(), profileYaml);
      const next = await testApi.authoring.listProfilePacks();
      setProfiles(next); setProfileKey(profileUploadKey.trim()); setProfileYaml("");
    } catch (requestError) { setError(extractUserMessage(requestError, "Profil paketi kaydedilemedi.")); }
    finally { setBusy(null); }
  }

  async function start() {
    if (!canStart) { setError("Malzemeleri mühürleyip profil, snapshot ve DB bağlantısını seçin."); return; }
    setBusy("session"); setError(null); setCompile(null); setScenario(null); setSubmittedForApproval(false); setDecision(null);
    try {
      await startAuthoringSession({
        workflowId: workflowId.trim(),
        workflowSummary: workflowSummary.trim(),
        apiSourceUrl: `/api/snapshots/${snapshotId}`,
        databaseSourceUrl: `/api/comparison/schema-discovery/${connectionId}/snapshot`,
        grounding: {
          profileKey,
          specSnapshotId: snapshotId,
          connectionId,
          stepIntent: scenarioText.trim().slice(0, 4_000),
          responseFormat: "detailed",
          hasExclusiveSandbox: false,
        },
      });
    } catch (requestError) { setError(extractUserMessage(requestError, "Yazarlık oturumu başlatılamadı.")); }
    finally { setBusy(null); }
  }

  async function answer(questionCode: string, option: string) {
    setBusy(`answer:${questionCode}`); setError(null);
    try { await answerAuthoringQuestion(questionCode, option); }
    catch (requestError) { setError(extractUserMessage(requestError, "Kapalı yanıt kaydedilemedi.")); }
    finally { setBusy(null); }
  }

  async function compilePreview() {
    if (!authoringSession) return;
    setBusy("compile"); setError(null); setDecision(null);
    try { setCompile(await testApi.scenarios.compilePreview(authoringSession.sourceDocument, authoringSession.specSnapshotId)); }
    catch (requestError) { setError(extractUserMessage(requestError, "Derleme önizlemesi üretilemedi.")); }
    finally { setBusy(null); }
  }

  async function persist() {
    if (!canPersist || !authoringSession || !rulesSeal || !selectedSnapshot || !selectedProfile) return;
    setBusy("persist"); setError(null);
    try {
      const created = await testApi.scenarios.create({
        scenarioKey: scenarioKey.trim(), title: title.trim(), description: description.trim() || null,
        sourceDocument: authoringSession.sourceDocument,
        materialSeal: {
          rulesFingerprint: rulesSeal.fingerprint,
          specSnapshotId: authoringSession.specSnapshotId,
          specFingerprint: selectedSnapshot.canonicalHash,
          dbConnectionId: connectionId,
          dbSchemaFingerprint: selectedProfile.dbSchemaFingerprint,
          profileFingerprint: selectedProfile.contentFingerprint,
        },
        authoredByAgent: true,
        agentModelRef: "ptn-test-agent",
      });
      setScenario(created);
      setSubmittedForApproval(false);
    } catch (requestError) { setError(extractUserMessage(requestError, "Senaryo kalıcılaştırılamadı.")); }
    finally { setBusy(null); }
  }

  async function submit() {
    if (!scenario) return;
    setBusy("submit"); setError(null);
    try { setScenario(await testApi.scenarios.submitForApproval(scenario.id)); setSubmittedForApproval(true); setDecision(null); }
    catch (requestError) { setError(extractUserMessage(requestError, "Senaryo onaya sunulamadı.")); }
    finally { setBusy(null); }
  }

  async function evaluate() {
    if (!scenario) return;
    setBusy("evaluate"); setError(null);
    try { setDecision(await testApi.scenarios.evaluatePublication(scenario.id)); }
    catch (requestError) { setError(extractUserMessage(requestError, "Yayın kapıları değerlendirilemedi.")); }
    finally { setBusy(null); }
  }

  async function publish() {
    if (!scenario || !decision?.isPublishable) return;
    setBusy("publish"); setError(null);
    try { setScenario(await testApi.scenarios.publish(scenario.id)); }
    catch (requestError) { setError(extractUserMessage(requestError, "Senaryo yayınlanamadı.")); }
    finally { setBusy(null); }
  }

  const progress = useMemo(() => [
    { label: "Malzeme", done: Boolean(rulesSeal && scenarioText && uploadedScenarioText === scenarioText) },
    { label: "Grounding", done: Boolean(authoringSession) },
    { label: "Adımlar", done: stepCount > 0 },
    { label: "Derleme", done: Boolean(compile?.isSchemaValid) },
    { label: "Yayın", done: Boolean(scenario && decision?.isPublishable) },
  ], [authoringSession, compile?.isSchemaValid, decision?.isPublishable, rulesSeal, scenario, scenarioText, stepCount, uploadedScenarioText]);

  if (busy === "inventory") return <Loading />;

  return <div style={{ padding: "26px 30px 150px", display: "grid", gap: 16 }}>
    <div><h2 style={{ margin: 0, color: "#f3f4f6", fontSize: 18 }}>Grounded senaryo yazarlığı</h2><p style={{ margin: "5px 0 0", color: "rgba(255,255,255,.34)", fontSize: 12.5 }}>Malzemeyi mühürle, gerçek checker kanıtını seç, ajanla adım üret ve Test Module yayın kapılarından geçir.</p></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden" }}>{progress.map((item, index) => <div key={item.label} style={{ padding: "9px 11px", borderRight: index < 4 ? `1px solid ${BORDER}` : "none", color: item.done ? "#4ade80" : "rgba(255,255,255,.35)", background: item.done ? "rgba(74,222,128,.045)" : "#131620", fontSize: 11.5, fontWeight: 650 }}>{item.done ? "✓ " : `${index + 1}. `}{item.label}</div>)}</div>
    {error ? <StatusLine tone="danger">{error}</StatusLine> : null}

    <Card><CardHead title="1. Kanonik malzemeler" right={<Btn label={rulesSeal ? "Malzemeler güncel" : "Mühürle ve ajana yükle"} icon={Upload} variant="accent-dim" loading={busy === "materials"} onClick={() => void saveMaterials()} />} /><div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <Field label="senaryo.md" hint="İnsanın anlattığı iş akışı; agent prompt bağlamına gider."><textarea value={scenarioText} onChange={(event) => setScenarioText(event.target.value)} placeholder="İş akışını, aktörleri ve beklenen sonucu anlatın…" style={{ ...FIELD, minHeight: 150, resize: "vertical" }} /><input type="file" accept=".md,text/markdown,text/plain" onChange={(event) => void readTextFile(event.target.files?.[0], ["senaryo.md"]).then(setScenarioText).catch((e) => setError(extractUserMessage(e)))} /></Field>
      <Field label="kurallar.md" hint="Önce Test Module kanonik kaynağına yazılır; dönen fingerprint yayın mührüne girer."><textarea value={rulesText} onChange={(event) => { setRulesText(event.target.value); setRulesSeal(null); }} placeholder="İş kuralları ve değişmezler…" style={{ ...FIELD, minHeight: 150, resize: "vertical" }} /><input type="file" accept=".md,text/markdown,text/plain" onChange={(event) => void readTextFile(event.target.files?.[0], ["kurallar.md"]).then((value) => { setRulesText(value); setRulesSeal(null); }).catch((e) => setError(extractUserMessage(e)))} /></Field>
      {rulesSeal ? <div style={{ gridColumn: "1/-1" }}><StatusLine tone="success">Kural kaynağı mühürlendi: <code>{rulesSeal.fingerprint}</code> · {rulesSeal.byteCount.toLocaleString("tr-TR")} bayt</StatusLine></div> : null}
    </div></Card>

    <Card><CardHead title="Profil paketi" right={<Btn label="Paketi kaydet" icon={Save} loading={busy === "profile"} disabled={!profileUploadKey.trim() || !profileYaml.trim()} onClick={() => void uploadProfile()} />} /><div style={{ padding: 16, display: "grid", gridTemplateColumns: "220px 1fr", gap: 12 }}><Field label="Profil anahtarı"><input value={profileUploadKey} onChange={(e) => setProfileUploadKey(e.target.value)} style={FIELD} /></Field><Field label="YAML paket"><textarea value={profileYaml} onChange={(e) => setProfileYaml(e.target.value)} style={{ ...FIELD, minHeight: 70, resize: "vertical" }} /><input type="file" accept=".yaml,.yml,text/yaml" onChange={(event) => void readTextFile(event.target.files?.[0]).then(setProfileYaml).catch((e) => setError(extractUserMessage(e)))} /></Field></div></Card>

    <Card><CardHead title="2. Gerçek checker kanıtını seç" right={<Btn label="Grounding oturumunu başlat" icon={GitPullRequestArrow} variant="primary" loading={busy === "session"} disabled={!canStart} onClick={() => void start()} />} /><div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
      <Field label="API kaynağı"><select value={sourceId} onChange={(e) => { const id = e.target.value; const source = sources.find((item) => item.id === id); setSnapshots([]); setSnapshotId(""); setSourceId(id); setDocumentId(source?.documents?.find((item) => item.isActive)?.id ?? ""); }} style={FIELD}>{sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
      <Field label="OpenAPI dokümanı"><select value={documentId} onChange={(e) => { setSnapshots([]); setSnapshotId(""); setDocumentId(e.target.value); }} style={FIELD}>{selectedSource?.documents?.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.displayName || item.url}</option>)}</select></Field>
      <Field label="Yayınlanmış snapshot"><select value={snapshotId} onChange={(e) => setSnapshotId(e.target.value)} style={FIELD} disabled={busy === "snapshots"}>{snapshots.map((item) => <option key={item.id} value={item.id}>{new Date(item.capturedAt).toLocaleString("tr-TR")} · {item.operationCount ?? "?"} operasyon</option>)}</select></Field>
      <Field label="Database bağlantısı"><select value={connectionId} onChange={(e) => setConnectionId(e.target.value)} style={FIELD}>{connections.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.databaseName}</option>)}</select></Field>
      <Field label="Profil paketi"><select value={profileKey} onChange={(e) => setProfileKey(e.target.value)} style={FIELD}>{profiles.map((item) => <option key={item.profileKey} value={item.profileKey}>{item.profileKey} · {item.approvedBindingCount}/{item.bindingCount} bağlı</option>)}</select></Field>
      <Field label="Kapsam kanıtı">{selectedProfile ? <StatusLine tone={selectedProfile.approvedBindingCount === selectedProfile.bindingCount ? "success" : "warning"}>{selectedProfile.approvedBindingCount}/{selectedProfile.bindingCount} onaylı bağ · {selectedProfile.evidencePathCount} kanıt yolu</StatusLine> : <StatusLine tone="warning">Profil paketi seçin veya yükleyin.</StatusLine>}</Field>
      <Field label="Workflow ID"><input value={workflowId} onChange={(e) => { setWorkflowId(e.target.value); setScenarioKey(e.target.value); }} style={FIELD} /></Field>
      <Field label="Workflow özeti"><input value={workflowSummary} onChange={(e) => setWorkflowSummary(e.target.value)} style={FIELD} /></Field>
      <Field label="Üretilen sourceDescription"><StatusLine><code>/api/snapshots/{snapshotId || "…"}</code><br /><code>/api/comparison/schema-discovery/{connectionId || "…"}/snapshot</code></StatusLine></Field>
    </div></Card>

    {authoringSession ? <>
      <Card><CardHead title="3. Grounding soruları ve kanıtlı adımlar" right={<span style={{ color: unanswered.length ? "#fbbf24" : "#4ade80", fontSize: 11.5 }}>{unanswered.length ? `${unanswered.length} kapalı soru bekliyor` : `${stepCount} adım · sorular tamam`}</span>} /><div style={{ padding: 16, display: "grid", gap: 10 }}>
        {authoringSession.questions.map((question) => <div key={question.questionCode} style={{ padding: 12, border: `1px solid ${BORDER}`, borderRadius: 9, background: "rgba(255,255,255,.02)" }}><div style={{ color: "#e5e7eb", fontSize: 12.5, fontWeight: 650 }}>{question.prompt}</div><code style={{ color: "rgba(255,255,255,.3)", fontSize: 9.5 }}>{question.questionCode}{question.gapKindCode ? ` · ${question.gapKindCode}` : ""}</code><div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>{question.options.map((option) => { const selected = authoringSession.answers[question.questionCode] === option; return <button key={option} disabled={selected || busy === `answer:${question.questionCode}`} onClick={() => void answer(question.questionCode, option)} style={{ padding: "6px 9px", border: `1px solid ${selected ? ACC : BORDER}`, borderRadius: 7, background: selected ? `${ACC}22` : "rgba(255,255,255,.035)", color: selected ? "#f7c869" : "rgba(255,255,255,.62)", cursor: selected ? "default" : "pointer", font: "11px inherit" }}>{selected ? <Check size={10} style={{ display: "inline", marginRight: 4 }} /> : null}{option}</button>; })}</div></div>)}
        {!authoringSession.questions.length ? <StatusLine tone="success">Grounding kapalı soru üretmedi. Sağ alttaki mutlu ajanla konuşup kanıtlı bir API adımı önerebilirsiniz.</StatusLine> : null}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}><StatusLine>{authoringSession.steps.length} API adımı</StatusLine><StatusLine>{authoringSession.databaseSteps.length} DB adımı</StatusLine></div>
      </div></Card>

      <Card><CardHead title="4. Mekanik Arazzo belge önizlemesi" right={<Btn label="Compile preview" icon={Braces} variant="accent-dim" loading={busy === "compile"} disabled={unanswered.length > 0 || stepCount === 0} onClick={() => void compilePreview()} />} /><pre style={{ margin: 0, padding: 16, maxHeight: 420, overflow: "auto", color: "rgba(255,255,255,.68)", background: "#0b0d12", font: "11px/1.55 ui-monospace,monospace", whiteSpace: "pre-wrap" }}>{authoringSession.sourceDocument}</pre>{compile ? <div style={{ padding: 14, borderTop: `1px solid ${BORDER}` }}><StatusLine tone={compile.isSchemaValid ? "success" : "danger"}>{compile.isSchemaValid ? "Şema geçerli" : "Şema geçersiz"} · {compile.compiledAssertionCount} assertion · <code>{compile.compiledHash}</code>{compile.lintDiagnostics ? <><br />{compile.lintDiagnostics}</> : null}</StatusLine></div> : null}</Card>

      <Card><CardHead title="5. Kalıcılaştırma ve insan yayın kapıları" /><div style={{ padding: 16, display: "grid", gap: 12 }}><div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 10 }}><Field label="Senaryo anahtarı"><input value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)} style={FIELD} /></Field><Field label="Başlık"><input value={title} onChange={(e) => setTitle(e.target.value)} style={FIELD} /></Field><Field label="Açıklama"><input value={description} onChange={(e) => setDescription(e.target.value)} style={FIELD} /></Field></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}><Btn label={scenario ? "Senaryo kaydedildi" : "Taslağı kalıcılaştır"} icon={Save} variant="primary" loading={busy === "persist"} disabled={!canPersist || Boolean(scenario)} onClick={() => void persist()} /><Btn label={submittedForApproval ? "Onaya sunuldu" : "Onaya sun"} icon={BookOpenCheck} disabled={!scenario || submittedForApproval} loading={busy === "submit"} onClick={() => void submit()} /><Btn label="5 kapıyı değerlendir" icon={ShieldCheck} disabled={!scenario || !submittedForApproval} loading={busy === "evaluate"} onClick={() => void evaluate()} /><Btn label="Yayınla" icon={GitPullRequestArrow} variant="accent-dim" disabled={!decision?.isPublishable} loading={busy === "publish"} onClick={() => void publish()} /></div>
        {scenario ? <StatusLine tone="success">Kalıcı senaryo: <code>{scenario.scenarioKey}</code> · durum kimliği {scenario.stateId}</StatusLine> : null}
        {decision ? <div style={{ display: "grid", gap: 7 }}><StatusLine tone={decision.isPublishable ? "success" : "warning"}>{decision.isPublishable ? "Tüm yayın kapıları geçti; yalnız şimdi Yayınla eylemi açıldı." : "Yayın kapıları geçmedi; yayın çağrısı yapılmayacak."}</StatusLine>{decision.failedGateCodes.map((code) => <StatusLine key={code} tone="warning"><b>{code}</b> — {GATE_LABELS[code] ?? code}</StatusLine>)}{decision.warnings.map((warning) => <StatusLine key={warning}>{warning}</StatusLine>)}</div> : null}
      </div></Card>
    </> : null}
  </div>;
}
