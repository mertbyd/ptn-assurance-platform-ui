import type { Guid } from "@/db-types/api.types";
import type { ComparisonFindingsDto } from "@/db-types/findings.types";
import type { ScopeRuleDto } from "@/db-types/scope.types";

export interface DatabaseSchemaDto {
  name: string;
}

export interface DatabaseSchemaObjectDto {
  schema: string;
  name: string;
  objectTypeCode: string;
}

export interface SchemaColumnDto {
  name: string;
  ordinal: number;
  rawDataType: string;
  isNullable: boolean;
  maxLength?: number | null;
  numericPrecision?: number | null;
  numericScale?: number | null;
  isIdentity: boolean;
  defaultValueSql?: string | null;
}

export interface SchemaIndexDto {
  name: string;
  columns: string[];
  isUnique: boolean;
  isPrimaryKey: boolean;
  includedColumns: string[];
  filterDefinition?: string | null;
  definition?: string | null;
}

export interface SchemaConstraintDto {
  name: string;
  typeCode: string;
  columns: string[];
  definition?: string | null;
  referencedTable?: string | null;
  referencedColumns: string[];
  deleteActionCode?: string | null;
  updateActionCode?: string | null;
}

export interface SchemaTriggerDto {
  name: string;
  definition: string;
}

export interface SchemaObjectDefinitionDto {
  schema: string;
  name: string;
  objectTypeCode: string;
  definition?: string | null;
}

export interface SchemaTableDto {
  schema: string;
  name: string;
  columns: SchemaColumnDto[];
  indexes: SchemaIndexDto[];
  constraints: SchemaConstraintDto[];
  triggers: SchemaTriggerDto[];
}

export interface SchemaSnapshotDto {
  engineCode: string;
  databaseName: string;
  collectedAt: string;
  tables: SchemaTableDto[];
  objects: SchemaObjectDefinitionDto[];
}

export interface CompareSchemaRequestDto {
  sourceConnectionId: Guid;
  targetConnectionId: Guid;
  comparisonTypeCode: string;
  schemaNames?: string[] | null;
  scopeRules?: ScopeRuleDto[] | null;
}

export type CompareSchemaResponseDto = ComparisonFindingsDto;
