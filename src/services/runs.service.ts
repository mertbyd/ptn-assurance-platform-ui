import apiClient from "@/lib/api-client";
import { requireEntityId } from "@/lib/guid";
import { createReadService } from "@/services/base.service";
import type { ComparisonReportDto, ComparisonRunDetailDto, ComparisonRunDto, ExecuteComparisonRunDto, Guid } from "@/types";

const runsBase = createReadService<ComparisonRunDto>("/api/comparison/runs");

export const comparisonRunsService = {
  ...runsBase,

  getDetail(id: Guid, signal?: AbortSignal): Promise<ComparisonRunDetailDto> {
    return apiClient.get(`/api/comparison/runs/${requireEntityId(id, "Çalıştırma")}/detail`, { signal });
  },

  execute(dto: ExecuteComparisonRunDto): Promise<ComparisonRunDetailDto> {
    requireEntityId(dto.comparisonDefinitionId, "Karşılaştırma tanımı");
    return apiClient.post("/api/comparison/runs/execute", dto);
  },

  async getReport(id: Guid, signal?: AbortSignal): Promise<ComparisonReportDto> {
    const runId = requireEntityId(id, "Çalıştırma");
    return apiClient.get<ComparisonReportDto>(`/api/comparison/runs/${runId}/report`, { signal });
  },

  async waitUntilTerminal(id: Guid, signal?: AbortSignal): Promise<ComparisonRunDetailDto> {
    const runId = requireEntityId(id, "Çalıştırma");
    while (true) {
      const run = await this.getDetail(runId, signal);
      const statusCode = run.statusCode.toLowerCase();
      if (statusCode === "completed") return run;
      if (statusCode === "failed") throw new Error(run.errorMessage || "Karşılaştırma arka planda başarısız oldu.");

      await new Promise<void>((resolve, reject) => {
        const timeoutId = window.setTimeout(resolve, 1_500);
        signal?.addEventListener("abort", () => {
          window.clearTimeout(timeoutId);
          reject(new DOMException("İstek iptal edildi.", "AbortError"));
        }, { once: true });
      });
    }
  },
} as const;
