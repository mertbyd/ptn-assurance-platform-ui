import { z } from "zod";

import { t } from "@/i18n/tr";

export const lookupSchema = z.object({
  code: z.string().trim().min(1, t.lookups.validation.codeRequired).max(64, t.lookups.validation.codeMax).regex(/^[a-z0-9][a-z0-9-]*$/, t.lookups.validation.codeFormat),
  description: z.string().trim().max(512, t.lookups.validation.descriptionMax),
  isActive: z.boolean(),
  name: z.string().trim().min(1, t.lookups.validation.nameRequired).max(128, t.lookups.validation.nameMax),
});

export type LookupFormValues = z.infer<typeof lookupSchema>;
