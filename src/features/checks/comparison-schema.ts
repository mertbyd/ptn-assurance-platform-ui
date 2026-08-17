import { z } from "zod";

import { t } from "@/i18n/tr";

export const scopeKinds = ["include", "exclude"] as const;
export const scopeTargets = ["path", "tag", "operation-id", "schema"] as const;
export const scopeModes = ["all", "custom"] as const;
export const targetModes = ["live", "snapshot"] as const;

const scopeRuleSchema = z.object({
  kindCode: z.enum(scopeKinds),
  pattern: z.string().trim().min(1, t.checks.validation.scopePatternRequired).max(256, t.checks.validation.scopePatternMax),
  targetCode: z.enum(scopeTargets),
});

export const comparisonSchema = z.object({
  baseDocumentId: z.string().min(1, t.checks.validation.documentRequired),
  baseSnapshotId: z.string().min(1, t.checks.validation.snapshotRequired),
  baseSourceId: z.string().min(1, t.checks.validation.sourceRequired),
  ignoreInternal: z.boolean(),
  scopeMode: z.enum(scopeModes),
  scopeRules: z.array(scopeRuleSchema).max(100),
  targetDocumentId: z.string().min(1, t.checks.validation.documentRequired),
  targetMode: z.enum(targetModes),
  targetSnapshotId: z.string(),
  targetSourceId: z.string().min(1, t.checks.validation.sourceRequired),
}).superRefine((value, context) => {
  if (value.targetSnapshotId && value.baseSnapshotId === value.targetSnapshotId) {
    context.addIssue({ code: "custom", message: t.checks.validation.snapshotsDifferent, path: ["targetSnapshotId"] });
  }
  if (value.scopeMode === "custom" && value.scopeRules.length === 0) {
    context.addIssue({ code: "custom", message: t.checks.validation.scopeSelectionRequired, path: ["scopeRules"] });
  }
});

export type ComparisonFormValues = z.infer<typeof comparisonSchema>;
