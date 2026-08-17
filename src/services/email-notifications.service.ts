import apiClient from "@/lib/api-client";
import { requireEntityId } from "@/lib/guid";
import { createCrudService } from "@/services/base.service";
import type {
  ComparisonNotificationSettingsDto,
  ComparisonRecipientDto,
  CreateComparisonRecipientDto,
  UpdateComparisonRecipientDto,
} from "@/types";

// Backend (KBP-49): tenant genelinde serbest ad/e-posta alicisi, tam CRUD.
const recipientsPath = "/api/comparison-recipients";
const recipientCrud = createCrudService<ComparisonRecipientDto, CreateComparisonRecipientDto, UpdateComparisonRecipientDto>(recipientsPath);

export const emailNotificationsService = {
  ...recipientCrud,

  // No-diff bildirim tercihi — GET/PUT /api/email/notification-settings (PUT govdesi ham bool).
  getPreferences(): Promise<ComparisonNotificationSettingsDto> {
    return apiClient.get("/api/email/notification-settings");
  },

  updatePreferences(sendWhenNoDifferences: boolean): Promise<ComparisonNotificationSettingsDto> {
    return apiClient.put("/api/email/notification-settings", sendWhenNoDifferences);
  },

  // Tamamlanan bir run'in rapor mailini aktif aliciliara yeniden gonderir.
  resend(runId: string): Promise<void> {
    return apiClient.post(`/api/runs/comparison-runs/${requireEntityId(runId, "Çalıştırma")}/resend-email`);
  },
} as const;
