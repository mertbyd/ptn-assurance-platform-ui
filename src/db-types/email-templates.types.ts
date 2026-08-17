import type { Guid } from "@/db-types/api.types";

export interface EmailTemplateDto {
  id: Guid;
  name: string;
  culture: string;
  subject: string;
  body: string;
  isLayout: boolean;
  // Host'tan miras alinan (tenant'a ait olmayan) satir; backend duzenlemeyi/silmeyi reddeder.
  isInherited: boolean;
  description: string | null;
}

export interface CreateEmailTemplateDto {
  name: string;
  culture: string;
  subject: string;
  body: string;
  isLayout: boolean;
  description: string | null;
}

export type UpdateEmailTemplateDto = CreateEmailTemplateDto;
