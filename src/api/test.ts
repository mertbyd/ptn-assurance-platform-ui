/** Test Platform public HTTP contract. Keep this file aligned with ptn-test-module controllers. */
import { apiClient } from "@/lib/api-client";

export interface Page<T> { totalCount: number; items: T[] }

export interface LookupDto {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  breaksBuild?: boolean;
}

export interface TestScenarioMaterialSealDto {
  rulesFingerprint?: string | null;
  specSnapshotId?: string | null;
  specFingerprint?: string | null;
  dbConnectionId?: string | null;
  dbSchemaFingerprint?: string | null;
  profileFingerprint?: string | null;
}

export interface TestScenarioDto extends TestScenarioMaterialSealDto {
  id: string;
  scenarioKey: string;
  versionNo: number;
  title: string;
  description?: string | null;
  stateId: string;
  sourceDocument: string;
  sourceHash: string;
  compiledDocument: string;
  compiledHash: string;
  assertionCount: number;
  derivabilityCode?: string | null;
  authoredByAgent: boolean;
  agentModelRef?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalBoundToHash?: string | null;
  notes?: string | null;
  quarantineUntil?: string | null;
  quarantineReason?: string | null;
  scheduleCron?: string | null;
  scheduleEnabled: boolean;
  nextRunAt?: string | null;
  tenantId?: string | null;
  creationTime: string;
  lastModificationTime?: string | null;
}

export interface TestScenarioListInput { skipCount?: number; maxResultCount?: number }

export interface CreateTestScenarioDto {
  scenarioKey: string;
  title: string;
  description?: string | null;
  sourceDocument: string;
  sourceHash?: string | null;
  materialSeal: TestScenarioMaterialSealDto;
  derivabilityCode?: string | null;
  authoredByAgent: boolean;
  agentModelRef?: string | null;
  notes?: string | null;
}

export type UpdateTestScenarioDto = Omit<CreateTestScenarioDto, "scenarioKey">;

export interface AuthoringSourceDto { fileName: string; byteCount: number; fingerprint: string }
export interface ProfilePackSummaryDto {
  profileKey: string;
  revision: string;
  contentFingerprint: string;
  dbSchemaFingerprint: string;
  bindingCount: number;
  approvedBindingCount: number;
  evidencePathCount: number;
}

export interface ScenarioCompilePreviewResultDto {
  compiledDocument: string;
  compiledHash: string;
  compiledAssertionCount: number;
  isSchemaValid: boolean;
  lintDiagnostics: string;
}

export interface TestScenarioPublishDecisionDto {
  isPublishable: boolean;
  failedGateCodes: string[];
  warnings: string[];
}

export interface ClosedQuestionDto {
  questionCode: string;
  prompt: string;
  options: string[];
  gapKindCode?: string | null;
}

export interface AddAuthoringStepDto {
  stepId: string;
  operationReferenceId: string;
  requestBodyJson?: string | null;
  assertionPaths: string[];
}

export interface AuthoringExpectationDto {
  columnName: string;
  matcherCode: string;
  value?: string | null;
}

export interface AddDatabaseAuthoringStepDto {
  stepId: string;
  tableReferenceId: string;
  operationCode: string;
  keyBindings: Record<string, string | null>;
  expectations: AuthoringExpectationDto[];
  timeoutMs: number;
  pollIntervalMs: number;
}

export interface AuthoringStepDto extends AddAuthoringStepDto {
  operationId?: string | null;
  method: string;
  path: string;
}

export interface GroundRequestDto {
  profileKey: string;
  specSnapshotId: string;
  connectionId: string;
  operationReferenceId?: string | null;
  tableReferenceId?: string | null;
  stepIntent: string;
  responseFormat: "concise" | "detailed";
  hasExclusiveSandbox: boolean;
  sessionId?: string | null;
  proposedStep?: AddAuthoringStepDto | null;
}

export interface CreateAuthoringSessionDto {
  grounding: GroundRequestDto;
  workflowId: string;
  workflowSummary: string;
  apiSourceUrl: string;
  databaseSourceUrl: string;
}

export interface AuthoringSessionDto {
  id: string;
  specSnapshotId: string;
  workflowId: string;
  workflowSummary: string;
  questions: ClosedQuestionDto[];
  answers: Record<string, string>;
  steps: AuthoringStepDto[];
  databaseSteps: AddDatabaseAuthoringStepDto[];
  sourceDocument: string;
  ttlMs: number;
}

