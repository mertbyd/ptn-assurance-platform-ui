import { describe, expect, it } from "vitest";

import { parseOpenApiContent, resolveLocalReference } from "./parser";

const document = {
  components: { schemas: { Order: { properties: { id: { type: "string" } }, type: "object" } } },
  info: { title: "Orders API", version: "v1" },
  openapi: "3.0.4",
  paths: {
    "/orders": { get: { operationId: "listOrders", responses: { 200: { description: "OK" } }, tags: ["Orders"] } },
    "/orders/{id}": { parameters: [{ in: "path", name: "id", required: true }], post: { requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/Order" } } } }, responses: { 201: { description: "Created" } } } },
  },
  tags: [{ description: "Order operations", name: "Orders" }],
};

describe("parseOpenApiContent", () => {
  it("groups operations under declared and fallback tags", () => {
    const result = parseOpenApiContent(JSON.stringify(document), "Untagged");
    expect(result.model?.operations).toHaveLength(2);
    expect(result.model?.tags.map((tag) => tag.name)).toEqual(["Orders", "Untagged"]);
    expect(result.model?.tags[0].operations[0].operationId).toBe("listOrders");
    expect(result.model?.tags[1].operations[0].parameters).toHaveLength(1);
  });

  it("parses YAML documents", () => {
    const yaml = "openapi: 3.0.4\ninfo:\n  title: Demo\n  version: v1\npaths:\n  /health:\n    get:\n      responses:\n        '200':\n          description: OK\n";
    expect(parseOpenApiContent(yaml, "Untagged").model?.operations[0].path).toBe("/health");
  });

  it("resolves escaped local references", () => {
    const root = { components: { schemas: { "A/B": { type: "string" } } } };
    expect(resolveLocalReference(root, { $ref: "#/components/schemas/A~1B" })).toEqual({ type: "string" });
  });

  it("rejects content without an OpenAPI path surface", () => {
    expect(parseOpenApiContent("name: invalid", "Untagged").error).toBe("invalid-document");
  });
});
