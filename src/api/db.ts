/** Database Checker public HTTP contract. */

import { apiClient } from "@/lib/api-client";
import type {
  CompareSchemaRequestDto,
  CompareSchemaResponseDto,
  ComparisonDefinitionDto,
  ComparisonReportDto,
  ComparisonRunDetailDto,
  ComparisonRunDto,
  CreateComparisonDefinitionDto,
  CreateDatabaseConnectionDto,
  DatabaseConnectionDto,
  DatabaseSchemaDto,
  DatabaseSchemaObjectDto,
  ExecuteComparisonRunDto,
  LookupCommonDto,
  SchemaSnapshotDto,
  TestConnectionResultDto,
  UpdateComparisonDefinitionDto,
  UpdateDatabaseConnectionDto,
} from "@/types";

export type {
  ComparisonDefinitionDto,
  ComparisonReportDto,
  ComparisonRunDetailDto,
  ComparisonRunDto,
  CreateComparisonDefinitionDto,
  CreateDatabaseConnectionDto,
  DatabaseConnectionDto,
  ExecuteComparisonRunDto,
  TestConnectionResultDto,
  UpdateComparisonDefinitionDto,
  UpdateDatabaseConnectionDto,
};

export interface SchemaFingerprintEntryDto {
  name: string;
  fingerprint: string;
}

export interface SchemaFingerprintDto {
  snapshotFingerprint: string;
  algorithmCode: string;
  algorithmVersion: number;
  schemas: SchemaFingerprintEntryDto[];
  tables: SchemaFingerprintEntryDto[];
  computedAt: string;
}

export interface TableDescriptionDto {
  schemaName: string;
  tableName: string;
  columns: { name: string; canonicalDataTypeCode: string; isNullable: boolean }[];
  primaryKey?: { name: string; columns: string[] } | null;
  uniqueIndexes: { name: string; columns: string[] }[];
  foreignKeyNeighbors: {
    directionCode: string;
    constraintName: string;
    schemaName: string;
    tableName: string;
    localColumns: string[];
    neighborColumns: string[];
  }[];
  lintWarnings: { warningCode: string; columnName?: string | null }[];
}

export interface FindingDto {
  fingerprint?: string | null;
  address: {
    sourceEngineCode: string;
    targetEngineCode: string;
    schemaName?: string | null;
    objectTypeCode: string;
    objectName: string;
    childName?: string | null;
  };
  severityCode: string;
  kindCode: string;
  objectTypeCode: string;
  schemaName?: string | null;
  objectName: string;
  tableName?: string | null;
  childName?: string | null;
  confidenceCode?: string | null;
  sourceValue?: string | null;
  targetValue?: string | null;
  sourceRowCount?: number | null;
  targetRowCount?: number | null;
  rowCountDifference?: number | null;
  changeSummary?: string | null;
}

export interface FindingQueryInput {
  skipCount?: number;
  maxResultCount?: number;
  severityCode?: string;
  kindCode?: string;
  objectTypeCode?: string;
  schemaName?: string;
  tableName?: string;
  sinceRunId?: string;
  fingerprints?: string[];
}

export interface DiagnoseRequestDto {
  connectionId: string;
  signalCode: string;
  contextJson?: string | null;
}

export interface DiagnosisHypothesisDto {
  code: string;
  confidenceCode: string;
  description: string;
  probeResults?: string[] | null;
}

export interface DiagnosisReportDto {
  connectionId: string;
  signalCode: string;
  hypotheses: DiagnosisHypothesisDto[];
  generatedAt: string;
}

export interface ProjectionRequestDto {
  connectionId: string;
  schema: string;
  table: string;
  keyColumn: string;
  keyValue: string;
  columns?: string[];
  maxRows?: number;
}

export interface ProjectionResultDto {
  schema: string;
  table: string;
  rows: Record<string, unknown>[];
  truncated: boolean;
}

export interface ColumnExpectationDto {
  column: string;
  matcherCode: string;
  value?: unknown;
  tolerance?: number;
}

export interface RowAssertionRequestDto {
  connectionId: string;
  schema: string;
  table: string;
  key: Record<string, unknown>;
  expectations?: ColumnExpectationDto[];
  timeoutMs?: number;
  pollIntervalMs?: number;
  correlationRef?: { traceId?: string; stepKey?: string };
}

