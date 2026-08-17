import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export type CreateSpecSourceDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Sources.CreateSpecSourceDto"];
export type UpdateSpecSourceDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Sources.UpdateSpecSourceDto"];
export type SpecSourceDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Sources.SpecSourceDto"];
export type SpecDocumentDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Sources.SpecDocumentDto"];
export type SpecSourceReachabilityDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Sources.SpecSourceReachabilityDto"];
export type SpecSourcePage =
  components["schemas"]["Volo.Abp.Application.Dtos.PagedResultDtoOfPtn.ApiContractChecker.Dtos.Sources.SpecSourceDto"];
export type SnapshotPage =
  components["schemas"]["Volo.Abp.Application.Dtos.PagedResultDtoOfPtn.ApiContractChecker.Dtos.Snapshots.SpecSnapshotHeaderDto"];
/* Snapshot satırının kendisi: yazarlık tezgâhı da bu tipi kullanır. Tip Swagger'dan
 * üretilir; elle yazılmış bir ikinci sürüm tutmak alan kaymasına davetiyedir. */
export type SpecSnapshotHeaderDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Snapshots.SpecSnapshotHeaderDto"];
export type SpecSnapshotDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Snapshots.SpecSnapshotDto"];
export type ConfigureSpecDocumentMonitoringDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Sources.ConfigureSpecDocumentMonitoringDto"];
export type SpecDocumentMonitoringDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Sources.SpecDocumentMonitoringDto"];

export const sourcesApi = {
  create: (input: CreateSpecSourceDto) => apiClient.post<SpecSourceDto, CreateSpecSourceDto>("/api/sources", input),
  get: (id: string) => apiClient.get<SpecSourceDto>(`/api/sources/${id}`),
  list: (skipCount: number, maxResultCount: number) =>
    apiClient.get<SpecSourcePage>("/api/sources", { params: { MaxResultCount: maxResultCount, SkipCount: skipCount } }),
  configureMonitoring: (id: string, documentId: string, input: ConfigureSpecDocumentMonitoringDto) =>
    apiClient.post<SpecDocumentMonitoringDto, ConfigureSpecDocumentMonitoringDto>(
      `/api/sources/${id}/documents/${documentId}/monitoring`,
      input,
    ),
  passivate: (id: string) => apiClient.post<SpecSourceDto>(`/api/sources/${id}/passivate`),
  snapshots: (id: string, documentId: string, skipCount = 0, maxResultCount = 50) =>
    apiClient.get<SnapshotPage>(`/api/sources/${id}/documents/${documentId}/snapshots`, {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  takeSnapshot: (id: string, documentId: string) =>
    apiClient.post<SpecSnapshotDto>(`/api/sources/${id}/documents/${documentId}/snapshot`),
  test: (id: string) => apiClient.post<SpecSourceReachabilityDto>(`/api/sources/${id}/test`),
  update: (id: string, input: UpdateSpecSourceDto) =>
    apiClient.put<SpecSourceDto, UpdateSpecSourceDto>(`/api/sources/${id}`, input),
};
