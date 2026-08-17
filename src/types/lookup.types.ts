import type { Guid } from "@/types/api.types";

export interface LookupCommonDto {
  id: Guid;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export type DatabaseEngineDto = LookupCommonDto;
export type ComparisonTypeDto = LookupCommonDto;
export type ComparisonRunStatusDto = LookupCommonDto;
export type ScopeKindDto = LookupCommonDto;
export type SchemaObjectTypeDto = LookupCommonDto;
export type DifferenceKindDto = LookupCommonDto;
export type ComparisonConfidenceDto = LookupCommonDto;
export type ReportFormatDto = LookupCommonDto;

export interface LookupCreateOrUpdateDto {
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface LookupCollections {
  databaseEngines: DatabaseEngineDto[];
  comparisonTypes: ComparisonTypeDto[];
  runStatuses: ComparisonRunStatusDto[];
  scopeKinds: ScopeKindDto[];
  schemaObjectTypes: SchemaObjectTypeDto[];
  differenceKinds: DifferenceKindDto[];
  comparisonConfidences: ComparisonConfidenceDto[];
  reportFormats: ReportFormatDto[];
}