export interface RowAssertionResultDto {
  outcomeCode: string;
  observedRowCount?: number | null;
  observedAtMs?: number | null;
  attemptCount?: number | null;
  failedExpectations?: string[] | null;
  correlationRef?: { traceId?: string; stepKey?: string };
}

export interface DerivabilityValidationRequestDto {
  sourceConnectionId: string;
  targetConnectionId: string;
  assertion: RowAssertionRequestDto;
}

export interface DerivabilityValidationResultDto {
  isDerivable: boolean;
  explanation?: string;
}

type Page<T> = { totalCount: number; items: T[] };
type DatabaseLookupKind =
  | "comparison-confidences"
  | "comparison-run-statuses"
  | "comparison-types"
  | "database-engines"
  | "difference-kinds"
  | "report-formats"
  | "schema-object-types"
  | "scope-kinds";

const repeatArrayParams = (params: Record<string, unknown>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
    } else if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  return search.toString();
};

const connections = {
  list: (params?: { skipCount?: number; maxResultCount?: number }) =>
    apiClient.get<Page<DatabaseConnectionDto>>("/api/connections/database-connections", { params }),
  getList: (params?: { skipCount?: number; maxResultCount?: number }) =>
    apiClient.get<Page<DatabaseConnectionDto>>("/api/connections/database-connections", { params }),
  get: (id: string) =>
    apiClient.get<DatabaseConnectionDto>(`/api/connections/database-connections/${id}`),
  create: (data: CreateDatabaseConnectionDto) =>
    apiClient.post<DatabaseConnectionDto, CreateDatabaseConnectionDto>("/api/connections/database-connections", data),
  update: (id: string, data: UpdateDatabaseConnectionDto) =>
    apiClient.put<DatabaseConnectionDto, UpdateDatabaseConnectionDto>(`/api/connections/database-connections/${id}`, data),
  test: (id: string) =>
    apiClient.post<TestConnectionResultDto>(`/api/connections/database-connections/${id}/test-connection`),
  testConnection: (id: string) =>
    apiClient.post<TestConnectionResultDto>(`/api/connections/database-connections/${id}/test-connection`),
  passivate: (id: string) =>
    apiClient.post<DatabaseConnectionDto>(`/api/connections/database-connections/${id}/passivate`),
};

