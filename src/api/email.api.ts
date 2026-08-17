import type { components } from "./generated/schema";
import { apiClient } from "@/lib/api-client";

export type EmailProviderStatusDto = components["schemas"]["Piton.Emailing.Dtos.Emailing.EmailProviderStatusDto"];
export type EmailAuthorizationDto = components["schemas"]["Piton.Emailing.Dtos.Emailing.EmailAuthorizationDto"];
export type EmailTemplateDto = components["schemas"]["Piton.Emailing.EmailTemplates.EmailTemplateDto"];
export type CreateEmailTemplateDto = components["schemas"]["Piton.Emailing.EmailTemplates.CreateEmailTemplateDto"];
export type UpdateEmailTemplateDto = components["schemas"]["Piton.Emailing.EmailTemplates.UpdateEmailTemplateDto"];
export type EmailTemplatePage =
  components["schemas"]["Volo.Abp.Application.Dtos.PagedResultDtoOfPiton.Emailing.EmailTemplates.EmailTemplateDto"];

export const emailSenderApi = {
  get: () => apiClient.get<EmailProviderStatusDto>("/api/emailing/platform/status"),
  getGoogleAuthorization: () =>
    apiClient.get<EmailAuthorizationDto>("/api/emailing/platform/google/authorization"),
  sendTest: (recipient: string) =>
    apiClient.post<void, { to: string }>("/api/emailing/platform/test", { to: recipient }),
};

export const emailTemplatesApi = {
  create: (input: CreateEmailTemplateDto) =>
    apiClient.post<EmailTemplateDto, CreateEmailTemplateDto>("/api/email-templates", input),
  list: (skipCount: number, maxResultCount: number) =>
    apiClient.get<EmailTemplatePage>("/api/email-templates", {
      params: { MaxResultCount: maxResultCount, SkipCount: skipCount },
    }),
  remove: (id: string) => apiClient.delete<void>(`/api/email-templates/${id}`),
  update: (id: string, input: UpdateEmailTemplateDto) =>
    apiClient.put<EmailTemplateDto, UpdateEmailTemplateDto>(`/api/email-templates/${id}`, input),
};

export const emailApi = {
  sender: emailSenderApi,
  templates: emailTemplatesApi,
};

