/**
 * API Contract Checker — endpoint fonksiyonları
 * Rota otoritesi: `Ptn.ApiContractChecker.Domain.Shared/Constants/Core/ApiContractCheckerRoutes.cs`
 *
 * Kaldırılan yüzeyler (checker `0.2.0-alpha.9`, sıfır tüketici ile doğrulandı):
 * - `conformance`  → `/api/conformance/runs` hiç var olmadı; gerçek kök
 *                    `ApiContractCheckerRoutes.Conformance` = `api/contract-checks/conformance`.
 * - `lookups`      → `/api/lookups` modül önekine taşındı; tipli karşılığı `@/api/lookups.api`.
 * - `recipients`   → `/api/recipients` checker paketinden tamamen söküldü.
 */

import { apiClient } from "@/lib/api-client";

// ─── DTO tipleri ──────────────────────────────────────────────────────────────

export interface SpecSourceDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  documents?: SpecDocumentDto[];
  creationTime: string;
  lastModificationTime?: string | null;
}

export interface SpecDocumentDto {
  id: string;
  specSourceId: string;
  url: string;
  displayName?: string | null;
  isActive: boolean;
  latestSnapshotId?: string | null;
  latestSnapshotCapturedAt?: string | null;
}

export interface CreateSpecSourceDto {
  name: string;
  description?: string;
  documents: { url: string; displayName?: string }[];
}

export interface UpdateSpecSourceDto {
  name: string;
  description?: string;
}

export interface SpecSourceReachabilityDto {
  isReachable: boolean;
  statusCode?: number | null;
  errorMessage?: string | null;
  responseTimeMs?: number | null;
}

export interface SpecSnapshotHeaderDto {
  id: string;
  specDocumentId: string;
  rawHash: string;
  canonicalHash: string;
  capturedAt: string;
  operationCount?: number | null;
  formatCode?: string | null;
}

export interface SpecSnapshotDetailDto extends SpecSnapshotHeaderDto {
  content?: string | null;
  title?: string | null;
  version?: string | null;
}

export interface SnapshotOperationInventoryDto {
  totalCount: number;
  operations: SnapshotOperationSummary[];
}

export interface SnapshotOperationSummary {
  operationId: string;
  httpMethod: string;
  path: string;
  summary?: string | null;
  tags?: string[];
}

export interface ContractCheckRunHeaderDto {
  id: string;
  sourceSnapshotId: string;
  targetSnapshotId: string;
  statusCode: string;
  findingCount?: number | null;
  breakingCount?: number | null;
  creationTime: string;
  completedAt?: string | null;
}

export interface ContractCheckRunDetailDto extends ContractCheckRunHeaderDto {
  errorMessage?: string | null;
  sourceSnapshot?: SpecSnapshotHeaderDto | null;
  targetSnapshot?: SpecSnapshotHeaderDto | null;
}

export interface ContractCheckRunStatusDto {
  id: string;
  statusCode: string;
  findingCount?: number | null;
  breakingCount?: number | null;
  completedAt?: string | null;
}

export interface FindingDto {
  id: string;
  kindCode: string;
  severityCode: string;
  directionCode?: string | null;
  address: FindingAddressDto;
  fingerprint: string;
  changeStateCode: string;
  oldDelta?: string | null;
  newDelta?: string | null;
  description?: string | null;
}

export interface FindingAddressDto {
  operationId?: string | null;
  httpMethod?: string | null;
  path?: string | null;
  schemaName?: string | null;
  propertyPath?: string | null;
  parameterName?: string | null;
  responseStatus?: string | null;
  mediaType?: string | null;
}

export interface FindingPagedResultDto {
  totalCount: number;
  items: FindingDto[];
}

export interface ContractCheckReportDto {
  runId: string;
  totalCount: number;
  breakingCount: number;
  nonBreakingCount: number;
  warningCount: number;
  docsOnlyCount: number;
  generatedAt: string;
}

export interface ExecuteContractCheckDto {
  sourceSnapshotId: string;
  targetSnapshotId: string;
}

export interface GetContractCheckRunsInput {
  skipCount?: number;
  maxResultCount?: number;
  sourceSnapshotId?: string;
}

export interface GetContractCheckFindingsInput {
  skipCount?: number;
  maxResultCount?: number;
  severityCodes?: string[];
  changeStateCodes?: string[];
  sinceRunId?: string;
}

export interface DiagnoseRequestDto {
  connectionId?: string | null;
  signalCode: string;
  contextJson?: string | null;
}

export interface DiagnosisReportDto {
  runId?: string | null;
  signalCode: string;
  hypotheses: DiagnosisHypothesisDto[];
  generatedAt: string;
}

export interface DiagnosisHypothesisDto {
  code: string;
  confidenceCode: string;
  description: string;
  evidence?: string[] | null;
}

// ─── Eklenen DTO tipleri ────────────────────────────────────────────────────────
export interface ConfigureSpecDocumentMonitoringDto {
  scheduleCron?: string | null;
  isEnabled: boolean;
}

export interface SpecDocumentMonitoringDto {
  scheduleCron?: string | null;
  isEnabled: boolean;
  nextRunAt?: string | null;
}

export interface FindOperationDto {
  httpMethod: string;
  path: string;
}

