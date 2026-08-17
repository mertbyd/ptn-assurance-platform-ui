"use client";

import {
  BookOpenCheck,
  Braces,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  GitPullRequestArrow,
  History,
  ListChecks,
  Plus,
  RadioTower,
  Save,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { sourcesApi, type SpecSnapshotHeaderDto, type SpecSourceDto } from "@/api/sources.api";
import { dbApi, type DatabaseConnectionDto } from "@/api/db";
import {
  testApi,
  type AuthoringExpectationDto,
  type AuthoringSourceDto,
  type OperationSuggestionDto,
  type ProfilePackSummaryDto,
  type ScenarioCompilePreviewResultDto,
  type TableDescriptionDto,
  type TestScenarioDto,
  type TestScenarioPublishDecisionDto,
} from "@/api/test";
import { ConnectionFormModal } from "@/features/database/connections/components/connections-page-view";
import { usePermissionsQuery } from "@/features/permissions";
import { SourceFormDialog } from "@/features/sources/components/source-form-dialog";
import { useTestAgent } from "@/features/test-agent/test-agent-context";
import { AgentConversationPanel } from "@/components/ui/floating-agent";
import { extractUserMessage } from "@/lib/error-messages";
import { Permissions, emptyGrantedPermissions, hasPermission } from "@/lib/permissions";
import type { LookupCommonDto } from "@/types";
import { ACC, Btn, Loading } from "./primitives";

const BORDER = "rgba(255,255,255,0.08)";
const FIELD = { width: "100%", minHeight: 34, border: `1px solid ${BORDER}`, borderRadius: 8, background: "rgba(255,255,255,0.04)", color: "#e5e7eb", font: "12px inherit", outline: "none", padding: "7px 10px", boxSizing: "border-box" as const };
const GATE_LABELS: Record<string, string> = {
  SchemaValidity: "Arazzo şeması geçersiz",
  Derivability: "Assertion sözleşme kanıtından türetilemiyor",
  AssertionCount: "En az bir beklenti eksik",
  MaterialIntegrity: "Malzeme mührü eksik veya bayat",
  SourceDescriptionConsistency: "Kaynak adresleri seçilen kanıtla uyuşmuyor",
};
const GATE_FIXES: Record<string, string> = {
  SchemaValidity: "Derleme önizlemesindeki lint çıktısını düzeltin.",
  Derivability: "Adımı düzeltin veya kaldırın; assertion sözleşmeden okunabilmeli.",
  AssertionCount: "Adıma en az bir beklenti ekleyin.",
  MaterialIntegrity: "Malzemeleri yeniden mühürleyip oturumu tazeleyin.",
  SourceDescriptionConsistency: "Seçili snapshot ve DB bağlantısıyla oturumu yeniden başlatın.",
};

/* Kapalı küme `ArazzoCompilationConsts.Operations.All` — UI bu listeyi uydurmaz, taşır.
 * Matcher kümesi ise tablo tanımının kendi `allowedMatchers` alanından gelir. */
const DB_OPERATION_CODES = ["assertRow", "assertCount", "assertAbsent"] as const;

/* `action` etiket satırının sağına düşer ama `label` DIŞINDA kalır: label içindeki bir
 * butona tıklamak aynı zamanda alanı da tetikler, "ekle" düğmesi açılır listeyi açardı. */
function Field({ label, hint, action, children }: { label: string; hint?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <div style={{ display: "grid", gap: 5 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, minHeight: 18 }}>
      <span style={{ color: "rgba(255,255,255,.66)", fontSize: 12, fontWeight: 650 }}>{label}</span>
      {action}
    </div>
    <label style={{ display: "grid", gap: 5 }}>{children}</label>
    {hint ? <small style={{ color: "rgba(255,255,255,.28)", fontSize: 10.5 }}>{hint}</small> : null}
  </div>;
}

/* Kutu tonları anlam taşır ve kenarlıkları bilinçli olarak PARLAK'tır: eksik önkoşul
 * (kırmızı) ile bilgilendirme (mavi) bir bakışta ayrılmalı, gri bir uyarı denizinde
 * kaybolmamalıdır. Sol kenardaki kalın çizgi kutuyu satır akışından ayırır. */
const TONES: Record<string, { line: string; bg: string; text: string }> = {
  neutral: { line: "rgba(255,255,255,.22)", bg: "rgba(255,255,255,.035)", text: "rgba(255,255,255,.52)" },
  success: { line: "#4ade80", bg: "rgba(74,222,128,.09)", text: "#86efac" },
  warning: { line: "#fbbf24", bg: "rgba(251,191,36,.09)", text: "#fcd34d" },
  danger: { line: "#f87171", bg: "rgba(248,113,113,.10)", text: "#fca5a5" },
  info: { line: "#38bdf8", bg: "rgba(56,189,248,.10)", text: "#7dd3fc" },
};

function StatusLine({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  const palette = TONES[tone] ?? TONES.neutral;
  return <div style={{
    padding: "9px 11px",
    border: `1px solid ${palette.line}`,
    borderLeftWidth: 3,
    borderRadius: 8,
    background: palette.bg,
    color: palette.text,
    fontSize: 11.5,
    lineHeight: 1.45,
  }}>{children}</div>;
}

/* Ham `<input type="file">` tarayıcı diline göre "Dosya seçilmedi" basar ve buton dilimizin
 * dışında kalır. Etiket-buton sarmalayıcısı aynı işi yapar, seçilen dosyanın adını gösterir. */
function FilePick({ label, accept, expected, onPick, onError }: {
  label: string;
  accept: string;
  expected?: string[];
  onPick: (content: string) => void;
  onError: (message: string) => void;
}) {
  const [fileName, setFileName] = useState("");
  return <label style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    height: 26, padding: "0 9px", borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.045)",
    color: "rgba(255,255,255,0.62)", font: "650 11px/1 inherit", cursor: "pointer",
    overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
  }}>
    <Upload size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
    {fileName || label}
    <input
      type="file"
      accept={accept}
      style={{ display: "none" }}
      onChange={(event) => {
        const file = event.target.files?.[0];
        void readTextFile(file, expected)
          .then((content) => { setFileName(file?.name ?? ""); onPick(content); })
          .catch((error) => onError(extractUserMessage(error)));
      }}
    />
  </label>;
}

/* Kanıt rayının bölümü. Ray kalıcıdır: kapalı soru ancak kanıt görünürken cevaplanabilir,
 * bu yüzden bölümler sohbetin yerine geçen bir sekme değil, yanında duran bir sütundur. */
function RailSection({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section style={{ display: "grid", gap: 9, padding: "13px 14px", borderBottom: `1px solid ${BORDER}` }}>
    <div>
      <div style={{ color: "rgba(255,255,255,.72)", fontSize: 11.5, fontWeight: 700, letterSpacing: ".03em", textTransform: "uppercase" }}>{title}</div>
      {subtitle ? <div style={{ color: "rgba(255,255,255,.28)", fontSize: 10.5, marginTop: 2 }}>{subtitle}</div> : null}
    </div>
    {children}
  </section>;
}

/* Snapshot etiketi: içerik ilk görüldüğü anla (`creationTime`) tanımlanır, kimlik
 * kısa kanonik hash'tir. Geçersiz tarih sessizce "Invalid Date" basmak yerine
 * hash'e düşer — kullanıcı yine de satırı ayırt edebilmelidir. */
function formatSnapshotLabel(snapshot: SpecSnapshotHeaderDto): string {
  /* Üretilmiş tipte her alan opsiyoneldir (Swagger "required" işaretlemiyor). Etiket bu
   * yüzden eksik alana dayanıklı kurulur: hiçbiri yoksa bile satır ayırt edilebilir kalır. */
  const hash = snapshot.shortCanonicalHash ?? snapshot.id ?? "kimliksiz";
  const captured = snapshot.creationTime ? new Date(snapshot.creationTime) : null;
  const stamp = captured && !Number.isNaN(captured.getTime())
    ? captured.toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })
    : hash;
  return [stamp, snapshot.formatCode, hash].filter(Boolean).join(" · ");
}

