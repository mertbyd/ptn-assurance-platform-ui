import { z } from "zod";

import { t } from "@/i18n/tr";

const validation = t.email.sender.validation;

export const senderSchema = z
  .object({
    fromAddress: z
      .string()
      .trim()
      .min(1, validation.fromAddressRequired)
      .regex(z.regexes.email, validation.fromAddressInvalid),
    fromDisplayName: z.string().trim().max(128, validation.fromDisplayNameMax),
    smtpHost: z.string().trim().min(1, validation.smtpHostRequired).max(256, validation.smtpHostMax),
    smtpPassword: z.string(),
    smtpPort: z.coerce
      .number<number>()
      .int(validation.smtpPortRange)
      .min(1, validation.smtpPortRange)
      .max(65535, validation.smtpPortRange),
    smtpSecurity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    smtpUsername: z.string().trim(),
  })
  // Kimlik bilgisi Vault'a ikili yazilir: biri girildiyse digeri de zorunludur.
  .superRefine((value, context) => {
    if (value.smtpPassword && !value.smtpUsername) {
      context.addIssue({ code: "custom", message: validation.usernameRequired, path: ["smtpUsername"] });
    }

    if (value.smtpUsername && !value.smtpPassword) {
      context.addIssue({ code: "custom", message: validation.passwordRequired, path: ["smtpPassword"] });
    }
  });

export type SenderFormValues = z.infer<typeof senderSchema>;

export const testRecipientSchema = z.object({
  recipient: z
    .string()
    .trim()
    .min(1, validation.recipientRequired)
    .regex(z.regexes.email, validation.recipientInvalid),
});

export type TestRecipientFormValues = z.infer<typeof testRecipientSchema>;
