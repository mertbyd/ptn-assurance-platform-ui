import { createCreateUpdateService } from "@/services/base.service";
import type {
  ComparisonDefinitionDto,
  CreateComparisonDefinitionDto,
  UpdateComparisonDefinitionDto,
} from "@/types";

// Backend (KBP-46) kapsam'i transient tuttugu icin definition uzerinde scope-rules ucu YOKTUR
// (eski GET/PUT/DELETE .../scope-rules uclari kaldirildi; kapsam execute aninda gecilir).
const definitionsBase = createCreateUpdateService<ComparisonDefinitionDto, CreateComparisonDefinitionDto, UpdateComparisonDefinitionDto>("/api/definitions/comparison-definitions");

export const comparisonDefinitionsService = {
  ...definitionsBase,
} as const;

export const definitionsService = comparisonDefinitionsService;