async function readTextFile(file: File | undefined, expectedNames?: string[]) {
  if (!file) return "";
  if (expectedNames && !expectedNames.includes(file.name.toLocaleLowerCase("tr-TR"))) throw new Error(`Dosya adı ${expectedNames.join(" veya ")} olmalı.`);
  return file.text();
}

const LAYOUT_STORAGE_KEY = "ptn-authoring-layout";
const RAIL_MIN = 260;
const RAIL_MAX = 620;
const DOCK_MIN = 120;
const DOCK_MAX = 620;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface WorkbenchLayout { railWidth: number; dockHeight: number; isDockCollapsed: boolean }
const DEFAULT_LAYOUT: WorkbenchLayout = { railWidth: 340, dockHeight: 268, isDockCollapsed: false };

/* Yerleşim ölçüleri render sırasında bir kez okunur. Bu güvenlidir çünkü `TestPage` oturum
 * yokken `null` döner: bileşen sunucuda hiç render edilmez, yalnız hidrasyondan sonra
 * istemcide monte olur. Effect içinde okumak hem gereksiz ikinci render üretirdi hem de
 * `react-hooks/set-state-in-effect` kuralını ihlal ederdi. */
function readStoredLayout(): WorkbenchLayout {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  const stored = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!stored) return DEFAULT_LAYOUT;
  try {
    const layout = JSON.parse(stored) as Partial<WorkbenchLayout>;
    return {
      railWidth: clamp(typeof layout.railWidth === "number" ? layout.railWidth : DEFAULT_LAYOUT.railWidth, RAIL_MIN, RAIL_MAX),
      dockHeight: clamp(typeof layout.dockHeight === "number" ? layout.dockHeight : DEFAULT_LAYOUT.dockHeight, DOCK_MIN, DOCK_MAX),
      isDockCollapsed: layout.isDockCollapsed === true,
    };
  } catch {
    /* Bozuk kayıt yerleşimi engellememeli; varsayılan ölçülere düşülür. */
    return DEFAULT_LAYOUT;
  }
}

/* Ayraç — IDE'deki gibi sürüklenerek bölme boyutlandırır. Sürükleme window seviyesinde
 * dinlenir: imleç ayracın dar kutusundan çıksa da olay akmaya devam eder. Aynı desen
 * `floating-agent` sürüklemesinde de kullanılıyor. */
