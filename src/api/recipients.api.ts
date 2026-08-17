import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export type CheckRecipientDto = components["schemas"]["Ptn.ApiContractChecker.Dtos.Recipients.CheckRecipientDto"];
export type CreateCheckRecipientDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Recipients.CreateCheckRecipientDto"];
export type UpdateCheckRecipientDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Recipients.UpdateCheckRecipientDto"];
export type CheckRecipientPage =
  components["schemas"]["Volo.Abp.Application.Dtos.PagedResultDtoOfPtn.ApiContractChecker.Dtos.Recipients.CheckRecipientDto"];

export const recipientsApi = {
  create: (input: CreateCheckRecipientDto) =>
    apiClient.post<CheckRecipientDto, CreateCheckRecipientDto>("/api/recipients", input),
  get: (id: string) => apiClient.get<CheckRecipientDto>(`/api/recipients/${id}`),
  list: (skipCount: number, maxResultCount: number) =>
    apiClient.get<CheckRecipientPage>("/api/recipients", {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  passivate: (id: string) => apiClient.post<CheckRecipientDto>(`/api/recipients/${id}/passivate`),
  update: (id: string, input: UpdateCheckRecipientDto) =>
    apiClient.put<CheckRecipientDto, UpdateCheckRecipientDto>(`/api/recipients/${id}`, input),
};
