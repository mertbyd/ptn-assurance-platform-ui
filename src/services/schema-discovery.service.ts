import apiClient from "@/lib/api-client";
import { requireEntityId } from "@/lib/guid";
import type { DatabaseSchemaDto, DatabaseSchemaObjectDto, Guid, SchemaSnapshotDto } from "@/types";

export const schemaDiscoveryService = {
  getSchemas(connectionId: Guid): Promise<DatabaseSchemaDto[]> {
    return apiClient.get(`/api/comparison/schema-discovery/${requireEntityId(connectionId, "Bağlantı")}/schemas`);
  },

  getObjects(connectionId: Guid, schema: string): Promise<DatabaseSchemaObjectDto[]> {
    return apiClient.get(`/api/comparison/schema-discovery/${requireEntityId(connectionId, "Bağlantı")}/objects`, {
      params: { schema },
    });
  },

  getSnapshot(connectionId: Guid, schemaNames: string[] = []): Promise<SchemaSnapshotDto> {
    return apiClient.get(`/api/comparison/schema-discovery/${requireEntityId(connectionId, "Bağlantı")}/snapshot`, {
      params: { schemaNames },
      // ASP.NET Core List<string> binding'i `schemaNames=public&schemaNames=sales`
      // bicimini bekler. `schemaNames[]=...` gonderilirse filtre bos kalir ve backend
      // tum semalarin snapshot'ini dondurur.
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        (params.schemaNames as string[] | undefined)?.forEach((schemaName) => {
          searchParams.append("schemaNames", schemaName);
        });
        return searchParams.toString();
      },
    });
  },
} as const;
