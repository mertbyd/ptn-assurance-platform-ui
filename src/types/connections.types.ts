import type { Guid } from "@/types/api.types";

export interface DatabaseConnectionDto {
  id: Guid;
  engineId: Guid;
  engineCode: string;
  engineName: string;
  name: string;
  host: string;
  port: number;
  databaseName: string;
  tlsModeCode: string;
  trustServerCertificate: boolean;
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
  tlsModeCode: string;
  trustServerCertificate: boolean;
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
  tlsModeCode: string;
  trustServerCertificate: boolean;
  isActive: boolean;
}

export interface TestConnectionResultDto {
  succeeded: boolean;
  serverVersion?: string | null;
  message?: string | null;
  canWrite: boolean;
  isSuperUser: boolean;
  privilegeWarningCode?: string | null;
}
