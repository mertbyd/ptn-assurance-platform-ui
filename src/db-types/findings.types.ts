export interface SchemaDifferenceDto {
  schemaName: string;
  objectName: string;
  childName?: string | null;
  objectTypeCode: string;
  kindCode: string;
  confidenceCode: string;
  sourceDefinition?: string | null;
  targetDefinition?: string | null;
  changeSummary?: string | null;
}

export interface MigrationDifferenceDto {
  sourceSchemaName?: string | null;
  targetSchemaName?: string | null;
  migrationId: string;
  kindCode: string;
  sourceProductVersion?: string | null;
  targetProductVersion?: string | null;
}

export interface DataValueDifferenceDto {
  columnName: string;
  sourceValue?: string | null;
  targetValue?: string | null;
}

export interface DataRowDifferenceDto {
  primaryKeyValue: string;
  kindCode: string;
  valueDifferences: DataValueDifferenceDto[];
}

export interface DataDifferenceDto {
  schemaName: string;
  tableName: string;
  kindCode: string;
  sourceRowCount?: number | null;
  targetRowCount?: number | null;
  rowCountDifference?: number | null;
  sourceHash?: string | null;
  targetHash?: string | null;
  hasRowLevelDifference: boolean;
  rowDifferences: DataRowDifferenceDto[];
}

export interface ComparisonFindingsDto {
  schemaDifferences: SchemaDifferenceDto[];
  migrationDifferences: MigrationDifferenceDto[];
  dataDifferences: DataDifferenceDto[];
}

export interface ComparisonReportContentDto {
  formatCode: string;
  content: string;
}
