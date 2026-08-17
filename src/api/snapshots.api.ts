import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export type SpecSnapshotDetailDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Snapshots.SpecSnapshotDetailDto"];

export const snapshotsApi = {
  get: (id: string) => apiClient.get<SpecSnapshotDetailDto>(`/api/snapshots/${id}`),
};
