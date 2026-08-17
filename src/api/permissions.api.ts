import type { components } from "./generated/schema";
import { apiClient, authClient } from "@/lib/api-client";

export type ApplicationConfigurationDto =
  components["schemas"]["Volo.Abp.AspNetCore.Mvc.ApplicationConfigurations.ApplicationConfigurationDto"];

export const permissionsApi = {
  getCurrent: () => apiClient.get<ApplicationConfigurationDto>("/api/abp/application-configuration"),
  getCurrentAuth: () => authClient.get<ApplicationConfigurationDto>("/api/abp/application-configuration"),
};