export interface TestRunHeaderDto {
  id: string;
  scenarioId?: string | null;
  testKey: string;
  environmentKey: string;
  runStatusCode: string;
  outcomeCode?: string | null;
  triggerKindCode: string;
  durationMs?: number | null;
  findingCount: number;
  attempt?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
  isDryRun: boolean;
  creationTime: string;
}

export interface TestRunListInput {
  skipCount?: number;
  maxResultCount?: number;
  runStatusCode?: string;
  environmentKey?: string;
  scenarioId?: string;
  triggerKindCode?: string;
  createdFrom?: string;
  createdTo?: string;
  isDryRun?: boolean;
  sorting?: string;
}

export interface TestRunDto {
  id: string;
  scenarioId?: string | null;
  testKey: string;
  historyId?: string | null;
  environmentKey: string;
  specSnapshotId?: string | null;
  dbConnectionId?: string | null;
  runStatusId: string;
  triggerKindId: string;
  triggerRef?: string | null;
  traceId?: string | null;
  specFingerprint?: string | null;
  dbSchemaFingerprint?: string | null;
  runnerRef?: string | null;
  isDryRun: boolean;
  harBlobName?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  tenantId?: string | null;
  creationTime: string;
}

export interface CreateTestRunDto {
  scenarioId?: string | null;
  testKey: string;
  environmentKey: string;
  triggerKindCode: string;
  triggerRef?: string | null;
  canonicalInputs: string;
  specFingerprint?: string | null;
  dbSchemaFingerprint?: string | null;
  runnerRef?: string | null;
  isDryRun: boolean;
}

export interface TestResultFindingDto {
  id: string;
  testRunResultId: string;
  ordinal: number;
  sourceCheckerCode: string;
  comparisonKindCode: string;
  ruleRef?: string | null;
  location: string;
  targetDisplayName?: string | null;
  message: string;
  expectedValue?: string | null;
  observedValue?: string | null;
  evidenceSummary?: string | null;
  observedAtMs?: number | null;
  attemptCount?: number | null;
  creationTime: string;
}

export interface TestRunResultDto {
  id: string;
  testRunId: string;
  attempt: number;
  outcomeStatusId: string;
  durationMs: number;
  failureCategoryId?: string | null;
  errorCode?: string | null;
  detail?: string | null;
  failedStepOrdinal?: number | null;
  failedStepName?: string | null;
  failedStepPath?: string | null;
  takenBranchPath?: string | null;
  lastCompletedOrdinal?: number | null;
  diagnosisReport?: string | null;
  findings: TestResultFindingDto[];
  tenantId?: string | null;
  creationTime: string;
}

export interface TestReportDetailDto {
  run: TestRunDto;
  result?: TestRunResultDto | null;
  outcomeCode?: string | null;
  previousOutcomeCode?: string | null;
  isHealed: boolean;
}

export interface DryRunContradictionReportDto {
  isDryRun: boolean;
  hasContradiction: boolean;
  observation: string;
  contract: string;
  location: string;
  outcomeCode?: string | null;
}

export interface RunArtifactLinksDto {
  ctrfBlobName?: string | null;
  jUnitBlobName?: string | null;
  sarifBlobName?: string | null;
}

export interface RunArtifactContentDto {
  format: string;
  blobName: string;
  contentType: string;
  content: string;
}

export interface TestFindingListInput {
  skipCount?: number;
  maxResultCount?: number;
  testRunId?: string;
  scenarioId?: string;
  outcomeCode?: string;
  severityCode?: string;
  sourceCheckerCode?: string;
  ruleRef?: string;
  fingerprints?: string[];
  createdFrom?: string;
  createdTo?: string;
  sorting?: string;
}

export interface TestFindingHeaderDto {
  id: string;
  testRunId: string;
  scenarioId?: string | null;
  testRunResultId: string;
  attempt: number;
  outcomeCode: string;
  severityCode?: string | null;
  ordinal: number;
  fingerprint: string;
  sourceCheckerCode: string;
  comparisonKindCode: string;
  ruleRef?: string | null;
  location: string;
  message: string;
  creationTime: string;
}

export interface ScenarioHealthListInput {
  skipCount?: number;
  maxResultCount?: number;
  scenarioKey?: string;
  minFlakyRatio?: number;
  maxPassRatio?: number;
  sorting?: string;
}