function Splitter({ axis, onDrag }: { axis: "x" | "y"; onDrag: (delta: number) => void }) {
  const [isActive, setIsActive] = useState(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    let last = axis === "x" ? event.clientX : event.clientY;
    setIsActive(true);

    /* Delta ARTIMLIDIR (son konuma göre), sürükleme başlangıcına göre değil: çağıran onu
     * mevcut ölçüye ekler. Sınıra dayanınca büyüme durur, geri gelince anında yanıt verir. */
    function onMove(moveEvent: PointerEvent) {
      const current = axis === "x" ? moveEvent.clientX : moveEvent.clientY;
      onDrag(current - last);
      last = current;
    }
    function onEnd() {
      setIsActive(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  const isVertical = axis === "x";
  return <div
    aria-hidden
    onPointerDown={handlePointerDown}
    style={{
      flex: "0 0 auto",
      width: isVertical ? 5 : "100%",
      height: isVertical ? "100%" : 5,
      cursor: isVertical ? "col-resize" : "row-resize",
      background: isActive ? ACC : "transparent",
      borderLeft: isVertical ? `1px solid ${BORDER}` : undefined,
      borderTop: isVertical ? undefined : `1px solid ${BORDER}`,
      transition: "background 120ms ease",
      touchAction: "none",
    }}
  />;
}

/* Satır kümesi karşılaştırması — LCS değil. Onay kartındaki "ne değişecek" sorusunun
 * cevabı "hangi satırlar eklendi"dir; taşınan satırı değişmiş göstermemek için küme
 * farkı yeterlidir ve yanıltıcı bir hizalama üretmez. */
function markAddedLines(previous: string, current: string): { text: string; isAdded: boolean }[] {
  const previousLines = new Set(previous.split("\n"));
  return current.split("\n").map((text) => ({ text, isAdded: text.trim().length > 0 && !previousLines.has(text) }));
}

export function AuthoringTab() {
  const {
    authoringSession,
    startAuthoringSession,
    answerAuthoringQuestion,
    addDatabaseAuthoringStep,
    uploadContext,
    conversation,
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
  /* Hiçbir alan hazır değerle gelmez. Otomatik dolan bir alan kullanıcıya "burası zaten
   * doğru" der; oysa bu değerler senaryonun kimliğini kurar ve yayın kapısında karşılaştırılır.
   * Boş başlamak, her değerin bilinçli girildiğini garanti eder. */
  const [workflowId, setWorkflowId] = useState("");
  const [workflowSummary, setWorkflowSummary] = useState("");
  const [scenarioKey, setScenarioKey] = useState("");
  const [title, setTitle] = useState("");
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
  const [engines, setEngines] = useState<LookupCommonDto[]>([]);
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);

  /* Kanıt rayı — grounding'den gelen opak referanslar ve çözülmüş tanımları. */
  const [operations, setOperations] = useState<OperationSuggestionDto[]>([]);
  const [operationFilter, setOperationFilter] = useState("");
  const [tableCandidates, setTableCandidates] = useState<string[]>([]);
  const [tableDescription, setTableDescription] = useState<TableDescriptionDto | null>(null);
  /* Aday referansların çözülmüş adları: `referenceId → şema.tablo`. Sunucu kapalı soru
   * seçeneklerini yalnız kimlik olarak veriyor; ad her kimlik için ayrı bir zemin
   * sorgusuyla elde edilir ve burada saklanır ki liste tekrar tekrar sorulmasın. */
  const [tableLabels, setTableLabels] = useState<Record<string, string>>({});
  const [selectedOperation, setSelectedOperation] = useState<OperationSuggestionDto | null>(null);
  const [groundNote, setGroundNote] = useState<string | null>(null);

  /* Sözleşme hedefi: canlı servisten o an yakalanan görüntü mü, kayıtlı bir görüntü mü.
   * API Contract kıyaslama ekranıyla aynı ikili seçim. */
  const [contractMode, setContractMode] = useState<"live" | "snapshot">("snapshot");

  /* Belge paneli. */
  const [dockTab, setDockTab] = useState("steps");
  const previousDocument = useRef("");
  const [documentBaseline, setDocumentBaseline] = useState("");

  /* DB adım formu — matcher listesi tablo tanımından, operasyon kodu kapalı kümeden. */
  const [dbStepId, setDbStepId] = useState("");
  const [dbOperationCode, setDbOperationCode] = useState("");
  const [dbKeyColumn, setDbKeyColumn] = useState("");
  const [dbKeyValue, setDbKeyValue] = useState("");
  const [dbExpectations, setDbExpectations] = useState<AuthoringExpectationDto[]>([]);
  /* Süreler de boş başlar. Sunucu 0'ı "verilmedi" sayar (`GreaterThan(0).When(!= 0)`),
   * yani boş bırakmak geçerli bir seçimdir; varsayılan dayatmayız. */
  const [dbTimeoutMs, setDbTimeoutMs] = useState("");
  const [dbPollIntervalMs, setDbPollIntervalMs] = useState("");

  /* IDE yerleşimi: sol gezgin ve alt terminal sürüklenerek boyutlanır, boyutlar sekme
   * değişse de korunur. Değerler localStorage'da tutulur — bileşen her sekme geçişinde
   * yeniden monte olur ve kullanıcı ölçüyü ikinci kez ayarlamak zorunda kalmamalıdır. */
  const [{ railWidth, dockHeight, isDockCollapsed }, setLayout] = useState<WorkbenchLayout>(readStoredLayout);

  const { data: granted = emptyGrantedPermissions } = usePermissionsQuery();
  /* Kaynak yazma izni checker izin ağacından gelir; izin yoksa buton çizilmez ve hiçbir
   * istek üretilmez. Bağlantı tarafında bu depoda checked-in bir izin sabiti yok —
   * `connections-page-view` de "Yeni Bağlantı"yı koşulsuz gösteriyor; kardeş davranış
   * korunuyor, uydurma izin adı eklenmiyor. */
  const canManageSources = hasPermission(granted, Permissions.sources.manage);

  const selectedSource = sources.find((item) => item.id === sourceId);
  const activeDocuments = selectedSource?.documents?.filter((item) => item.isActive) ?? [];
  const selectedSnapshot = snapshots.find((item) => item.id === snapshotId);
  const selectedProfile = profiles.find((item) => item.profileKey === profileKey);
  const unanswered = authoringSession?.questions.filter((question) => !authoringSession.answers[question.questionCode]) ?? [];
  const stepCount = (authoringSession?.steps.length ?? 0) + (authoringSession?.databaseSteps.length ?? 0);
  const canStart = Boolean(rulesSeal && uploadedScenarioText === scenarioText && scenarioText.trim() && profileKey && snapshotId && connectionId && workflowId.trim() && workflowSummary.trim());
  /* Anahtar ve başlık artık hazır gelmediği için kalıcılaştırma koşuluna girer: boş
   * gönderilirse istek sunucu doğrulamasında düşerdi. */
  const canPersist = Boolean(compile?.isSchemaValid && authoringSession && stepCount > 0 && unanswered.length === 0 && rulesSeal && selectedSnapshot && selectedProfile && scenarioKey.trim() && title.trim());
  const filteredOperations = operations.filter((item) => {
    const needle = operationFilter.trim().toLocaleLowerCase("tr-TR");
    return !needle || `${item.sourceMethod} ${item.sourcePath} ${item.sourceOperationId ?? ""}`.toLocaleLowerCase("tr-TR").includes(needle);
  });

  /* Opak referansı insan-okur adrese çeviren tek eşleşme kaynağı grounding aday listesidir;
   * onay kartı uuid yerine `METHOD /path` gösterebilsin diye aşağı taşınır. */
  const operationLabels = useMemo(
    () => new Map(operations.map((item) => [item.referenceId, `${item.sourceMethod.toLocaleUpperCase("tr-TR")} ${item.sourcePath}`])),
    [operations],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([
      sourcesApi.list(0, 1_000),
      dbApi.connections.list({ skipCount: 0, maxResultCount: 1000 }),
      testApi.authoring.listProfilePacks(),
      /* Motor lookup'ı yalnız bağlantı ekleme modali için gerekli; envanterle birlikte
       * bir kez alınır ki modal açılışı ikinci bir bekleme üretmesin. */
      dbApi.lookups.list("database-engines", { skipCount: 0, maxResultCount: 100 }),
    ]).then(([sourcePage, connectionPage, profileItems, enginePage]) => {
      if (!active) return;
      const nextSources = (sourcePage.items ?? []).filter((item) => item.isActive);
      const nextConnections = connectionPage.items.filter((item) => item.isActive);
      setSources(nextSources);
      setConnections(nextConnections);
      setProfiles(profileItems);
      setEngines(enginePage.items);
      /* İlk kayıt seçili GELMEZ: envanterde birden çok kaynak varken ilkini seçmek,
       * kullanıcı fark etmeden yanlış sözleşmeyle mühür üretmesine yol açar. */
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
    void sourcesApi.snapshots(sourceId, documentId, 0, 200)
      .then((page) => {
        if (!active) return;
        setSnapshots(page.items ?? []);
        setSnapshotId("");
      })
      .catch((requestError) => active && setError(extractUserMessage(requestError, "Snapshot listesi yüklenemedi.")));
    return () => { active = false; };
  }, [documentId, sourceId]);

  /* Ölçü her değiştiğinde geri yazılır: sekme değiştirip döndüğünde bölmeler aynı kalır. */
  useEffect(() => {
    window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({ railWidth, dockHeight, isDockCollapsed }));
  }, [dockHeight, isDockCollapsed, railWidth]);

  /* Belge her değiştiğinde bir önceki hâli taban çizgisi olur; Arazzo sekmesi eklenen
   * satırları bu tabana göre işaretler. */
  useEffect(() => {
    const current = authoringSession?.sourceDocument ?? "";
    if (current === previousDocument.current) return;
    setDocumentBaseline(previousDocument.current);
    previousDocument.current = current;
  }, [authoringSession?.sourceDocument]);

  /* Ekleme modalleri kapandığında envanter yeniden okunur ve YENİ kayıt seçili hâle gelir:
   * kullanıcı eklediği şeyi ayrıca aramak zorunda kalmamalı. Mevcut seçim korunur. */
  async function refreshSources() {
    try {
      const page = await sourcesApi.list(0, 1_000);
      const nextSources = (page.items ?? []).filter((item) => item.isActive);
      setSources(nextSources);
      const added = nextSources.find((item) => !sources.some((existing) => existing.id === item.id));
      if (added) {
        setSnapshots([]); setSnapshotId("");
        setSourceId(added.id ?? "");
        setDocumentId(added.documents?.find((item) => item.isActive)?.id ?? "");
      }
    } catch (requestError) { setError(extractUserMessage(requestError, "Kaynak listesi yenilenemedi.")); }
  }

  async function refreshConnections() {
    try {
      const page = await dbApi.connections.list({ skipCount: 0, maxResultCount: 1000 });
      const nextConnections = page.items.filter((item) => item.isActive);
      setConnections(nextConnections);
      /* Yalnız YENİ eklenen kayıt seçilir; bu kullanıcının az önceki eyleminin sonucudur,
       * hazır değer değildir. Ekleme olmadıysa seçim kullanıcıda kalır. */
      const added = nextConnections.find((item) => !connections.some((existing) => existing.id === item.id));
      if (added) setConnectionId(added.id);
    } catch (requestError) { setError(extractUserMessage(requestError, "Bağlantı listesi yenilenemedi.")); }
  }

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

  /* Köprü zemini — opak referansların TEK kaynağı. Referans verilmezse aday listesi ve
   * kapalı sorular döner; verilirse o referansın çözülmüş tanımı gelir. */
  async function ground(input: { operationReferenceId?: string; tableReferenceId?: string }) {
    if (!profileKey || !snapshotId || !connectionId) { setError("Zemin sorgusu için profil, snapshot ve bağlantı seçin."); return; }
    setBusy("ground"); setError(null); setGroundNote(null);
    try {
      const result = await testApi.bridge.ground({
        profileKey,
        specSnapshotId: snapshotId,
        connectionId,
        operationReferenceId: input.operationReferenceId ?? null,
        tableReferenceId: input.tableReferenceId ?? null,
        stepIntent: scenarioText.trim().slice(0, 4_000) || workflowSummary.trim(),
        responseFormat: "detailed",
        hasExclusiveSandbox: false,
        sessionId: authoringSession?.id ?? null,
      });
      setOperations(result.operationBinding?.suggestions ?? []);
      if (result.tableDescription) setTableDescription(result.tableDescription);
      /* Tablo adayları kapalı sorunun seçenekleridir ve opak referanslardır: sunucu bu
       * listeyi profil paketinin ONAYLI bağlarından üretir. Ad çözümü ancak referansla
       * ikinci bir zemin sorgusu yapılınca gelir. */
      const tableQuestion = result.questions.find((question) => question.questionCode.startsWith("TABLE_SELECTION"));
      const candidates = tableQuestion?.options ?? [];
      setTableCandidates(candidates);
      if (input.operationReferenceId) setSelectedOperation(operations.find((item) => item.referenceId === input.operationReferenceId) ?? result.operationBinding?.suggestions[0] ?? null);
      /* Adaylar geldiği anda adları çözülür: kullanıcıya guid seçtirmek, seçimi kanıta
       * dayandırma kuralının pratikte çiğnenmesi olurdu. */
      if (candidates.length > 0) void resolveTableLabels(candidates);
      setGroundNote(`${result.decisionCode} · ${result.criticalFactCode} · kapsam ${result.coverage.boundCount}/${result.coverage.requiredCount}`);
    } catch (requestError) { setError(extractUserMessage(requestError, "Zemin sorgusu yapılamadı.")); }
    finally { setBusy(null); }
  }

  /* Canlı hedef: kaynaktan O AN yeni bir görüntü alınır ve mühür ona bağlanır. Mühür
   * somut bir snapshot kimliği ister; "canlı" soyut bir hedef olarak saklanamaz. Aynı
   * çözüm API Contract kıyaslamasında da kullanılıyor (`prepareLiveTarget`). */
  async function captureLiveSnapshot() {
    if (!sourceId || !documentId) { setError("Canlı yakalama için kaynak ve doküman seçin."); return; }
    setBusy("capture"); setError(null);
    try {
      const captured = await sourcesApi.takeSnapshot(sourceId, documentId);
      const page = await sourcesApi.snapshots(sourceId, documentId, 0, 200);
      setSnapshots(page.items ?? []);
      setSnapshotId(captured.id ?? "");
    } catch (requestError) { setError(extractUserMessage(requestError, "Canlı sözleşme yakalanamadı.")); }
    finally { setBusy(null); }
  }

  /* Aday kimliğinin adını çözer. Sunucu kapalı soru seçeneğini etiketsiz veriyor; ad,
   * o kimlikle yapılan zemin sorgusunun `tableDescription` alanından gelir. Sonuç
   * önbelleğe alınır, seçili tablo durumu bu çağrıdan ETKİLENMEZ. */
  async function resolveTableLabels(candidates: string[]) {
    const pending = candidates.filter((reference) => !tableLabels[reference]);
    if (pending.length === 0 || !profileKey || !snapshotId || !connectionId) return;
    for (const reference of pending) {
      try {
        const result = await testApi.bridge.ground({
          profileKey,
          specSnapshotId: snapshotId,
          connectionId,
          tableReferenceId: reference,
          stepIntent: scenarioText.trim().slice(0, 4_000) || workflowSummary.trim() || "tablo adı çözümlemesi",
          /* `detailed` bilinçli: `concise` biçimin sözleşmesi ağır gövdeyi kaynak adresine
           * taşımaktır. Bugünkü sunucu tanımı yine de gövdede döndürüyor ama ada bağlanmak
           * bu ekranı sunucunun ileride yapacağı bir sadeleştirmeye karşı kırılgan yapardı. */
          responseFormat: "detailed",
          hasExclusiveSandbox: false,
          sessionId: authoringSession?.id ?? null,
        });
        const described = result.tableDescription;
        if (described) setTableLabels((items) => ({ ...items, [reference]: `${described.dbSchemaName}.${described.tableName}` }));
      } catch {
        /* Tek adayın adı çözülemezse liste kimlikle çalışmaya devam eder; bu, kanıt
         * toplanamaması durumudur ve "yetki yok" diye gösterilmez. */
      }
    }
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

  async function addDatabaseStep() {
    if (!tableDescription) { setError("Önce bir tablo referansını çözün."); return; }
    if (!dbStepId.trim()) { setError("Adım kimliği zorunludur."); return; }
    if (!dbOperationCode) { setError("Ne doğrulanacağını seçin."); return; }
    setBusy("dbstep"); setError(null);
    try {
      await addDatabaseAuthoringStep({
        stepId: dbStepId.trim(),
        tableReferenceId: tableDescription.tableReferenceId,
        operationCode: dbOperationCode,
        keyBindings: dbKeyColumn ? { [dbKeyColumn]: dbKeyValue || null } : {},
        expectations: dbExpectations,
        /* Boş alan sunucuya 0 gider: "verilmedi" anlamına gelir ve doğrulamayı geçer. */
        timeoutMs: Number(dbTimeoutMs) || 0,
        pollIntervalMs: Number(dbPollIntervalMs) || 0,
      });
      setDbExpectations([]);
      setDockTab("steps");
    } catch (requestError) { setError(extractUserMessage(requestError, "Veritabanı adımı eklenemedi.")); }
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
          /* `specFingerprint` GÖNDERİLMEZ: sunucu onu snapshot'ın tam
           * `SpecContent.CanonicalHash` değerinden türetir. Buradaki header DTO
           * yalnız KISA hash taşır; gönderilseydi mühür eşleşme kapısına takılırdı. */
          dbConnectionId: connectionId,
          /* `dbSchemaFingerprint` de GÖNDERİLMEZ: sunucu bağlantının O ANKİ şema
           * parmak izini `GetSchemaFingerprintAsync(connectionId)` ile okuyup uygular.
           * Buradaki değer profil paketi üretildiği ANA aittir; şema o günden beri
           * değiştiyse `ApplyDbSchemaFingerprint` uyuşmazlık görüp `InvalidHash` atar.
           * `rulesFingerprint` ise bilinçli GÖNDERİLİR: mühürlediğimiz kural metni hâlâ
           * kanonik kaynaktaki metinse eşleşir, araya başka biri yazdıysa istek durur. */
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

  const dockTabs = [
    { key: "steps", label: `Adımlar${stepCount ? ` · ${stepCount}` : ""}`, icon: ListChecks },
    { key: "questions", label: `Sorular${unanswered.length ? ` · ${unanswered.length}` : ""}`, icon: Check },
    { key: "dbstep", label: "DB adımı", icon: Database },
    { key: "arazzo", label: "Arazzo", icon: Braces },
    { key: "gates", label: "Yayın", icon: ShieldCheck },
  ];

  return <div style={{ height: "calc(100dvh - 54px)", display: "grid", gridTemplateRows: "auto minmax(0,1fr) auto", background: "#0d0f14" }}>

    {/* ── ÜST ŞERİT — telemetri tek satırda ve kalıcı (G-06/G-07) ── */}
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${BORDER}`, overflowX: "auto" }}>
      {progress.map((item, index) => <span key={item.label} style={{ flex: "0 0 auto", padding: "4px 9px", borderRadius: 7, background: item.done ? "rgba(74,222,128,.09)" : "rgba(255,255,255,.035)", color: item.done ? "#4ade80" : "rgba(255,255,255,.35)", fontSize: 11, fontWeight: 650 }}>{item.done ? "✓ " : `${index + 1}. `}{item.label}</span>)}
      <span style={{ flex: 1 }} />
      {rulesSeal ? <span style={{ flex: "0 0 auto", color: "rgba(255,255,255,.32)", fontSize: 10.5 }}>kural mührü <code>{rulesSeal.fingerprint.slice(0, 12)}</code></span> : null}
      {selectedProfile ? <span style={{ flex: "0 0 auto", color: selectedProfile.approvedBindingCount === selectedProfile.bindingCount ? "#4ade80" : "#fbbf24", fontSize: 10.5 }}>{selectedProfile.approvedBindingCount}/{selectedProfile.bindingCount} onaylı bağ</span> : null}
    </div>

    {error ? <div style={{ padding: "8px 14px 0" }}><StatusLine tone="danger">{error}</StatusLine></div> : null}

    {/* ── GÖVDE — solda kalıcı kanıt rayı, ortada sabit sohbet çapası, aralarında ayraç ── */}
    <div style={{ display: "flex", minHeight: 0 }}>
      <aside style={{ flex: `0 0 ${railWidth}px`, width: railWidth, minHeight: 0, overflowY: "auto", background: "#0b0d12" }}>

        <RailSection title="1 · Malzeme" subtitle="Ajanın okuyacağı iki metin. Kurallar mühürlenir; mühür yayın kapısında karşılaştırılır.">
          <Field label="Senaryo metni" hint="İnsan diliyle iş akışı. Yalnız ajanın bağlamına girer, mühürlenmez." action={<FilePick label="senaryo.md seç" accept=".md,text/markdown,text/plain" expected={["senaryo.md"]} onPick={setScenarioText} onError={setError} />}>
            <textarea value={scenarioText} onChange={(event) => setScenarioText(event.target.value)} placeholder="Hangi akış, kimler, beklenen sonuç ne?" style={{ ...FIELD, minHeight: 84, resize: "vertical" }} />
          </Field>
          <Field label="İş kuralları" hint="Kanonik kaynağa yazılır ve mühürlenir. Metni değiştirirseniz mühür düşer." action={<FilePick label="kurallar.md seç" accept=".md,text/markdown,text/plain" expected={["kurallar.md"]} onPick={(value) => { setRulesText(value); setRulesSeal(null); }} onError={setError} />}>
            <textarea value={rulesText} onChange={(event) => { setRulesText(event.target.value); setRulesSeal(null); }} placeholder="Değişmezler: neyin her zaman doğru olması gerekiyor?" style={{ ...FIELD, minHeight: 84, resize: "vertical" }} />
          </Field>
          <Btn block label={rulesSeal ? "Mühürlendi — yeniden gönder" : "Mühürle ve ajana yükle"} icon={Upload} variant={rulesSeal ? "ghost" : "accent-dim"} loading={busy === "materials"} onClick={() => void saveMaterials()} />
          {rulesSeal ? <StatusLine tone="success">Kural mührü alındı · <code>{rulesSeal.fingerprint.slice(0, 20)}</code> · {rulesSeal.byteCount.toLocaleString("tr-TR")} bayt</StatusLine> : null}
        </RailSection>

        <RailSection title="2 · Sözleşme" subtitle="Testin dayanacağı API sözleşmesinin hangi anı olduğunu seçin.">
          {sources.length === 0
            ? <StatusLine tone="danger">Kayıtlı aktif API kaynağı yok.{canManageSources ? " \"Yeni\" ile bir kaynak ekleyin." : " Eklemek için kaynak yönetimi izni gerekir."}</StatusLine>
            : null}
          <Field label="Kaynak" action={canManageSources ? <Btn label="Yeni" icon={Plus} small onClick={() => setSourceDialogOpen(true)} /> : undefined}>
            <select value={sourceId} onChange={(e) => { const id = e.target.value; const source = sources.find((item) => item.id === id); setSnapshots([]); setSnapshotId(""); setSourceId(id); setDocumentId(source?.documents?.find((item) => item.isActive)?.id ?? ""); }} style={FIELD}>
              <option value="">— seçin —</option>
              {sources.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Doküman" hint={sourceId && activeDocuments.length === 0 ? "Bu kaynakta aktif doküman tanımlı değil." : undefined}>
            <select value={documentId} onChange={(e) => { setSnapshots([]); setSnapshotId(""); setDocumentId(e.target.value); }} style={FIELD} disabled={!sourceId || activeDocuments.length === 0}>
              <option value="">{!sourceId ? "— önce kaynak seçin —" : activeDocuments.length === 0 ? "— aktif doküman yok —" : "— seçin —"}</option>
              {activeDocuments.map((item) => <option key={item.id} value={item.id}>{item.documentName} · {item.path}</option>)}
            </select>
          </Field>
          {/* Hedef ikili seçim: canlı servisten şimdi yakala, ya da kayıtlı bir görüntü seç.
              Mühür somut bir snapshot kimliğine bağlandığı için "canlı" da bir yakalama
              üretir — soyut hedef saklanamaz. */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4, borderRadius: 9, background: "rgba(255,255,255,.035)" }}>
            {([
              { key: "live" as const, icon: RadioTower, title: "Canlı", hint: "şimdi yakala" },
              { key: "snapshot" as const, icon: History, title: "Kayıtlı", hint: "geçmişten seç" },
            ]).map((mode) => {
              const Icon = mode.icon;
              const selected = contractMode === mode.key;
              return <button key={mode.key} type="button" onClick={() => { setContractMode(mode.key); setSnapshotId(""); }}
                style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", borderRadius: 7, background: selected ? "rgba(240,160,32,.14)" : "transparent", border: `1px solid ${selected ? ACC : "transparent"}` }}>
                <Icon size={14} strokeWidth={2} color={selected ? ACC : "rgba(255,255,255,.35)"} />
                <span style={{ display: "grid" }}>
                  <span style={{ color: selected ? "#f3f4f6" : "rgba(255,255,255,.5)", fontSize: 11.5, fontWeight: 700 }}>{mode.title}</span>
                  <span style={{ color: "rgba(255,255,255,.3)", fontSize: 9.5 }}>{mode.hint}</span>
                </span>
              </button>;
            })}
          </div>

          {contractMode === "live" ? <>
            <Btn block label={snapshotId ? "Yeniden yakala" : "Sözleşmeyi şimdi yakala"} icon={RadioTower} variant={snapshotId ? "ghost" : "accent-dim"} loading={busy === "capture"} disabled={!documentId} onClick={() => void captureLiveSnapshot()} />
            {snapshotId && selectedSnapshot
              ? <StatusLine tone="success">Canlı görüntü alındı · {formatSnapshotLabel(selectedSnapshot)}</StatusLine>
              : <StatusLine tone="info">Canlı seçimde sözleşme servisten o an okunur ve donmuş bir görüntüye çevrilir; mühür bu görüntüye bağlanır.</StatusLine>}
          </> : <>
            <Field label="Snapshot">
              <select value={snapshotId} onChange={(e) => setSnapshotId(e.target.value)} style={FIELD} disabled={!documentId || snapshots.length === 0}>
                <option value="">{!documentId ? "— önce doküman seçin —" : snapshots.length === 0 ? "— kayıtlı görüntü yok —" : "— seçin —"}</option>
                {snapshots.map((item) => <option key={item.id} value={item.id}>{formatSnapshotLabel(item)}</option>)}
              </select>
            </Field>
            {documentId && snapshots.length === 0
              ? <StatusLine tone="warning">Bu dokümanın kayıtlı görüntüsü yok. &quot;Canlı&quot; seçip şimdi yakalayabilirsiniz.</StatusLine>
              : <StatusLine tone="info">Sözleşmenin donmuş hâli — mühür bunun kanonik hash&apos;inden üretilir.</StatusLine>}
          </>}
        </RailSection>

        <RailSection title="3 · Operasyonlar" subtitle="Adımların bağlanacağı uçlar. Ajanın gördüğü adaylar tam olarak bu listedir.">
          <div style={{ display: "flex", gap: 6 }}>
            <input value={operationFilter} onChange={(e) => setOperationFilter(e.target.value)} placeholder="metot veya yol ara" style={{ ...FIELD, minHeight: 26 }} />
            <Btn label="Listele" small loading={busy === "ground"} disabled={!profileKey || !snapshotId || !connectionId} onClick={() => void ground({})} />
          </div>
          {operations.length === 0
            ? <StatusLine>{!profileKey || !snapshotId || !connectionId
              ? "Listelemek için önce sözleşme, veritabanı ve profil seçilmeli."
              : "Henüz listelenmedi. Listele'ye basın; adaylar sunucudan gelir."}</StatusLine>
            : <div style={{ display: "grid", gap: 4, maxHeight: 190, overflowY: "auto" }}>
              {filteredOperations.map((item) => (
                <button key={item.referenceId} onClick={() => void ground({ operationReferenceId: item.referenceId })} type="button"
                  style={{ all: "unset", cursor: "pointer", padding: "6px 8px", borderRadius: 7, border: `1px solid ${BORDER}`, background: "rgba(255,255,255,.02)" }}>
                  <div style={{ color: "#e5e7eb", fontSize: 11.5 }}><b style={{ color: ACC }}>{item.sourceMethod.toLocaleUpperCase("tr-TR")}</b> {item.sourcePath}</div>
                  <div style={{ color: "rgba(255,255,255,.26)", fontSize: 9.5 }}>{item.sourceOperationId ?? "operationId yok"} · skor {item.score}</div>
                </button>
              ))}
            </div>}
          {groundNote ? <StatusLine>{groundNote}</StatusLine> : null}
        </RailSection>

        <RailSection title="4 · Veritabanı" subtitle="Kalıcılık iddiasının doğrulanacağı tablo. Adaylar profil paketinin onaylı bağlarından gelir.">
          <Field label="Bağlantı" action={<Btn label="Yeni" icon={Plus} small onClick={() => setConnectionDialogOpen(true)} />}>
            <select value={connectionId} onChange={(e) => setConnectionId(e.target.value)} style={FIELD} disabled={connections.length === 0}>
              <option value="">{connections.length === 0 ? "— bağlantı yok —" : "— seçin —"}</option>
              {connections.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.databaseName}</option>)}
            </select>
          </Field>
          {connections.length === 0
            ? <StatusLine tone="danger">Kayıtlı aktif bağlantı yok. Veritabanı kanıtı olmadan yazarlık oturumu başlatılamaz — &quot;Yeni&quot; ile bir bağlantı ekleyin.</StatusLine>
            : null}

          {/* Tablo adayları ancak bir OPERASYON seçildikten sonra üretilir: DB adımı, API
              adımının ne yazdığını doğrular; hangi operasyonun koştuğu bilinmeden hangi
              tablonun doğrulanacağı da tanımsızdır. Sıra bu yüzden zorunludur. */}
          {tableCandidates.length === 0 && connectionId
            ? <StatusLine tone={selectedOperation ? "warning" : "info"}>
              {selectedOperation
                ? `${selectedOperation.sourceMethod.toLocaleUpperCase("tr-TR")} ${selectedOperation.sourcePath} için onaylı tablo bağı bulunamadı. Profil paketinde bu kavramı bağlayın.`
                : "Tablo adayları, 3 · Operasyonlar'dan bir operasyon seçtiğinizde gelir: veritabanı adımı o operasyonun ne yazdığını doğrular."}
            </StatusLine>
            : null}

          {tableCandidates.length > 0 ? <div style={{ display: "grid", gap: 4 }}>
            {tableCandidates.map((reference) => {
              const label = tableLabels[reference];
              const isSelected = tableDescription?.tableReferenceId === reference;
              return <button key={reference} onClick={() => void ground({ tableReferenceId: reference })} type="button"
                style={{ all: "unset", cursor: "pointer", padding: "6px 8px", borderRadius: 7, border: `1px solid ${isSelected ? ACC : BORDER}`, background: isSelected ? "rgba(240,160,32,.08)" : "rgba(255,255,255,.02)" }}>
                <div style={{ color: label ? "#e5e7eb" : "rgba(255,255,255,.45)", fontSize: 11.5, fontWeight: label ? 650 : 400 }}>
                  {label ?? "adı çözülüyor…"}
                </div>
                <code style={{ color: "rgba(255,255,255,.22)", fontSize: 9 }}>{reference}</code>
              </button>;
            })}
          </div> : null}
          {tableDescription ? <StatusLine tone="success">Çözüldü: {tableDescription.dbSchemaName}.{tableDescription.tableName} · {tableDescription.assertableFields.length} doğrulanabilir kolon</StatusLine> : null}
        </RailSection>

        <RailSection title="5 · Profil paketi" subtitle="İş kavramlarını veritabanı şemasına bağlar. Bağlanmamış kavram, yazılamayan adım demektir.">
          <Field label="Paket">
            <select value={profileKey} onChange={(e) => setProfileKey(e.target.value)} style={FIELD}>
              <option value="">{profiles.length === 0 ? "— kayıtlı paket yok —" : "— seçin —"}</option>
              {profiles.map((item) => <option key={item.profileKey} value={item.profileKey}>{item.profileKey} · {item.approvedBindingCount}/{item.bindingCount} bağlı</option>)}
            </select>
          </Field>
          {selectedProfile
            ? <StatusLine tone={selectedProfile.approvedBindingCount === selectedProfile.bindingCount ? "success" : "warning"}>{selectedProfile.approvedBindingCount}/{selectedProfile.bindingCount} kavram şemaya bağlı · {selectedProfile.evidencePathCount} kanıt yolu</StatusLine>
            : null}
          <Field label="Yeni paket yükle" hint="Anahtar ve YAML birlikte gerekir." action={<FilePick label="YAML seç" accept=".yaml,.yml,text/yaml" onPick={setProfileYaml} onError={setError} />}>
            <input value={profileUploadKey} onChange={(e) => setProfileUploadKey(e.target.value)} placeholder="paket anahtarı" style={FIELD} />
            <textarea value={profileYaml} onChange={(e) => setProfileYaml(e.target.value)} placeholder="paket içeriği (YAML)" style={{ ...FIELD, minHeight: 56, resize: "vertical" }} />
          </Field>
          <Btn block label="Paketi kaydet" icon={Save} small loading={busy === "profile"} disabled={!profileUploadKey.trim() || !profileYaml.trim()} onClick={() => void uploadProfile()} />
        </RailSection>

        <RailSection title="6 · İş akışı" subtitle="Adı ve özeti siz verirsiniz; adresler seçimlerinizden üretilir ve yayın kapısında karşılaştırılır.">
          <Field label="Akış kimliği" hint="Senaryo anahtarı da bu değerle başlar."><input value={workflowId} onChange={(e) => { setWorkflowId(e.target.value); setScenarioKey(e.target.value); }} placeholder="örn. siparis-onay-akisi" style={FIELD} /></Field>
          <Field label="Akış özeti" hint="Tek cümleyle bu akış neyi doğruluyor?"><input value={workflowSummary} onChange={(e) => setWorkflowSummary(e.target.value)} placeholder="örn. Sipariş onaylanınca satır düşer ve API 200 döner" style={FIELD} /></Field>
          <Field label="Üretilen kaynak adresleri" hint="Bu iki adres seçimlerinizden türetilir; elle yazılmaz.">
            <StatusLine><code>/api/snapshots/{snapshotId || "…"}</code><br /><code>/api/comparison/schema-discovery/{connectionId || "…"}/snapshot</code></StatusLine>
          </Field>
          <Btn block label="Yazarlık oturumunu başlat" icon={GitPullRequestArrow} variant="primary" loading={busy === "session"} disabled={!canStart} onClick={() => void start()} />
          {!canStart ? <small style={{ color: "rgba(255,255,255,.28)", fontSize: 10.5 }}>Başlatmak için: kurallar mühürlü, sözleşme + veritabanı + profil seçili, akış kimliği ve özeti dolu olmalı.</small> : null}
        </RailSection>
      </aside>

      {/* Sohbet sabit çapadır: sekme değişse de yerinden oynamaz, kanıt rayı ve belge
          paneli onun etrafında açılır. */}
      <Splitter axis="x" onDrag={(delta) => setLayout((layout) => ({ ...layout, railWidth: clamp(layout.railWidth + delta, RAIL_MIN, RAIL_MAX) }))} />

      {/* Grid tek çocuğu esnetir; panel yüksekliği yüzde hesabına bağlı kalmaz ve
          bölge daralsa bile çökmez. */}
      <main style={{ display: "grid", flex: "1 1 auto", minWidth: 0, minHeight: 0, padding: 12 }}>
        <AgentConversationPanel
          conversation={conversation}
          isBusy={conversation.status === "running"}
          messages={conversation.messages}
          onSubmit={conversation.onSend}
          resolveOperation={(reference) => operationLabels.get(reference)}
          showTyping={conversation.status === "running"}
          statusText={conversation.status === "input_required" ? "Yanıt bekliyor" : conversation.status === "approval_required" ? "Onay bekliyor" : conversation.status === "cancelled" ? "Oturum kapalı" : conversation.status === "running" ? "Çalışıyor" : "Hazır"}
          title="Test Agent"
          variant="inline"
        />
      </main>
    </div>

    {/* ── BELGE VE KAPI PANELİ — terminal gibi: sürüklenerek boyutlanır, katlanır ── */}
    <div style={{ background: "#0b0d12" }}>
      <Splitter axis="y" onDrag={(delta) => {
        if (isDockCollapsed) return;
        setLayout((layout) => ({ ...layout, dockHeight: clamp(layout.dockHeight - delta, DOCK_MIN, DOCK_MAX) }));
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 8px 0 12px" }}>
        {dockTabs.map((item) => {
          const Icon = item.icon;
          const selected = dockTab === item.key && !isDockCollapsed;
          return <button key={item.key} type="button"
            /* Katlıyken sekmeye basmak paneli açar: terminal sekmesi gibi davranır. */
            onClick={() => { setDockTab(item.key); setLayout((layout) => ({ ...layout, isDockCollapsed: false })); }}
            style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 11px", borderBottom: `2px solid ${selected ? ACC : "transparent"}`, color: selected ? ACC : "rgba(255,255,255,.42)", fontSize: 11.5, fontWeight: 650 }}>
            <Icon size={12} strokeWidth={2} />{item.label}
          </button>;
        })}
        <span style={{ flex: 1 }} />
        <button type="button" title={isDockCollapsed ? "Paneli aç" : "Paneli katla"} onClick={() => setLayout((layout) => ({ ...layout, isDockCollapsed: !layout.isDockCollapsed }))}
          style={{ all: "unset", cursor: "pointer", display: "grid", placeItems: "center", width: 26, height: 26, borderRadius: 6, color: "rgba(255,255,255,.42)", fontSize: 13 }}>
          {isDockCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div style={{ height: isDockCollapsed ? 0 : dockHeight, overflowY: "auto", padding: isDockCollapsed ? "0 13px" : 13, borderTop: `1px solid ${BORDER}`, transition: "height 120ms ease" }}>
        {!authoringSession ? <StatusLine>Bu panel yazarlık oturumu açılınca dolar. Soldaki altı adımı tamamlayıp &quot;Yazarlık oturumunu başlat&quot;a basın.</StatusLine> : null}

        {authoringSession && dockTab === "steps" ? <div style={{ display: "grid", gap: 7 }}>
          {stepCount === 0 ? <StatusLine tone="warning">Henüz adım yok. Ajanla konuşarak API adımı önerin veya DB adımı sekmesinden veritabanı adımı ekleyin.</StatusLine> : null}
          {authoringSession.steps.map((step) => (
            <div key={step.stepId} style={{ padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "rgba(255,255,255,.02)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#e5e7eb", fontSize: 12, fontWeight: 650 }}>{step.stepId}</span>
                <span style={{ color: ACC, fontSize: 11 }}><b>{step.method.toLocaleUpperCase("tr-TR")}</b> {step.path}</span>
                <span style={{ marginLeft: "auto", color: step.assertionPaths.length > 0 ? "#4ade80" : "#fbbf24", fontSize: 10.5 }}>{step.assertionPaths.length} beklenti</span>
              </div>
              <div style={{ marginTop: 4, color: "rgba(255,255,255,.36)", fontSize: 10 }}>{step.assertionPaths.join(" · ") || "beklenti yok — yayın kapısı AssertionCount'ta durur"}</div>
            </div>
          ))}
          {authoringSession.databaseSteps.map((step) => (
            <div key={step.stepId} style={{ padding: "8px 10px", border: `1px solid ${BORDER}`, borderRadius: 8, background: "rgba(45,144,245,.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#e5e7eb", fontSize: 12, fontWeight: 650 }}>{step.stepId}</span>
                <span style={{ color: "#60a5fa", fontSize: 11 }}>{step.operationCode}</span>
                <span style={{ marginLeft: "auto", color: "rgba(255,255,255,.4)", fontSize: 10.5 }}>{step.expectations.length} beklenti · {step.timeoutMs} ms</span>
              </div>
              <div style={{ marginTop: 4, color: "rgba(255,255,255,.36)", fontSize: 10 }}>{step.expectations.map((item) => `${item.columnName} ${item.matcherCode}${item.value ? ` ${item.value}` : ""}`).join(" · ") || "beklenti yok"}</div>
            </div>
          ))}
        </div> : null}

        {authoringSession && dockTab === "questions" ? <div style={{ display: "grid", gap: 8 }}>
          {authoringSession.questions.length === 0
            ? <StatusLine tone="success">Grounding kapalı soru üretmedi.</StatusLine>
            : authoringSession.questions.map((question) => (
              <div key={question.questionCode} style={{ padding: 10, border: `1px solid ${BORDER}`, borderRadius: 8, background: "rgba(255,255,255,.02)" }}>
                <div style={{ color: "#e5e7eb", fontSize: 12, fontWeight: 650 }}>{question.prompt}</div>
                <code style={{ color: "rgba(255,255,255,.28)", fontSize: 9.5 }}>{question.questionCode}{question.gapKindCode ? ` · ${question.gapKindCode}` : ""}</code>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>{question.options.map((option) => {
                  const selected = authoringSession.answers[question.questionCode] === option;
                  return <button key={option} disabled={selected || busy === `answer:${question.questionCode}`} onClick={() => void answer(question.questionCode, option)} type="button"
                    style={{ padding: "6px 9px", border: `1px solid ${selected ? ACC : BORDER}`, borderRadius: 7, background: selected ? `${ACC}22` : "rgba(255,255,255,.035)", color: selected ? "#f7c869" : "rgba(255,255,255,.62)", cursor: selected ? "default" : "pointer", font: "11px inherit" }}>
                    {selected ? <Check size={10} style={{ display: "inline", marginRight: 4 }} /> : null}{option}</button>;
                })}</div>
                <small style={{ display: "block", marginTop: 6, color: "rgba(255,255,255,.28)", fontSize: 10 }}>Seçim kapalıdır: seçenekleri sunucu kanıttan üretti.</small>
              </div>
            ))}
        </div> : null}

        {authoringSession && dockTab === "dbstep" ? <div style={{ display: "grid", gap: 9 }}>
          {!tableDescription
            ? <StatusLine tone="warning">Önce kanıt rayından bir aday tablo referansını çözün. Matcher ve kolon listeleri o tanımdan gelir; burada elle yazılmaz.</StatusLine>
            : <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 9 }}>
                <Field label="Adım kimliği" hint="belgede bu adımı adlandırır"><input value={dbStepId} onChange={(e) => setDbStepId(e.target.value)} placeholder="örn. siparis-satiri-dustu" style={FIELD} /></Field>
                <Field label="Ne doğrulanacak" hint="kapalı küme — derleyicinin tanıdığı üç işlem">
                  <select value={dbOperationCode} onChange={(e) => setDbOperationCode(e.target.value)} style={FIELD}>
                    <option value="">— seçin —</option>
                    {DB_OPERATION_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                  </select>
                </Field>
                <Field label="Zaman aşımı (ms)" hint="boş bırakılabilir"><input type="number" min={1} value={dbTimeoutMs} onChange={(e) => setDbTimeoutMs(e.target.value)} placeholder="boş = sınır yok" style={FIELD} /></Field>
                <Field label="Yoklama aralığı (ms)" hint="boş bırakılabilir"><input type="number" min={1} value={dbPollIntervalMs} onChange={(e) => setDbPollIntervalMs(e.target.value)} placeholder="boş = varsayılan" style={FIELD} /></Field>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 9 }}>
                <Field label="Anahtar kolonu" hint="aday anahtarlar tablo tanımından gelir">
                  <select value={dbKeyColumn} onChange={(e) => setDbKeyColumn(e.target.value)} style={FIELD}>
                    <option value="">— anahtar yok —</option>
                    {tableDescription.keyCandidates.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </Field>
                <Field label="Anahtar değeri"><input value={dbKeyValue} onChange={(e) => setDbKeyValue(e.target.value)} placeholder="{$inputs.subjectId}" style={FIELD} /></Field>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "rgba(255,255,255,.66)", fontSize: 12, fontWeight: 650 }}>Beklentiler</span>
                  <span style={{ color: dbExpectations.length ? "#4ade80" : "#fbbf24", fontSize: 10.5 }}>{dbExpectations.length} beklenti — en az bir tane gerekir</span>
                  <Btn label="Beklenti ekle" icon={Plus} small disabled={tableDescription.assertableFields.length === 0} onClick={() => setDbExpectations((items) => [...items, { columnName: tableDescription.assertableFields[0] ?? "", matcherCode: tableDescription.allowedMatchers[0] ?? "", value: "" }])} />
                </div>
                {dbExpectations.map((expectation, index) => (
                  <div key={`${expectation.columnName}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 6 }}>
                    <select value={expectation.columnName} style={FIELD}
                      onChange={(e) => setDbExpectations((items) => items.map((item, position) => position === index ? { ...item, columnName: e.target.value } : item))}>
                      {tableDescription.assertableFields.map((field) => <option key={field} value={field}>{field}</option>)}
                    </select>
                    <select value={expectation.matcherCode} style={FIELD}
                      onChange={(e) => setDbExpectations((items) => items.map((item, position) => position === index ? { ...item, matcherCode: e.target.value } : item))}>
                      {tableDescription.allowedMatchers.map((matcher) => <option key={matcher} value={matcher}>{matcher}</option>)}
                    </select>
                    <input value={expectation.value ?? ""} placeholder="değer" style={FIELD}
                      onChange={(e) => setDbExpectations((items) => items.map((item, position) => position === index ? { ...item, value: e.target.value } : item))} />
                    <Btn label="Sil" small variant="danger-dim" onClick={() => setDbExpectations((items) => items.filter((_, position) => position !== index))} />
                  </div>
                ))}
              </div>

              <div><Btn label="Veritabanı adımını ekle" icon={Database} variant="primary" loading={busy === "dbstep"} disabled={dbExpectations.length === 0 || !dbStepId.trim() || !dbOperationCode} onClick={() => void addDatabaseStep()} /></div>
            </>}
        </div> : null}

        {authoringSession && dockTab === "arazzo" ? <div style={{ display: "grid", gap: 9 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Btn label="Compile preview" icon={Braces} variant="accent-dim" loading={busy === "compile"} disabled={unanswered.length > 0 || stepCount === 0} onClick={() => void compilePreview()} />
            <span style={{ color: "rgba(255,255,255,.3)", fontSize: 10.5 }}>Bu yüzey okuyucudur; serbest düzenleme kaynak mührünü kırardı.</span>
          </div>
          {compile ? <StatusLine tone={compile.isSchemaValid ? "success" : "danger"}>{compile.isSchemaValid ? "Şema geçerli" : "Şema geçersiz"} · {compile.compiledAssertionCount} assertion · <code>{compile.compiledHash}</code>{compile.lintDiagnostics ? <><br />{compile.lintDiagnostics}</> : null}</StatusLine> : null}
          <pre style={{ margin: 0, padding: 10, background: "#0b0d12", border: `1px solid ${BORDER}`, borderRadius: 8, color: "rgba(255,255,255,.6)", font: "11px/1.55 ui-monospace,monospace", whiteSpace: "pre-wrap" }}>
            {markAddedLines(documentBaseline, authoringSession.sourceDocument).map((line, index) => (
              <div key={index} style={{ background: line.isAdded ? "rgba(74,222,128,.10)" : "transparent", color: line.isAdded ? "#86efac" : undefined }}>{line.isAdded ? "+ " : "  "}{line.text}</div>
            ))}
          </pre>
        </div> : null}

        {authoringSession && dockTab === "gates" ? <div style={{ display: "grid", gap: 9 }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: 9 }}>
            <Field label="Senaryo anahtarı"><input value={scenarioKey} onChange={(e) => setScenarioKey(e.target.value)} style={FIELD} /></Field>
            <Field label="Başlık"><input value={title} onChange={(e) => setTitle(e.target.value)} style={FIELD} /></Field>
            <Field label="Açıklama"><input value={description} onChange={(e) => setDescription(e.target.value)} style={FIELD} /></Field>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Btn label={scenario ? "Senaryo kaydedildi" : "Taslağı kalıcılaştır"} icon={Save} variant="primary" loading={busy === "persist"} disabled={!canPersist || Boolean(scenario)} onClick={() => void persist()} />
            <Btn label={submittedForApproval ? "Onaya sunuldu" : "Onaya sun"} icon={BookOpenCheck} disabled={!scenario || submittedForApproval} loading={busy === "submit"} onClick={() => void submit()} />
            <Btn label="5 kapıyı değerlendir" icon={ShieldCheck} disabled={!scenario || !submittedForApproval} loading={busy === "evaluate"} onClick={() => void evaluate()} />
            <Btn label="Yayınla" icon={GitPullRequestArrow} variant="accent-dim" disabled={!decision?.isPublishable} loading={busy === "publish"} onClick={() => void publish()} />
          </div>
          {scenario ? <StatusLine tone="success">Kalıcı senaryo: <code>{scenario.scenarioKey}</code> · durum kimliği {scenario.stateId}</StatusLine> : null}
          {decision ? <div style={{ display: "grid", gap: 7 }}>
            <StatusLine tone={decision.isPublishable ? "success" : "warning"}>{decision.isPublishable ? "Tüm yayın kapıları geçti; yalnız şimdi Yayınla eylemi açıldı." : "Yayın kapıları geçmedi; yayın çağrısı yapılmayacak."}</StatusLine>
            {decision.failedGateCodes.map((code) => <StatusLine key={code} tone="warning"><b>{code}</b> — {GATE_LABELS[code] ?? code}<br /><span style={{ opacity: .75 }}>{GATE_FIXES[code] ?? ""}</span></StatusLine>)}
            {decision.warnings.map((warning) => <StatusLine key={warning}>{warning}</StatusLine>)}
          </div> : null}
        </div> : null}
      </div>
    </div>

    <SourceFormDialog open={sourceDialogOpen} onClose={() => { setSourceDialogOpen(false); void refreshSources(); }} />
    {connectionDialogOpen ? (
      <ConnectionFormModal
        editing={null}
        engines={engines}
        onClose={() => setConnectionDialogOpen(false)}
        onSaved={() => void refreshConnections()}
      />
    ) : null}
  </div>;
}
