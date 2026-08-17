import { z } from "zod";

import { t } from "@/i18n/tr";

export const tenantSchema = z.object({
  adminEmailAddress: z.string().trim().email(t.team.validation.emailInvalid),
  adminPassword: z.string().min(8, t.team.validation.passwordMin),
  name: z.string().trim().min(1, t.team.validation.tenantNameRequired).max(64, t.team.validation.tenantNameMax),
});

export const tenantRenameSchema = tenantSchema.pick({ name: true });

export const inviteMemberSchema = z.object({
  email: z.string().trim().email(t.team.validation.emailInvalid),
  roleNames: z.array(z.string()),
  userName: z.string().trim().max(256, t.team.validation.userNameMax),
});

export const userSchema = z.object({
  email: z.string().trim().email(t.team.validation.emailInvalid),
  isActive: z.boolean(),
  lockoutEnabled: z.boolean(),
  name: z.string().trim().max(64, t.team.validation.nameMax),
  phoneNumber: z.string().trim().max(32, t.team.validation.phoneMax),
  roleNames: z.array(z.string()),
  surname: z.string().trim().max(64, t.team.validation.surnameMax),
  userName: z.string().trim().min(1, t.team.validation.userNameRequired).max(256, t.team.validation.userNameMax),
});

export type TenantFormValues = z.infer<typeof tenantSchema>;
export type TenantRenameValues = z.infer<typeof tenantRenameSchema>;
export type InviteMemberValues = z.infer<typeof inviteMemberSchema>;
export type UserFormValues = z.infer<typeof userSchema>;