export interface ScenarioHealthDto {
  scenarioKey: string;
  totalRunCount: number;
  passedRunCount: number;
  failedRunCount: number;
  historyCount: number;
  flakyHistoryCount: number;
  passRatio: number;
  flakyRatio: number;
  p95DurationMs: number;
  lastRunAt?: string | null;
}

/* ── Ortam bağlama ────────────────────────────────────────────────────────────
 * `TestEnvironmentBindingDto` sır DEĞERİ taşımaz; yalnız Vault referans anahtarı
 * taşır (KBP-112). Form bu yüzden parola alanı göstermez — CURRENT-0007 G-08. */
export interface TestEnvironmentBindingDto {
  environmentKey: string;
  baseUrl: string;
  specSnapshotId: string;
  dbConnectionId: string;
}

export interface CreateTestEnvironmentBindingDto extends TestEnvironmentBindingDto {
  secretRef: string;
  apiSecretRef: string;
}

export type UpdateTestEnvironmentBindingDto = Omit<CreateTestEnvironmentBindingDto, "environmentKey">;

/* ── Kapsam raporu ────────────────────────────────────────────────────────────
 * Payda bilinmiyorsa `denominatorState` `Unknown` döner ve `denominatorUnknownReason`
 * kararlı bir kod taşır; ekran bunu yanlış `0` yerine "ölçülemedi" olarak gösterir. */
export interface ScenarioCoverageSnapshotDto {
  specSnapshotId?: string | null;
  scenarioCount: number;
  touchedOperations: string[];
  totalOperationCount?: number | null;
}

export interface ScenarioCoverageRuleDto {
  ruleRef: string;
  scenarioCount: number;
  findingCount: number;
}

export interface ScenarioCoverageReportDto {
  publishedScenarioCount: number;
  snapshots: ScenarioCoverageSnapshotDto[];
  rules: ScenarioCoverageRuleDto[];
  denominatorState: string;
  denominatorUnknownReason: string;
}

export interface TestRunClaimDto {
  claimed: boolean;
  run: TestRunDto;
}

export interface WriteTestRunTerminalDto {
  outcomeCode: string;
  failureCategoryCode?: string | null;
  errorCode?: string | null;
  detail?: string | null;
  failedStepOrdinal?: number | null;
  failedStepName?: string | null;
  failedStepPath?: string | null;
  takenBranchPath?: string | null;
}

/* ── Köprü (bridge) ───────────────────────────────────────────────────────────
 * Köprü yanıtları büyük ve iç içe teşhis belgeleridir; üretilmiş schema.d.ts tek
 * kökenli Swagger'a bağlandığında (G-03) gerçek DTO ile değişecekler. `unknown`
 * çağıranı daraltmaya zorlar, `any` sessizce her şeye izin verirdi. */
export interface GroundCandidateRequestDto {
  profileKey: string;
  specSnapshotId: string;
  connectionId: string;
  /* Verilirse sunucu adayları daraltıp o referansın tanımını döner; verilmezse aday
   * listesi ve kapalı sorular gelir (`GroundRequestDto` ile aynı isteğe bağlılık). */
  operationReferenceId?: string | null;
  tableReferenceId?: string | null;
  stepIntent: string;
  responseFormat: "concise" | "detailed";
  hasExclusiveSandbox: boolean;
  sessionId?: string | null;
}

/* `ground` bu ailenin TEK tipli üyesidir: yazarlık ekranı opak referansları buradan alır.
 * Alanlar `Ptn.TestModule.Application.Contracts/Dtos/Bridge/**` ile hizalıdır. Yalnız
 * ekranın okuduğu alanlar modellenmiştir; gövde daha geniştir (footprint, requestExample,
 * resourceLink) ve G-03'te üretilmiş şemayla tamamlanacaktır. */
export interface GroundResultDto {
  responseFormat: string;
  decisionCode: string;
  criticalFactCode: string;
  coverage: CoverageReportDto;
  operationBinding?: OperationBindingDto | null;
  tableDescription?: TableDescriptionDto | null;
  questions: ClosedQuestionDto[];
  sessionId?: string | null;
  stepCount: number;
  pendingQuestionCodes: string[];
}

