import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export type ContractCheckRunHeaderDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Runs.ContractCheckRunHeaderDto"];
export type ContractCheckRunStatusDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Runs.ContractCheckRunStatusDto"];
export type ContractCheckRunDetailDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Runs.ContractCheckRunDetailDto"];
export type ContractCheckReportDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Runs.Reports.ContractCheckReportDto"];
export type ExecuteContractCheckDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Runs.ExecuteContractCheckDto"];
export type ContractCheckScopeRuleDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Runs.ContractCheckScopeRuleDto"];
export type FindingDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Runs.FindingDto"];
export type ContractCheckRunPage =
  components["schemas"]["Volo.Abp.Application.Dtos.PagedResultDtoOfPtn.ApiContractChecker.Dtos.Runs.ContractCheckRunHeaderDto"];

export interface GetContractCheckFindingsParams {
  severityCode?: string;
  kindCode?: string;
  changeStateCode?: string;
  path?: string;
  schemaName?: string;
  sinceRunId?: string;
  fingerprints?: string[];
  skipCount?: number;
  maxResultCount?: number;
}

export interface FindingPagedResultDto {
  items?: FindingDto[] | null;
  totalCount: number;
  requestedMaxResultCount: number;
  effectiveMaxResultCount: number;
  isTruncated: boolean;
  responseBytes: number;
}

export const checksApi = {
  detail: (id: string) => apiClient.get<ContractCheckRunDetailDto>(`/api/checks/${id}`),
  execute: (input: ExecuteContractCheckDto) =>
    apiClient.post<ContractCheckRunStatusDto, ExecuteContractCheckDto>("/api/checks", input),
  list: (skipCount = 0, maxResultCount = 50) =>
    apiClient.get<ContractCheckRunPage>("/api/checks", {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  findings: (id: string, params: GetContractCheckFindingsParams = {}) =>
    apiClient.get<FindingPagedResultDto>(`/api/checks/${id}/findings`, {
      params: {
        ChangeStateCode: params.changeStateCode || undefined,
        Fingerprints: params.fingerprints,
        KindCode: params.kindCode || undefined,
        MaxResultCount: params.maxResultCount ?? 50,
        Path: params.path || undefined,
        SchemaName: params.schemaName || undefined,
        SeverityCode: params.severityCode || undefined,
        SinceRunId: params.sinceRunId || undefined,
        SkipCount: params.skipCount ?? 0,
      },
    }),
  report: (id: string) => apiClient.get<ContractCheckReportDto>(`/api/checks/${id}/report`),
  status: (id: string) => apiClient.get<ContractCheckRunStatusDto>(`/api/checks/${id}/status`),
};
