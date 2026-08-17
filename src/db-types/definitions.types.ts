import type { Guid } from "@/db-types/api.types";

// Backend (KBP-46) kapsam'i TRANSIENT tutar: ComparisonDefinition scope tutmaz/dondurmez.
// Kapsam yalnizca calistirma aninda ExecuteComparisonRunDto.scopeRules ile gecirilir (bkz. runs.types.ts).
// Bu yuzden definition DTO'larinda scopeRules alani YOKTUR; backend gonderilse de dusurur.
export interface ComparisonDefinitionDto {
  id: Guid;
  name: string;
  sourceConnectionId: Guid;
  sourceConnectionName: string;
  targetConnectionId: Guid;
  targetConnectionName: string;
  comparisonTypeId: Guid;
  comparisonTypeCode: string;
  comparisonTypeName: string;
  description?: string | null;
  isActive: boolean;
}

export interface CreateComparisonDefinitionDto {
  name: string;
  sourceConnectionId: Guid;
  targetConnectionId: Guid;
  comparisonTypeId: Guid;
  description?: string | null;
  isActive: boolean;
}

export type UpdateComparisonDefinitionDto = CreateComparisonDefinitionDto;
