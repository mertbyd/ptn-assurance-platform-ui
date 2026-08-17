import { apiClient } from "@/lib/api-client";

export interface NotificationPublishDto {
  channel: string;
  /* Gövde kanala göre değişir ve istemci tarafında yorumlanmaz; `unknown` çağıranı
   * daraltmaya zorlar, `any` ise gövdeyi sessizce her şeye açardı. */
  payload: unknown;
}

export interface NotificationOutcomeDto {
  success: boolean;
  message?: string;
}

export const notificationsApi = {
  publish: (data: NotificationPublishDto) => 
    apiClient.post<NotificationOutcomeDto, NotificationPublishDto>("/api/notifications/publish", data),
    
  getOutcome: (id: string) => 
    apiClient.get<NotificationOutcomeDto>(`/api/notifications/${id}/outcome`),
    
  issueStreamTicket: () => 
    apiClient.post<{ ticket: string }>("/api/notifications/stream/ticket"),
} as const;
