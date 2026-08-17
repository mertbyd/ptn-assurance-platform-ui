export interface ScopeRuleDto {
  scopeKindCode: string;
  schemaName: string;
  objectName?: string | null;
  childName?: string | null;
}
