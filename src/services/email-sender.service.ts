import apiClient from "@/lib/api-client";
import type { TenantEmailSenderDto, UpsertTenantEmailSenderDto } from "@/types";

// Tenant'in kendi gonderici (SMTP) config'i. apiClient token'daki tenant baglamini kullanir,
// yani giris yapmis tenant admin kendi tenant'i icin calisir. Host baglaminda backend reddeder.
export const emailSenderService = {
  get(): Promise<TenantEmailSenderDto> {
    return apiClient.get("/api/email/sender");
  },

  upsert(dto: UpsertTenantEmailSenderDto): Promise<TenantEmailSenderDto> {
    return apiClient.put("/api/email/sender", dto);
  },

  // Override'i temizler; tenant tekrar platform varsayilanini kullanir.
  clear(): Promise<TenantEmailSenderDto> {
    return apiClient.delete("/api/email/sender");
  },

  // Uc [FromBody] string bekler; JSON string olarak gonderiyoruz.
  sendTest(recipient: string): Promise<void> {
    return apiClient.post("/api/email/sender/test", JSON.stringify(recipient), {
      headers: { "Content-Type": "application/json" },
    });
  },
} as const;
