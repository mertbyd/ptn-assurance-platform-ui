import type { Guid } from "@/db-types/api.types";

export interface DatabaseConnectionDto {
  id: Guid;
  engineId: Guid;
  engineCode: string;
  engineName: string;
  name: string;
  host: string;
  port: number;
  databaseName: string;
  isActive: boolean;
}

export interface CreateDatabaseConnectionDto {
  engineId: Guid;
  name: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  isActive: boolean;
}

export interface UpdateDatabaseConnectionDto {
  engineId: Guid;
  name: string;
  host: string;
  port: number;
  databaseName: string;
  username?: string | null;
  password?: string | null;
  isActive: boolean;
}

export interface TestConnectionResultDto {
  succeeded: boolean;
  serverVersion?: string | null;
  message?: string | null;
}
