export type OpenApiObject = Record<string, unknown>;

export interface OpenApiOperation {
  deprecated: boolean;
  description?: string;
  key: string;
  method: string;
  operationId: string;
  parameters: unknown[];
  path: string;
  raw: OpenApiObject;
  requestBody?: OpenApiObject;
  responses: OpenApiObject;
  security: unknown[];
  servers: unknown[];
  summary?: string;
  tags: string[];
}

export interface OpenApiTagGroup {
  description?: string;
  name: string;
  operations: OpenApiOperation[];
}

export interface OpenApiExplorerModel {
  document: OpenApiObject;
  info: OpenApiObject;
  operations: OpenApiOperation[];
  servers: unknown[];
  tags: OpenApiTagGroup[];
  version: string;
}

export interface OpenApiParseResult {
  error?: string;
  model?: OpenApiExplorerModel;
}
