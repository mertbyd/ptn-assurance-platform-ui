import apiClient from "@/lib/api-client";
import { requireEntityId } from "@/lib/guid";
import { createCreateUpdateService } from "@/services/base.service";
import type {
  CreateDatabaseConnectionDto,
  DatabaseConnectionDto,
  Guid,
  TestConnectionResultDto,
  UpdateDatabaseConnectionDto,
} from "@/types";

const baseService = createCreateUpdateService<DatabaseConnectionDto, CreateDatabaseConnectionDto, UpdateDatabaseConnectionDto>("/api/connections/database-connections");

export const databaseConnectionsService = {
  ...baseService,

  passivate(id: Guid): Promise<DatabaseConnectionDto> {
    return apiClient.post(`/api/connections/database-connections/${requireEntityId(id, "Bağlantı")}/passivate`);
  },

  testConnection(id: Guid): Promise<TestConnectionResultDto> {
    return apiClient.post(`/api/connections/database-connections/${requireEntityId(id, "Bağlantı")}/test-connection`);
  },
} as const;
