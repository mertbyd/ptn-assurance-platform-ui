import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export type SpecSnapshotDetailDto =
  components["schemas"]["Ptn.ApiContractChecker.Dtos.Snapshots.SpecSnapshotDetailDto"];

/* Operasyon envanteri `CheckNexus.ApiContracts` **0.2.0-alpha.7** ile açıldı (KBP-630) ve
 * `0.2.0-alpha.9` ile tüketiliyor. `generated/schema.d.ts` 2026-08-07 tarihli olduğu için bu
 * yüzeyi içermiyor; tipler paketlenen kaynaktan (`checkers/api-contract`) elle hizalandı ve
 * Swagger tek kökenden yeniden üretildiğinde (G-03) üretilmiş tiplerle değiştirilecek.
 *
 * Satır bilinçli olarak dardır: yalnız kimlik, metot, yol ve şema referansları taşır —
 * ham spec gövdesi istemciye akmaz. Filtreler kapalı kümedir; serbest metin araması yoktur. */
export interface SnapshotOperationRowDto {
  operationId?: string | null;
  method: string;
  path: string;
  requestSchemaRef?: string | null;
  responseSchemaRef?: string | null;
}

export interface SnapshotOperationInventoryDto {
  totalCount: number;
  items: SnapshotOperationRowDto[];
  outcomeCode: string;
  requestedMaxResultCount: number;
  effectiveMaxResultCount: number;
  /** Sayfa/yanıt bütçesi aşıldıysa sonuç kırpılmıştır; ekran bunu "tamamlanmadı" der. */
  isTruncated: boolean;
  responseBytes: number;
}

export interface ListSnapshotOperationsInput {
  skipCount?: number;
  maxResultCount?: number;
  methodCode?: string;
  pathPrefix?: string;
  hasRequestBody?: boolean;
}

export interface FindOperationDto {
  httpMethod: string;
  path: string;
}

export interface DescribeSchemaDto {
  schemaName: string;
}

export const snapshotsApi = {
  get: (id: string) => apiClient.get<SpecSnapshotDetailDto>(`/api/snapshots/${id}`),
  listOperations: (id: string, params?: ListSnapshotOperationsInput) =>
    apiClient.get<SnapshotOperationInventoryDto>(`/api/snapshots/${id}/operations`, { params }),
  findOperation: (id: string, data: FindOperationDto) =>
    apiClient.post<unknown, FindOperationDto>(`/api/snapshots/${id}/operations/find`, data),
  describeSchema: (id: string, data: DescribeSchemaDto) =>
    apiClient.post<unknown, DescribeSchemaDto>(`/api/snapshots/${id}/schemas/describe`, data),
  /* Yazarlık sonucu opak referansla okunur; ajanın ürettiği ağır gövde bu adresin
   * arkasında durur (concise yanıt biçiminin `ResourceLink` karşılığı). */
  getAuthoringResult: (resultRef: string) =>
    apiClient.get<unknown>(`/api/snapshots/authoring-results/${resultRef}`),
};
