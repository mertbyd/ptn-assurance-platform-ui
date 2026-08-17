import { z } from "zod";

import { t } from "@/i18n/tr";

export const recipientSchema = z.object({
  displayName: z.string().trim().max(128, t.recipients.validation.displayNameMax),
  email: z
    .string()
    .trim()
    .min(1, t.recipients.validation.emailRequired)
    .max(256, t.recipients.validation.emailMax)
    .regex(z.regexes.email, t.recipients.validation.emailInvalid),
});

export type RecipientFormValues = z.infer<typeof recipientSchema>;
