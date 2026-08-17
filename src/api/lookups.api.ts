import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export const lookupKinds = ["checkRunStatuses", "differenceDirections", "differenceKinds", "differenceSeverities", "specFormats"] as const;
export type LookupKind = (typeof lookupKinds)[number];

export type LookupDto =
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.CheckRunStatusDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.DifferenceDirectionDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.DifferenceKindDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.DifferenceSeverityDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.SpecFormatDto"];
export type CreateLookupDto =
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.CreateCheckRunStatusDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.CreateDifferenceDirectionDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.CreateDifferenceKindDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.CreateDifferenceSeverityDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.CreateSpecFormatDto"];
export type UpdateLookupDto =
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.UpdateCheckRunStatusDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.UpdateDifferenceDirectionDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.UpdateDifferenceKindDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.UpdateDifferenceSeverityDto"]
  | components["schemas"]["Ptn.ApiContractChecker.Dtos.Lookups.UpdateSpecFormatDto"];
export type LookupPage =
  components["schemas"]["Volo.Abp.Application.Dtos.PagedResultDtoOfPtn.ApiContractChecker.Dtos.Lookups.CheckRunStatusDto"];

const lookupPaths: Record<LookupKind, string> = {
  checkRunStatuses: "/api/api-contract/lookups/check-run-statuses",
  differenceDirections: "/api/api-contract/lookups/difference-directions",
  differenceKinds: "/api/api-contract/lookups/difference-kinds",
  differenceSeverities: "/api/api-contract/lookups/difference-severities",
  specFormats: "/api/api-contract/lookups/spec-formats",
};

export const lookupsApi = {
  create: (kind: LookupKind, input: CreateLookupDto) =>
    apiClient.post<LookupDto, CreateLookupDto>(lookupPaths[kind], input),
  get: (kind: LookupKind, id: string) =>
    apiClient.get<LookupDto>(`${lookupPaths[kind]}/${id}`),
  list: (kind: LookupKind, skipCount = 0, maxResultCount = 100) =>
    apiClient.get<LookupPage>(lookupPaths[kind], {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  passivate: (kind: LookupKind, id: string) =>
    apiClient.post<LookupDto>(`${lookupPaths[kind]}/${id}/passivate`),
  update: (kind: LookupKind, id: string, input: UpdateLookupDto) =>
    apiClient.put<LookupDto, UpdateLookupDto>(`${lookupPaths[kind]}/${id}`, input),
};