export const dbApi = {
  connections,

  definitions: {
    list: (params?: { skipCount?: number; maxResultCount?: number }) =>
      apiClient.get<Page<ComparisonDefinitionDto>>("/api/definitions/comparison-definitions", { params }),
    get: (id: string) =>
      apiClient.get<ComparisonDefinitionDto>(`/api/definitions/comparison-definitions/${id}`),
    create: (data: CreateComparisonDefinitionDto) =>
      apiClient.post<ComparisonDefinitionDto, CreateComparisonDefinitionDto>("/api/definitions/comparison-definitions", data),
    update: (id: string, data: UpdateComparisonDefinitionDto) =>
      apiClient.put<ComparisonDefinitionDto, UpdateComparisonDefinitionDto>(`/api/definitions/comparison-definitions/${id}`, data),
  },

  schema: {
    getSchemas: (connectionId: string) =>
      apiClient.get<DatabaseSchemaDto[]>(`/api/comparison/schema-discovery/${connectionId}/schemas`),
    getObjects: (connectionId: string, schema: string) =>
      apiClient.get<DatabaseSchemaObjectDto[]>(`/api/comparison/schema-discovery/${connectionId}/objects`, { params: { schema } }),
    describeTable: (connectionId: string, schema: string, table: string) =>
      apiClient.get<TableDescriptionDto>(`/api/comparison/schema-discovery/${connectionId}/tables/${encodeURIComponent(schema)}/${encodeURIComponent(table)}/describe`),
    getFingerprint: (connectionId: string, schemaNames: string[] = []) =>
      apiClient.get<SchemaFingerprintDto>(`/api/comparison/schema-discovery/${connectionId}/fingerprint`, {
        params: { schemaNames },
        paramsSerializer: repeatArrayParams,
      }),
    getSnapshot: (connectionId: string, schemaNames: string[] = []) =>
      apiClient.get<SchemaSnapshotDto>(`/api/comparison/schema-discovery/${connectionId}/snapshot`, {
        params: { schemaNames },
        paramsSerializer: repeatArrayParams,
      }),
    compare: (data: CompareSchemaRequestDto) =>
      apiClient.post<CompareSchemaResponseDto, CompareSchemaRequestDto>("/api/comparison/schema-comparison", data),
  },

  runs: {
    list: (params?: { skipCount?: number; maxResultCount?: number }) =>
      apiClient.get<Page<ComparisonRunDto>>("/api/comparison/runs", { params }),
    get: (id: string) => apiClient.get<ComparisonRunDto>(`/api/comparison/runs/${id}`),
    getDetail: (id: string, signal?: AbortSignal) =>
      apiClient.get<ComparisonRunDetailDto>(`/api/comparison/runs/${id}/detail`, { signal }),
    getFindings: (id: string, params?: FindingQueryInput, signal?: AbortSignal) =>
      apiClient.get<Page<FindingDto>>(`/api/comparison/runs/${id}/findings`, {
        params,
        paramsSerializer: repeatArrayParams,
        signal,
      }),
    getReport: (id: string, signal?: AbortSignal) =>
      apiClient.get<ComparisonReportDto>(`/api/comparison/runs/${id}/report`, { signal }),
    waitUntilTerminal: async (id: string, signal?: AbortSignal) => {
      while (true) {
        const run = await apiClient.get<ComparisonRunDetailDto>(`/api/comparison/runs/${id}/detail`, { signal });
        const status = run.statusCode.toLowerCase();
        if (status === "completed") return run;
        if (status === "failed") throw new Error(run.errorMessage || "Karşılaştırma arka planda başarısız oldu.");
        await new Promise<void>((resolve, reject) => {
          const timeoutId = window.setTimeout(resolve, 1_500);
          signal?.addEventListener("abort", () => {
            window.clearTimeout(timeoutId);
            reject(new DOMException("İstek iptal edildi.", "AbortError"));
          }, { once: true });
        });
      }
    },
    execute: (data: ExecuteComparisonRunDto) =>
      apiClient.post<ComparisonRunDetailDto, ExecuteComparisonRunDto>("/api/comparison/runs/execute", data),
  },

  assertions: {
    assertRow: (data: RowAssertionRequestDto) =>
      apiClient.post<RowAssertionResultDto, RowAssertionRequestDto>("/api/comparison/assertions/row", data),
    assertCount: (data: RowAssertionRequestDto) =>
      apiClient.post<RowAssertionResultDto, RowAssertionRequestDto>("/api/comparison/assertions/count", data),
    assertAbsent: (data: RowAssertionRequestDto) =>
      apiClient.post<RowAssertionResultDto, RowAssertionRequestDto>("/api/comparison/assertions/absent", data),
    validateDerivability: (data: DerivabilityValidationRequestDto) =>
      apiClient.post<DerivabilityValidationResultDto, DerivabilityValidationRequestDto>("/api/comparison/assertions/derivability", data),
    /* Toplu assertion: tek çağrıda birden çok hedefli beklenti çalıştırır. */
    assertBatch: (data: { assertions: RowAssertionRequestDto[] }) =>
      apiClient.post<RowAssertionResultDto[], { assertions: RowAssertionRequestDto[] }>("/api/comparison/assertions/batch", data),
  },

  /* Yazma kümesi yeteneği — DİKKAT: bu üç uç `/api` öneki TAŞIMAZ, kökü
   * doğrudan `/capabilities/write-set`tir (backend rota sabitiyle doğrulandı).
   * Salt-okunur checker sınırının dışındadır: hedefe yazan sandbox işlemidir. */
  writeSetCapability: {
    probe: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/capabilities/write-set/probe", data),
    capture: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/capabilities/write-set/capture", data),
    release: (data: Record<string, unknown>) =>
      apiClient.post<unknown>("/capabilities/write-set/release", data),
  },

  diagnosis: {
    diagnose: (data: DiagnoseRequestDto) =>
      apiClient.post<DiagnosisReportDto, DiagnoseRequestDto>("/api/comparison/diagnosis", data),
  },

  projection: {
    projectRows: (data: ProjectionRequestDto) =>
      apiClient.post<ProjectionResultDto, ProjectionRequestDto>("/api/comparison/projections/rows", data),
  },

  lookups: {
    list: (kind: DatabaseLookupKind, params?: { skipCount?: number; maxResultCount?: number }) =>
      apiClient.get<Page<LookupCommonDto>>(`/api/database-comparison/lookups/${kind}`, { params }),
    get: (kind: DatabaseLookupKind, id: string) =>
      apiClient.get<LookupCommonDto>(`/api/database-comparison/lookups/${kind}/${id}`),
  },
} as const;