export interface CoverageReportDto {
  requiredConcepts: string[];
  boundConcepts: string[];
  unboundConcepts: string[];
  boundCount: number;
  requiredCount: number;
  boundRatio: number;
}

export interface OperationBindingDto {
  outcomeCode: string;
  suggestions: OperationSuggestionDto[];
}

/* Opak `referenceId` ile insan-okur `sourceMethod`/`sourcePath` YALNIZ burada bir arada
 * bulunur; onay kartı operasyonu bu eşleşmeyle çözer. Ajan operasyon adı uyduramaz. */
export interface OperationSuggestionDto {
  referenceId: string;
  sourceOperationId?: string | null;
  sourceMethod: string;
  sourcePath: string;
  score: number;
}

/* Tablo tanımı kendi kapalı kümelerini taşır: `allowedMatchers` ve `assertableFields`
 * sunucudan gelir. Ekran matcher listesini SABİTLEMEZ — kapalı küme kaynağı burasıdır. */
export interface TableDescriptionDto {
  dbSchemaName: string;
  tableName: string;
  columns: TableColumnDto[];
  primaryKey?: TableKeyDto | null;
  uniqueIndexes: TableKeyDto[];
  lintWarnings: SchemaLintWarningDto[];
  tableReferenceId: string;
  assertableFields: string[];
  allowedMatchers: string[];
  keyCandidates: string[];
}

export interface TableColumnDto {
  name: string;
  canonicalDataTypeCode: string;
  isNullable: boolean;
}

export interface TableKeyDto {
  name: string;
  columns: string[];
}

export interface SchemaLintWarningDto {
  warningCode: string;
  columnName?: string | null;
}

export interface AgentProfileRequestDto {
  momentCode: string;
}

export interface ToolBudgetRequestDto {
  momentCode: string;
  toolCode: string;
  consumedCalls: number;
}

const repeatArrayParams = (params: object | undefined) => {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => search.append(key, String(item)));
    else if (value !== undefined && value !== null && value !== "") search.append(key, String(value));
  });
  return search.toString();
};

