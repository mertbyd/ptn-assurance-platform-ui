import apiClient from "@/lib/api-client";
import type { CompareSchemaRequestDto, CompareSchemaResponseDto } from "@/types";

export const schemaComparisonService = {
  compare(dto: CompareSchemaRequestDto): Promise<CompareSchemaResponseDto> {
    return apiClient.post("/api/comparison/schema-comparison", dto);
  },
} as const;
