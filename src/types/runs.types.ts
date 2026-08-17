import type { Guid } from "@/types/api.types";
import type { ComparisonFindingsDto, ComparisonReportContentDto } from "@/types/findings.types";
import type { ScopeRuleDto } from "@/types/scope.types";

export interface ComparisonRunDto {
  id: Guid;
  comparisonDefinitionId?: Guid | null;
  comparisonDefinitionName?: string | null;
  sourceConnectionId: Guid;
  sourceConnectionName: string;
  targetConnectionId: Guid;
  targetConnectionName: string;
  comparisonTypeId: Guid;
  comparisonTypeCode: string;
  comparisonTypeName: string;
  statusId: Guid;
  statusCode: string;
  statusName: string;
  startedAt?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
  schemaDifferenceCount: number;
  dataDifferenceCount: number;
  migrationDifferenceCount: number;
  creationTime: string;
}

export interface ComparisonRunDetailDto extends ComparisonRunDto {
  findings: ComparisonFindingsDto;
  reports: ComparisonReportContentDto[];
}

export interface ExecuteComparisonRunDto {
  comparisonDefinitionId: Guid;
  // Backend run'i kapsam'i kalici tutmaz; calistirma aninda gecilen kurallarla filtreler.
  // Canli onizleme (schema-comparison) ile ayni bulgular icin sihirbazdaki kapsam burada gecilmeli.
  scopeRules?: ScopeRuleDto[] | null;
}

export interface ComparisonReportCountDto {
  code: string;
  count: number;
}

export interface ComparisonReportGroupDto {
  groupKey: string;
  differenceCount: number;
  kindCounts: ComparisonReportCountDto[];
}

export interface ComparisonReportSummaryDto {
  totalDifferenceCount: number;
  schemaDifferenceCount: number;
  dataDifferenceCount: number;
  migrationDifferenceCount: number;
  kindCounts: ComparisonReportCountDto[];
  objectTypeCounts: ComparisonReportCountDto[];
}

export interface ComparisonReportDto {
  runId: Guid;
  sourceConnectionName: string;
  sourceEngineCode: string;
  sourceEngineName: string;
  targetConnectionName: string;
  targetEngineCode: string;
  targetEngineName: string;
  comparisonTypeCode: string;
  comparisonTypeName: string;
  statusCode: string;
  statusName: string;
  startedAt?: string | null;
  completedAt?: string | null;
  creationTime: string;
  summary: ComparisonReportSummaryDto;
  objectTypeGroups: ComparisonReportGroupDto[];
  tableGroups: ComparisonReportGroupDto[];
  findings: ComparisonFindingsDto;
}
