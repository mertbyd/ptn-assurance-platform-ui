import { createCrudService } from "@/services/base.service";
import type {
  CreateEmailTemplateDto,
  EmailTemplateDto,
  UpdateEmailTemplateDto,
} from "@/types";

export const emailTemplatesService = createCrudService<EmailTemplateDto, CreateEmailTemplateDto, UpdateEmailTemplateDto>("/api/email-templates");
