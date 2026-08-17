/**
 * API Contract Checker — uygunluk (conformance) ve teşhis yüzeyi.
 *
 * Kaynak otoritesi: `ptn-assurance-platform/checkers/api-contract` (paketlenen kaynak,
 * `CheckNexus.ApiContracts` **0.2.0-alpha.9**). Standalone `ptn-api-contract-checker`
 * deposu `0.1.0`'dır ve host onu TÜKETMEZ — sözleşme doğrulaması paketlenen kaynağa
 * karşı yapılır (CURRENT-0002 paket sınırı).
 *
 * > [!IMPORTANT] Tipler neden burada elle yazılı
 * > `generated/schema.d.ts` 2026-08-07 tarihlidir; conformance ailesi `alpha.5`
 * > (2026-08-14), operasyon envanteri `alpha.7` (2026-08-16) ile açıldı. Üretilmiş şema
 * > bu yüzeyleri **hiç içermiyor**. Swagger tek kökenden yeniden üretildiğinde (G-03)
 * > bu dosyanın tipleri üretilmiş olanlarla değiştirilir. `test.ts` köprü tipleri için de
 * > aynı geçici çözümü kullanıyor.
 */

import { apiClient } from "@/lib/api-client";

/* Gövde şekilleri checker'ın iç sözleşmesidir ve ekranlarda henüz tüketilmiyor; `unknown`
 * çağıranı daraltmaya zorlar, `any` sessizce her şeye izin verirdi. */
export interface DiagnoseRequestDto {
  connectionId?: string | null;
  signalCode: string;
  contextJson?: string | null;
}

export interface DiagnosisHypothesisDto {
  code: string;
  confidenceCode: string;
  description: string;
  evidence?: string[] | null;
}

export interface DiagnosisReportDto {
  runId?: string | null;
  signalCode: string;
  hypotheses: DiagnosisHypothesisDto[];
  generatedAt: string;
}

/* Uygunluk oracle'ı — kök `ApiContractCheckerRoutes.Conformance` = `api/contract-checks/conformance`.
 * Yedi uç `alpha.5` ile public sözleşmeye girdi (sample-sets ve operation-links dahil). */
export const conformanceApi = {
  response: (data: Record<string, unknown>) =>
    apiClient.post<unknown>("/api/contract-checks/conformance/response", data),
  request: (data: Record<string, unknown>) =>
    apiClient.post<unknown>("/api/contract-checks/conformance/request", data),
  requestExample: (data: Record<string, unknown>) =>
    apiClient.post<unknown>("/api/contract-checks/conformance/request-example", data),
  operationBindings: (data: Record<string, unknown>) =>
    apiClient.post<unknown>("/api/contract-checks/conformance/operation-bindings", data),
  assertionDerivability: (data: Record<string, unknown>) =>
    apiClient.post<unknown>("/api/contract-checks/conformance/assertion-derivability", data),
  sampleSets: (data: Record<string, unknown>) =>
    apiClient.post<unknown>("/api/contract-checks/conformance/sample-sets", data),
  operationLinks: (data: Record<string, unknown>) =>
    apiClient.post<unknown>("/api/contract-checks/conformance/operation-links", data),
};

export const contractDiagnosisApi = {
  diagnose: (data: DiagnoseRequestDto) =>
    apiClient.post<DiagnosisReportDto, DiagnoseRequestDto>("/api/contract-checks/diagnosis", data),
};
