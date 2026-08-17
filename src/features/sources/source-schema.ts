import { z } from "zod";

import { t } from "@/i18n/tr";

const documentSchema = z.object({
  documentName: z.string().trim().min(1, t.sources.validation.documentNameRequired).max(64, t.sources.validation.documentNameMax),
  id: z.string().optional(),
  isActive: z.boolean(),
  path: z.string().trim().min(1, t.sources.validation.pathRequired).max(256, t.sources.validation.pathMax).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol !== "http:" && url.protocol !== "https:";
    } catch {
      return true;
    }
  }, t.sources.validation.pathRelative),
});

export const sourceSchema = z
  .object({
    baseUrl: z.string().trim().min(1, t.sources.validation.baseUrlRequired).max(512, t.sources.validation.baseUrlMax).refine((value) => {
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, t.sources.validation.baseUrlInvalid),
    documents: z.array(documentSchema).min(1, t.sources.validation.documentsRequired),
    headerName: z.string().trim().max(128, t.sources.validation.headerNameMax),
    headerValue: z.string().max(4096, t.sources.validation.headerValueMax).refine((value) => !/[\r\n]/.test(value), t.sources.validation.headerValueInvalid),
    name: z.string().trim().min(1, t.sources.validation.nameRequired).max(128, t.sources.validation.nameMax),
  })
  .superRefine((value, context) => {
    if (Boolean(value.headerName) !== Boolean(value.headerValue)) {
      context.addIssue({ code: "custom", message: t.sources.validation.credentialPair, path: [value.headerName ? "headerValue" : "headerName"] });
    }

    const names = value.documents.map((document) => document.documentName.toLocaleLowerCase("tr-TR"));
    if (new Set(names).size !== names.length) {
      context.addIssue({ code: "custom", message: t.sources.validation.documentNameDuplicate, path: ["documents"] });
    }
  });

export type SourceFormValues = z.infer<typeof sourceSchema>;
