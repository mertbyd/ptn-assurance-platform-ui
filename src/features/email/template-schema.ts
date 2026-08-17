import { z } from "zod";

import { t } from "@/i18n/tr";

const validation = t.email.templates.validation;

export const templateSchema = z.object({
  body: z.string().min(1, validation.bodyRequired),
  culture: z.string().trim().max(16, validation.cultureMax),
  description: z.string().trim().max(512, validation.descriptionMax),
  isLayout: z.boolean(),
  name: z.string().trim().min(1, validation.nameRequired).max(128, validation.nameMax),
  subject: z.string().trim().min(1, validation.subjectRequired).max(256, validation.subjectMax),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