export const testApi = {
  /* Beş lookup ailesinin tamamı salt-okunurdur; yazma ucu yoktur, bu yüzden UI
   * "yeni ekle" butonu koymaz (ARCH-0006 §2.7). */
  lookups: {
    scenarioStates: () => apiClient.get<Page<LookupDto>>("/api/test-module/lookups/scenario-states", { params: { skipCount: 0, maxResultCount: 100 } }),
    runStatuses: () => apiClient.get<Page<LookupDto>>("/api/test-module/lookups/run-statuses", { params: { skipCount: 0, maxResultCount: 100 } }),
    outcomeStatuses: () => apiClient.get<Page<LookupDto>>("/api/test-module/lookups/outcome-statuses", { params: { skipCount: 0, maxResultCount: 100 } }),
    triggerKinds: () => apiClient.get<Page<LookupDto>>("/api/test-module/lookups/trigger-kinds", { params: { skipCount: 0, maxResultCount: 100 } }),
    failureCategories: () => apiClient.get<Page<LookupDto>>("/api/test-module/lookups/failure-categories", { params: { skipCount: 0, maxResultCount: 100 } }),
    getScenarioState: (id: string) => apiClient.get<LookupDto>(`/api/test-module/lookups/scenario-states/${id}`),
    getRunStatus: (id: string) => apiClient.get<LookupDto>(`/api/test-module/lookups/run-statuses/${id}`),
    getOutcomeStatus: (id: string) => apiClient.get<LookupDto>(`/api/test-module/lookups/outcome-statuses/${id}`),
    getTriggerKind: (id: string) => apiClient.get<LookupDto>(`/api/test-module/lookups/trigger-kinds/${id}`),
    getFailureCategory: (id: string) => apiClient.get<LookupDto>(`/api/test-module/lookups/failure-categories/${id}`),
  },
  environments: {
    list: () => apiClient.get<TestEnvironmentBindingDto[]>("/api/test-module/environments"),
    create: (data: CreateTestEnvironmentBindingDto) =>
      apiClient.post<TestEnvironmentBindingDto, CreateTestEnvironmentBindingDto>("/api/test-module/environments", data),
    update: (key: string, data: UpdateTestEnvironmentBindingDto) =>
      apiClient.put<TestEnvironmentBindingDto, UpdateTestEnvironmentBindingDto>(`/api/test-module/environments/${encodeURIComponent(key)}`, data),
    remove: (key: string) => apiClient.delete<void>(`/api/test-module/environments/${encodeURIComponent(key)}`),
    resetSandbox: (key: string) => apiClient.post<void>(`/api/test-module/environments/${encodeURIComponent(key)}/sandbox/reset`),
  },
  coverage: {
    get: () => apiClient.get<ScenarioCoverageReportDto>("/api/test-module/coverage"),
  },
  /* Köprü uçları ajanın gördüğü kanıtı gösterir. `overlay-suggestion` kademe 4'tür
   * ve `Applied` alanı önerinin uygulanmadığını taşır: ekran "uygula" değil
   * "incele ve dışa aktar" olarak kurulur (ARCH-0006 §2.3). */
  bridge: {
    ground: (data: GroundCandidateRequestDto) => apiClient.post<GroundResultDto, GroundCandidateRequestDto>("/api/test-module/bridge/ground", data),
    explain: (data: Record<string, unknown>) => apiClient.post<unknown>("/api/test-module/bridge/explain", data),
    validate: (data: Record<string, unknown>) => apiClient.post<unknown>("/api/test-module/bridge/validate", data),
    knowledge: (data: Record<string, unknown>) => apiClient.post<unknown>("/api/test-module/bridge/knowledge", data),
    tools: () => apiClient.get<unknown>("/api/test-module/bridge/tools"),
    agentProfile: (data: AgentProfileRequestDto) => apiClient.post<unknown, AgentProfileRequestDto>("/api/test-module/bridge/agent-profile", data),
    toolBudget: (data: ToolBudgetRequestDto) => apiClient.post<unknown, ToolBudgetRequestDto>("/api/test-module/bridge/tool-budget", data),
    taskStatus: (data: Record<string, unknown>) => apiClient.post<unknown>("/api/test-module/bridge/task-status", data),
    overlaySuggestion: (data: Record<string, unknown>) => apiClient.post<unknown>("/api/test-module/bridge/overlay-suggestion", data),
  },
  invariants: {
    check: (data: Record<string, unknown>) => apiClient.post<unknown>("/api/test-module/invariants/check", data),
  },
  scenarios: {
    list: (params?: TestScenarioListInput) => apiClient.get<Page<TestScenarioDto>>("/api/test-module/scenarios", { params }),
    get: (id: string) => apiClient.get<TestScenarioDto>(`/api/test-module/scenarios/${id}`),
    create: (data: CreateTestScenarioDto) => apiClient.post<TestScenarioDto, CreateTestScenarioDto>("/api/test-module/scenarios", data),
    update: (id: string, data: UpdateTestScenarioDto) => apiClient.put<TestScenarioDto, UpdateTestScenarioDto>(`/api/test-module/scenarios/${id}`, data),
    delete: (id: string) => apiClient.delete<void>(`/api/test-module/scenarios/${id}`),
    compilePreview: (sourceDocument: string, specSnapshotId: string) =>
      apiClient.post<ScenarioCompilePreviewResultDto>("/api/test-module/scenarios/compile-preview", { sourceDocument, specSnapshotId }),
    evaluatePublication: (id: string) => apiClient.post<TestScenarioPublishDecisionDto>(`/api/test-module/scenarios/${id}/evaluate-publication`),
    submitForApproval: (id: string) => apiClient.post<TestScenarioDto>(`/api/test-module/scenarios/${id}/submit-for-approval`),
    publish: (id: string) => apiClient.post<TestScenarioDto>(`/api/test-module/scenarios/${id}/publish`),
    deprecate: (id: string) => apiClient.post<TestScenarioDto>(`/api/test-module/scenarios/${id}/deprecate`),
    quarantine: (id: string, quarantineUntil: string | null, quarantineReason: string | null) =>
      apiClient.post<TestScenarioDto>(`/api/test-module/scenarios/${id}/quarantine`, { quarantineUntil, quarantineReason }),
    releaseQuarantine: (id: string) => apiClient.post<TestScenarioDto>(`/api/test-module/scenarios/${id}/quarantine/release`),
    schedule: (id: string, scheduleCron: string | null, scheduleEnabled: boolean) =>
      apiClient.put<TestScenarioDto>(`/api/test-module/scenarios/${id}/schedule`, { scheduleCron, scheduleEnabled }),
  },
  authoring: {
    uploadBusinessRules: (content: string) => apiClient.post<AuthoringSourceDto>("/api/test-module/authoring/business-rules", { content }),
    uploadProfilePack: (profileKey: string, content: string) => apiClient.post<AuthoringSourceDto>("/api/test-module/authoring/profile-packs", { profileKey, content }),
    listProfilePacks: () => apiClient.get<ProfilePackSummaryDto[]>("/api/test-module/authoring/profile-packs"),
    createSession: (data: CreateAuthoringSessionDto) => apiClient.post<AuthoringSessionDto, CreateAuthoringSessionDto>("/api/test-module/authoring/sessions", data),
    getSession: (id: string) => apiClient.get<AuthoringSessionDto>(`/api/test-module/authoring/sessions/${id}`),
    answer: (id: string, questionCode: string, selectedOption: string) => apiClient.post<AuthoringSessionDto>(`/api/test-module/authoring/sessions/${id}/answer`, { questionCode, selectedOption }),
    addStep: (id: string, data: AddAuthoringStepDto) => apiClient.post<AuthoringSessionDto, AddAuthoringStepDto>(`/api/test-module/authoring/sessions/${id}/step`, data),
    addDatabaseStep: (id: string, data: AddDatabaseAuthoringStepDto) => apiClient.post<AuthoringSessionDto, AddDatabaseAuthoringStepDto>(`/api/test-module/authoring/sessions/${id}/database-step`, data),
  },
  runs: {
    list: (params?: TestRunListInput) => apiClient.get<Page<TestRunHeaderDto>>("/api/test-module/runs", { params }),
    get: (id: string) => apiClient.get<TestRunDto>(`/api/test-module/runs/${id}`),
    getReport: (id: string) => apiClient.get<TestReportDetailDto>(`/api/test-module/runs/${id}/report`),
    getDryRunContradiction: (id: string) => apiClient.get<DryRunContradictionReportDto>(`/api/test-module/runs/${id}/dry-run-contradiction`),
    create: (data: CreateTestRunDto) => apiClient.post<TestRunDto, CreateTestRunDto>("/api/test-module/runs", data),
    trigger: (data: CreateTestRunDto) => apiClient.post<TestRunDto, CreateTestRunDto>("/api/test-module/runs/trigger", data),
    cancel: (id: string) => apiClient.post<void>(`/api/test-module/runs/${id}/cancel`),
    export: (id: string) => apiClient.post<RunArtifactLinksDto>(`/api/test-module/runs/${id}/export`),
    getResult: (id: string) => apiClient.get<TestRunResultDto>(`/api/test-module/runs/results/${id}`),
    getArtifactLinks: (resultId: string) => apiClient.get<RunArtifactLinksDto>(`/api/test-module/runs/results/${resultId}/artifacts`),
    getArtifactContent: (resultId: string, format: string) => apiClient.get<RunArtifactContentDto>(`/api/test-module/runs/results/${resultId}/artifacts/${format}`),
    getHar: (id: string) => apiClient.get<RunArtifactContentDto>(`/api/test-module/runs/${id}/har`),
    /* Koşucu tarafı uçlar: `start` Pending koşumu Running'e claim eder, `terminal`
     * hükmü ve bulguları atomik yazar. `runs/webhook` bilinçli olarak tanımlanmaz —
     * anonim ve paylaşılan sırla korunur, istemciye açılmaz (CURRENT-0007 G-14). */
    start: (id: string) => apiClient.post<TestRunClaimDto>(`/api/test-module/runs/${id}/start`),
    writeTerminal: (id: string, data: WriteTestRunTerminalDto) =>
      apiClient.post<TestRunResultDto, WriteTestRunTerminalDto>(`/api/test-module/runs/${id}/terminal`, data),
  },
  findings: {
    list: (params?: TestFindingListInput) => apiClient.get<Page<TestFindingHeaderDto>>("/api/test-module/findings", { params, paramsSerializer: repeatArrayParams }),
  },
  health: {
    list: (params?: ScenarioHealthListInput) => apiClient.get<Page<ScenarioHealthDto>>("/api/test-module/scenario-health", { params }),
    get: (scenarioKey: string) => apiClient.get<ScenarioHealthDto>(`/api/test-module/scenario-health/${encodeURIComponent(scenarioKey)}`),
  },
} as const;
