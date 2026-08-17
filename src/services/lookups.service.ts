import { createCrudService } from "@/services/base.service";
import type {
  ComparisonConfidenceDto,
  ComparisonRunStatusDto,
  ComparisonTypeDto,
  DatabaseEngineDto,
  DifferenceKindDto,
  LookupCollections,
  LookupCreateOrUpdateDto,
  ReportFormatDto,
  SchemaObjectTypeDto,
  ScopeKindDto,
} from "@/types";

const databaseLookupBase = "/api/database-comparison/lookups";

export const databaseEnginesService = createCrudService<DatabaseEngineDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/database-engines`);
export const comparisonTypesService = createCrudService<ComparisonTypeDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/comparison-types`);
export const runStatusesService = createCrudService<ComparisonRunStatusDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/comparison-run-statuses`);
export const scopeKindsService = createCrudService<ScopeKindDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/scope-kinds`);
export const schemaObjectTypesService = createCrudService<SchemaObjectTypeDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/schema-object-types`);
export const differenceKindsService = createCrudService<DifferenceKindDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/difference-kinds`);
export const comparisonConfidencesService = createCrudService<ComparisonConfidenceDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/comparison-confidences`);
export const reportFormatsService = createCrudService<ReportFormatDto, LookupCreateOrUpdateDto, LookupCreateOrUpdateDto>(`${databaseLookupBase}/report-formats`);

export const lookupsService = {
  async getAll(): Promise<LookupCollections> {
    const [
      databaseEngines,
      comparisonTypes,
      runStatuses,
      scopeKinds,
      schemaObjectTypes,
      differenceKinds,
      comparisonConfidences,
      reportFormats,
    ] = await Promise.all([
      databaseEnginesService.getList({ maxResultCount: 100 }),
      comparisonTypesService.getList({ maxResultCount: 100 }),
      runStatusesService.getList({ maxResultCount: 100 }),
      scopeKindsService.getList({ maxResultCount: 100 }),
      schemaObjectTypesService.getList({ maxResultCount: 100 }),
      differenceKindsService.getList({ maxResultCount: 100 }),
      comparisonConfidencesService.getList({ maxResultCount: 100 }),
      reportFormatsService.getList({ maxResultCount: 100 }),
    ]);

    return {
      databaseEngines: databaseEngines.items,
      comparisonTypes: comparisonTypes.items,
      runStatuses: runStatuses.items,
      scopeKinds: scopeKinds.items,
      schemaObjectTypes: schemaObjectTypes.items,
      differenceKinds: differenceKinds.items,
      comparisonConfidences: comparisonConfidences.items,
      reportFormats: reportFormats.items,
    };
  },
} as const;
