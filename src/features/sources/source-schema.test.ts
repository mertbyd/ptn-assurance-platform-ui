import { describe, expect, it } from "vitest";

import { sourceSchema } from "./source-schema";

const validSource = {
  baseUrl: "https://api.example.com",
  documents: [{ documentName: "Public API", isActive: true, path: "/openapi.json" }],
  headerName: "",
  headerValue: "",
  name: "Example API",
};

describe("sourceSchema", () => {
  it("accepts a safe source with a relative document path", () => {
    expect(sourceSchema.safeParse(validSource).success).toBe(true);
  });

  it("requires credential header name and value together", () => {
    const result = sourceSchema.safeParse({ ...validSource, headerName: "X-Api-Key" });
    expect(result.success).toBe(false);
  });

  it("rejects absolute document URLs and duplicate names", () => {
    const result = sourceSchema.safeParse({
      ...validSource,
      documents: [
        { documentName: "Public API", isActive: true, path: "https://other.example.com/openapi.json" },
        { documentName: "public api", isActive: true, path: "/v2/openapi.json" },
      ],
    });
    expect(result.success).toBe(false);
  });
});
