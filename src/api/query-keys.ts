export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  checks: {
    all: ["checks"] as const,
    list: (skipCount: number, maxResultCount: number) => ["checks", "list", skipCount, maxResultCount] as const,
    detail: (id: string) => ["checks", "detail", id] as const,
    findings: (id: string, filters: string) => ["checks", "findings", id, filters] as const,
    report: (id: string) => ["checks", "report", id] as const,
    status: (id: string) => ["checks", "status", id] as const,
  },
  email: {
    // sender status — paneller senderStatus() fonksiyon olarak çağırıyor
    senderStatus: () => ["email", "sender", "status"] as const,
    sender: () => ["email", "sender"] as const,
    // templates — paneller templates() fonksiyon olarak çağırıyor
    templates: () => ["email", "templates"] as const,
    templateList: (skipCount: number, maxResultCount: number) =>
      ["email", "templates", "list", skipCount, maxResultCount] as const,
  },
  lookups: {
    all: ["lookups"] as const,
    list: (kind: string) => ["lookups", "list", kind] as const,
  },
  permissions: {
    authCurrent: (tenantId: string | null | undefined, userId: string) =>
      ["permissions", "auth-current", tenantId ?? "host", userId] as const,
    current: (tenantId: string | null | undefined, userId: string) =>
      ["permissions", "current", tenantId ?? "host", userId] as const,
  },
  recipients: {
    all: ["recipients"] as const,
    list: (skipCount: number, maxResultCount: number) => ["recipients", "list", skipCount, maxResultCount] as const,
  },
  sources: {
    all: ["sources"] as const,
    list: (skipCount: number, maxResultCount: number) => ["sources", "list", skipCount, maxResultCount] as const,
    detail: (id: string) => ["sources", "detail", id] as const,
    snapshots: (sourceId: string, documentId: string) =>
      ["sources", sourceId, "documents", documentId, "snapshots"] as const,
  },
  team: {
    all: ["team"] as const,
    operators: () => ["team", "operators"] as const,
    // argümansız versiyon — paneller parametre geçmeden çağırıyor
    tenants: (skipCount?: number, maxResultCount?: number) =>
      skipCount !== undefined
        ? ["team", "tenants", skipCount, maxResultCount] as const
        : ["team", "tenants"] as const,
    users: (tenantId: string) => ["team", "tenants", tenantId, "users"] as const,
    // argümansız versiyon — permissions-panel roles() ile çağırıyor
    roles: (tenantId?: string, userId?: string) =>
      tenantId && userId
        ? ["team", "tenants", tenantId, "users", userId, "roles"] as const
        : ["team", "roles"] as const,
    assignableRoles: (tenantId: string) => ["team", "tenants", tenantId, "assignable-roles"] as const,
    permissions: (tenantId: string, userId: string) =>
      ["team", "tenants", tenantId, "users", userId, "permissions"] as const,
  },
  snapshots: {
    detail: (id: string) => ["snapshots", "detail", id] as const,
  },
} as const;
