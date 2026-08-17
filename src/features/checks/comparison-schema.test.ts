import { describe, expect, it } from "vitest";

import { comparisonSchema } from "./comparison-schema";

const validComparison = {
  baseDocumentId: "document-a",
  baseSnapshotId: "snapshot-a",
  baseSourceId: "source-a",
  ignoreInternal: false,
  scopeMode: "all" as const,
  scopeRules: [],
  targetDocumentId: "document-a",
  targetMode: "snapshot" as const,
  targetSnapshotId: "snapshot-b",
  targetSourceId: "source-a",
};

describe("comparisonSchema", () => {
  it("accepts two different snapshots", () => {
    expect(comparisonSchema.safeParse(validComparison).success).toBe(true);
  });

  it("rejects comparing a snapshot with itself", () => {
    const result = comparisonSchema.safeParse({ ...validComparison, targetSnapshotId: "snapshot-a" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "targetSnapshotId")).toBe(true);
  });

  it("requires at least one rule in custom scope mode", () => {
    const result = comparisonSchema.safeParse({ ...validComparison, scopeMode: "custom" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === "scopeRules")).toBe(true);
  });

  it("accepts a custom scope with a concrete rule", () => {
    const result = comparisonSchema.safeParse({
      ...validComparison,
      scopeMode: "custom",
      scopeRules: [{ kindCode: "include", pattern: "Payments", targetCode: "tag" }],
    });
    expect(result.success).toBe(true);
  });
});