export interface DescribeSchemaDto {
  schemaName: string;
}

// ─── Endpoint fonksiyonları ───────────────────────────────────────────────────

export const checkerApi = {
  // Sources
  sources: {
    list: (params?: { skipCount?: number; maxResultCount?: number }) =>
      apiClient.get<{ totalCount: number; items: SpecSourceDto[] }>("/api/sources", { params }),

    get: (id: string) =>
      apiClient.get<SpecSourceDto>(`/api/sources/${id}`),

    create: (data: CreateSpecSourceDto) =>
      apiClient.post<SpecSourceDto, CreateSpecSourceDto>("/api/sources", data),

    update: (id: string, data: UpdateSpecSourceDto) =>
      apiClient.put<SpecSourceDto, UpdateSpecSourceDto>(`/api/sources/${id}`, data),

    test: (id: string) =>
      apiClient.post<SpecSourceReachabilityDto>(`/api/sources/${id}/test`),

    passivate: (id: string) =>
      apiClient.post<SpecSourceDto>(`/api/sources/${id}/passivate`),

    captureSnapshot: (sourceId: string, documentId: string) =>
      apiClient.post<SpecSnapshotHeaderDto>(
        `/api/sources/${sourceId}/documents/${documentId}/snapshot`,
      ),

    listSnapshots: (sourceId: string, documentId: string, params?: { skipCount?: number; maxResultCount?: number }) =>
      apiClient.get<{ totalCount: number; items: SpecSnapshotHeaderDto[] }>(
        `/api/sources/${sourceId}/documents/${documentId}/snapshots`,
        { params },
      ),
      
    configureMonitoring: (sourceId: string, documentId: string, data: ConfigureSpecDocumentMonitoringDto) =>
      apiClient.post<SpecDocumentMonitoringDto, ConfigureSpecDocumentMonitoringDto>(
        `/api/sources/${sourceId}/documents/${documentId}/monitoring`, data
      ),
  },

  // Snapshots
  snapshots: {
    get: (id: string) =>
      apiClient.get<SpecSnapshotDetailDto>(`/api/snapshots/${id}`),

    listOperations: (id: string, params?: { skipCount?: number; maxResultCount?: number; filter?: string }) =>
      apiClient.get<SnapshotOperationInventoryDto>(`/api/snapshots/${id}/operations`, { params }),
      
    /* Bu uc yanit sekli uretilmis schema.d.ts'te yok; tip uretimi tek kokenli Swagger'a
     * baglandiginda (G-03) gercek DTO ile degistirilir. `unknown` cagiranin daraltma
     * yapmasini zorunlu kilar, `any` ise sessizce her seye izin verirdi. */
    findOperation: (id: string, data: FindOperationDto) =>
      apiClient.post<unknown, FindOperationDto>(`/api/snapshots/${id}/operations/find`, data),

    describeSchema: (id: string, data: DescribeSchemaDto) =>
      apiClient.post<unknown, DescribeSchemaDto>(`/api/snapshots/${id}/schemas/describe`, data),

    getAuthoringResult: (resultRef: string) =>
      apiClient.get<unknown>(`/api/snapshots/authoring-results/${resultRef}`),
  },

  // Checks (comparison runs)
  checks: {
    list: (params?: GetContractCheckRunsInput) =>
      apiClient.get<{ totalCount: number; items: ContractCheckRunHeaderDto[] }>("/api/checks", { params }),

    execute: (data: ExecuteContractCheckDto) =>
      apiClient.post<ContractCheckRunStatusDto, ExecuteContractCheckDto>("/api/checks", data),

    get: (id: string) =>
      apiClient.get<ContractCheckRunDetailDto>(`/api/checks/${id}`),

    getFindings: (id: string, params?: GetContractCheckFindingsInput) =>
      apiClient.get<FindingPagedResultDto>(`/api/checks/${id}/findings`, { params }),

    getReport: (id: string) =>
      apiClient.get<ContractCheckReportDto>(`/api/checks/${id}/report`),

    getStatus: (id: string) =>
      apiClient.get<ContractCheckRunStatusDto>(`/api/checks/${id}/status`),
  },

  // Diagnosis
  diagnosis: {
    diagnose: (data: DiagnoseRequestDto) =>
      apiClient.post<DiagnosisReportDto, DiagnoseRequestDto>("/api/contract-checks/diagnosis", data),
  },

  /* Uygunluk (conformance) oracle'ı — kök `ApiContractCheckerRoutes.Conformance`.
   * Bu yedi uç UI'da hiç bağlı değildi; eski istemci `/api/conformance/runs` diye
   * var olmayan bir yola gidiyordu. Yanıtlar üretilmiş şemada yok, G-03'te
   * gerçek DTO'ya bağlanacaklar. */
  conformance: {
    response: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/api/contract-checks/conformance/response", data),
    request: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/api/contract-checks/conformance/request", data),
    requestExample: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/api/contract-checks/conformance/request-example", data),
    operationBindings: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/api/contract-checks/conformance/operation-bindings", data),
    assertionDerivability: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/api/contract-checks/conformance/assertion-derivability", data),
    sampleSets: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/api/contract-checks/conformance/sample-sets", data),
    operationLinks: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/api/contract-checks/conformance/operation-links", data),
  },
} as const;
